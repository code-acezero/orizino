import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn, Minus, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  discount?: number;
  layout?: "minimal" | "premium" | "editorial";
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName, discount = 0, layout = "premium" }) => {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [lensSize, setLensSize] = useState(160);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
  const [pinchScale, setPinchScale] = useState(1);
  const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
  const pinchStartScale = useRef(1);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isSwiping = useRef(false);
  const lightboxImgRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const navigate = (dir: 1 | -1) => {
    setSelected((p) => (p + dir + images.length) % images.length);
    setPinchScale(1);
  };

  // Pinch-to-zoom handlers for lightbox
  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isSwiping.current = false;
      pinchStartDist.current = getTouchDist(e.touches);
      pinchStartScale.current = pinchScale;
      const rect = lightboxImgRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        setPinchOrigin({
          x: ((cx - rect.left) / rect.width) * 100,
          y: ((cy - rect.top) / rect.height) * 100,
        });
      }
    } else if (e.touches.length === 1 && pinchScale <= 1) {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
      isSwiping.current = true;
    }
  }, [pinchScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isSwiping.current = false;
      const dist = getTouchDist(e.touches);
      const newScale = Math.min(5, Math.max(1, pinchStartScale.current * (dist / pinchStartDist.current)));
      setPinchScale(newScale);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (pinchScale < 1.1) setPinchScale(1);

    if (isSwiping.current && e.changedTouches.length === 1 && pinchScale <= 1) {
      const dx = e.changedTouches[0].clientX - swipeStartX.current;
      const dy = e.changedTouches[0].clientY - swipeStartY.current;
      // Only swipe if horizontal movement is dominant and exceeds threshold
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        navigate(dx < 0 ? 1 : -1);
      }
    }
    isSwiping.current = false;
  }, [pinchScale, images.length]);

  const isMinimal = layout === "minimal";
  const isEditorial = layout === "editorial";


  return (
    <>
      <div className={`space-y-3 ${isEditorial ? "md:col-span-3" : ""}`}>
        {/* Main image with zoom */}
        <div
          ref={imgRef}
          className={`relative overflow-hidden group ${
            isMobile ? "cursor-default" : "cursor-zoom-in"
          } ${isMinimal ? "rounded-2xl" : isEditorial ? "rounded-none aspect-[4/3]" : "rounded-3xl aspect-square glass"}`}
          {...(!isMobile ? {
            onMouseEnter: (e: React.MouseEvent) => {
              setIsZooming(true);
              const rect = imgRef.current?.getBoundingClientRect();
              if (rect) {
                setRipplePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                setShowRipple(true);
                setTimeout(() => setShowRipple(false), 600);
              }
            },
            onMouseLeave: () => setIsZooming(false),
            onMouseMove: handleMouseMove,
            onWheel: (e: React.WheelEvent) => {
              if (isZooming) {
                e.preventDefault();
                setLensSize((s) => Math.min(300, Math.max(80, s + (e.deltaY < 0 ? 20 : -20))));
              }
            },
          } : {})}
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={selected}
              src={images[selected]}
              alt={productName}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full h-full object-cover absolute inset-0"
            />
          </AnimatePresence>

          {/* Ripple effect */}
          <AnimatePresence>
            {showRipple && (
              <motion.div
                className="absolute pointer-events-none z-20 rounded-full border-2 border-primary/40"
                style={{ left: ripplePos.x, top: ripplePos.y }}
                initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.8 }}
                animate={{ width: 200, height: 200, x: -100, y: -100, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* Liquid loupe magnifier — desktop only */}
          {!isMobile && isZooming && (
            <motion.div
              className="absolute pointer-events-none z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              style={{
                width: lensSize,
                height: lensSize,
                borderRadius: "50%",
                left: mousePos.x - lensSize / 2,
                top: mousePos.y - lensSize / 2,
                backgroundImage: `url(${images[selected]})`,
                backgroundSize: `${imgRef.current?.offsetWidth ? imgRef.current.offsetWidth * 2.5 : 1000}px ${imgRef.current?.offsetHeight ? imgRef.current.offsetHeight * 2.5 : 1000}px`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                border: "3px solid hsl(var(--primary) / 0.4)",
                boxShadow: "0 0 0 2px hsl(var(--background) / 0.6), 0 8px 32px hsl(var(--primary) / 0.2), inset 0 0 30px hsl(var(--primary) / 0.05)",
                transition: "width 0.2s ease, height 0.2s ease, left 0.05s linear, top 0.05s linear",
              }}
            />
          )}

          {/* Lens size controls — desktop only */}
          {!isMobile && isZooming && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 glass rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setLensSize((s) => Math.max(80, s - 30)); }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-muted-foreground font-medium w-6 text-center">{Math.round(lensSize)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setLensSize((s) => Math.min(300, s + 30)); }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}


          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 glass rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="w-4 h-4 text-foreground" />
          </div>

          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-3 top-1/2 -translate-y-1/2 glass rounded-full p-2 text-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 glass rounded-full p-2 text-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {discount > 0 && (
            <span className={`absolute top-4 left-4 text-sm font-semibold py-1 px-4 ${
              isMinimal ? "bg-foreground text-background rounded-md" : "btn-pill bg-destructive text-destructive-foreground"
            }`}>
              -{discount}%
            </span>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <span className="absolute bottom-4 left-4 glass rounded-full px-3 py-1 text-xs text-foreground font-medium">
              {selected + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`shrink-0 overflow-hidden transition-all duration-200 ${
                  isMinimal ? "w-16 h-16 rounded-lg" : "w-20 h-20 rounded-2xl"
                } border-2 ${i === selected ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button className="absolute top-6 right-6 glass rounded-full p-3 text-foreground hover:text-primary z-10" onClick={() => setLightboxOpen(false)}>
              <X className="w-6 h-6" />
            </button>

            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute left-6 top-1/2 -translate-y-1/2 glass rounded-full p-3 text-foreground hover:text-primary z-10">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="absolute right-6 top-1/2 -translate-y-1/2 glass rounded-full p-3 text-foreground hover:text-primary z-10">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div
              ref={lightboxImgRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={selected}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: pinchScale }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={images[selected]}
                alt={productName}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
                style={{ transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%` }}
                onDoubleClick={() => setPinchScale((s) => s > 1 ? 1 : 2.5)}
              />
            </div>

            {/* Zoom level indicator */}
            {pinchScale > 1 && (
              <div className="absolute top-6 left-6 glass rounded-full px-3 py-1.5 text-xs text-foreground font-medium">
                {pinchScale.toFixed(1)}x
              </div>
            )}

            {/* Lightbox thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === selected ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;
