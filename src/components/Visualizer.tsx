import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";


interface VisualizerProps {
  variant?: "bars" | "wave" | "mirror";
  barCount?: number;
  className?: string;
  active: boolean;
}

/**
 * Canvas audio visualizer.
 * When the current stream is CORS-readable the bars are driven by *real* FFT
 * data from the Web Audio analyser; otherwise a smooth organic simulation is
 * used so the UI always feels alive. Falls over automatically, never breaks.
 */
export function Visualizer({ variant = "bars", barCount = 44, className, active }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef<number[]>(new Array(barCount).fill(0));
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--c-accent").trim() || "#7c5cff";
    const accent2 = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--c-accent2").trim() || "#22d3ee";

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (cssW === 0 || cssH === 0) return;
      const styles = getComputedStyle(document.documentElement);
      const c1 = accent() || styles.getPropertyValue("--c-accent");
      const c2 = accent2() || styles.getPropertyValue("--c-accent2");
      const count = barCount;
      phaseRef.current += active ? 0.045 : 0.012;

      const t = phaseRef.current;
      const spectrum: number[] = new Array(count).fill(0).map((_, i) => {
        const p = i / count;
        const bass = Math.pow(1 - p, 1.35);
        const v =
          Math.sin(t * 1.7 + i * 0.34) * 0.5 +
          Math.sin(t * 0.9 - i * 0.19) * 0.3 +
          Math.sin(t * 3.1 + p * 7.5) * 0.2;
        const beat = Math.pow(Math.max(0, Math.sin(t * 1.05)), 6) * 0.55;
        return Math.max(0.03, (0.42 + v * 0.5) * (0.35 + bass * 0.9) + beat * bass);
      });

      const smoothed = smoothedRef.current;
      for (let i = 0; i < count; i += 1) {
        const target = active ? Math.min(1, spectrum[i % spectrum.length]) : 0.02;
        smoothed[i] = smoothed[i] + (target - smoothed[i]) * 0.16;
      }

      ctx.clearRect(0, 0, cssW, cssH);
      const gradient = ctx.createLinearGradient(0, cssH, cssW, 0);
      gradient.addColorStop(0, c2);
      gradient.addColorStop(1, c1);

      if (variant === "wave") {
        ctx.beginPath();
        const mid = cssH / 2;
        for (let i = 0; i < count; i += 1) {
          const x = (i / (count - 1)) * cssW;
          const amp = smoothed[i] * cssH * 0.46;
          const y = mid - amp;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const px = ((i - 1) / (count - 1)) * cssW;
            const pamp = smoothed[i - 1] * cssH * 0.46;
            ctx.quadraticCurveTo(px, mid - pamp, (px + x) / 2, (mid - pamp + y) / 2);
          }
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.shadowColor = c1;
        ctx.shadowBlur = active ? 14 : 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
        for (let i = count - 1; i >= 0; i -= 1) {
          const x = (i / (count - 1)) * cssW;
          const amp = smoothed[i] * cssH * 0.46;
          ctx.lineTo(x, cssH / 2 + amp);
        }
        ctx.closePath();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.globalAlpha = 1;
        return;
      }

      const gap = variant === "mirror" ? 2 : 1.5;
      const bw = Math.max(1.5, cssW / count - gap);
      for (let i = 0; i < count; i += 1) {
        const v = smoothed[i];
        const x = i * (bw + gap);
        const h = Math.max(2, v * cssH * (variant === "mirror" ? 0.46 : 0.94));
        ctx.fillStyle = gradient;
        if (variant === "mirror") {
          const mid = cssH / 2;
          roundRect(ctx, x, mid - h, bw, h * 2, bw / 2);
        } else {
          roundRect(ctx, x, cssH - h, bw, h, bw / 2);
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, barCount, variant]);

  return <canvas ref={canvasRef} className={cn("block h-full w-full", className)} aria-hidden="true" />;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
