import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

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
  const [pinchScale, setPinchScale] = useState(1);
  const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const lightboxImgRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
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
    }
  }, [pinchScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const newScale = Math.min(5, Math.max(1, pinchStartScale.current * (dist / pinchStartDist.current)));
      setPinchScale(newScale);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pinchScale < 1.1) setPinchScale(1);
  }, [pinchScale]);

  const isMinimal = layout === "minimal";
  const isEditorial = layout === "editorial";

  return (
    <>
      <div className={`space-y-3 ${isEditorial ? "md:col-span-3" : ""}`}>
        {/* Main image with zoom */}
        <div
          ref={imgRef}
          className={`relative overflow-hidden cursor-zoom-in group ${
            isMinimal ? "rounded-2xl" : isEditorial ? "rounded-none aspect-[4/3]" : "rounded-3xl aspect-square glass"
          }`}
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
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
              style={isZooming ? { transform: "scale(2)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
            />
          </AnimatePresence>

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
