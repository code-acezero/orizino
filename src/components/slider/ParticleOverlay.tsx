import React, { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeDir: number;
}

const PARTICLE_COUNT = 40;

const ParticleOverlay: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    if (!width || !height) return;

    // Seed particles
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.3 - 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles.current) {
        // Move
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.fadeDir * 0.003;

        // Fade bounds
        if (p.opacity >= 0.6) p.fadeDir = -1;
        if (p.opacity <= 0.05) p.fadeDir = 1;

        // Wrap
        if (p.y < -5) { p.y = height + 5; p.x = Math.random() * width; }
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }
      raf.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf.current);
  }, [width, height]);

  if (!width || !height) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 z-[15] pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default React.memo(ParticleOverlay);
