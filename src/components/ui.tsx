import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { X, Loader2, Music2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { gradientFrom, initials } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { clamp } from "@/utils/format";

/* ------------------------------- Artwork --------------------------------- */
export function Artwork({
  src,
  fallbackSrc,
  alt,
  className,
  rounded = "rounded-xl",
  eager = false,
}: {
  src?: string;
  /** tried automatically if `src` 404s / 500s before falling back to the gradient */
  fallbackSrc?: string;
  alt: string;
  className?: string;
  rounded?: string;
  /** above-the-fold images (hero) — prioritize fetch instead of lazy loading */
  eager?: boolean;
}) {
  const [stage, setStage] = useState(0);
  useEffect(() => setStage(0), [src, fallbackSrc]);
  const chain = [src, fallbackSrc].filter(Boolean) as string[];
  const active = chain[stage];
  const failed = stage >= chain.length;
  const showImage = Boolean(active) && !failed;
  return (
    <div
      className={cn("relative overflow-hidden bg-elev2", rounded, className)}
      style={{ containerType: "inline-size" }}
    >
      {showImage ? (
        <img
          key={active}
          src={active}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding={eager ? "sync" : "async"}
          onError={() => setStage((s) => s + 1)}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-ink/80"
          style={{ backgroundImage: gradientFrom(alt) }}
        >
          {initials(alt) ? (
            <span className="text-[clamp(0.7rem,22cqw,2.4rem)] font-bold tracking-tight text-white/90 drop-shadow">
              {initials(alt)}
            </span>
          ) : (
            <Music2 className="h-[38%] w-[38%] text-white/85 drop-shadow" strokeWidth={1.75} />
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Icon button ------------------------------- */
export function IconButton({
  children,
  active,
  className,
  size = "md",
  ref,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  size?: "sm" | "md" | "lg";
  ref?: Ref<HTMLButtonElement>;
}) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" } as const;
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        "focus-ring glass-inset inline-flex shrink-0 items-center justify-center rounded-full text-ink2 transition-all duration-200",
        "hover:bg-ink/[0.08] hover:text-ink active:scale-90 active:brightness-110",
        active && "bg-accent/12 text-accent hover:text-accent",
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Button ---------------------------------- */
export function Button({
  children,
  className,
  variant = "solid",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline" }) {
  return (
    <button
      type="button"
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40",
        variant === "solid" && "bg-accent text-white hover:brightness-110 glow-soft shadow-[0_14px_34px_-18px_var(--c-accent)]",
        variant === "outline" && "glass-inset border border-line bg-white/[0.02] text-ink hover:border-accent hover:text-accent",
        variant === "ghost" && "text-ink2 hover:bg-ink/[0.08] hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Spinner --------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-accent", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

/* --------------------------------- Chip ----------------------------------- */
export function Chip({
  children,
  active,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "focus-ring glass-inset shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200",
        active
          ? "border-transparent bg-accent text-white shadow-[0_8px_26px_-10px_var(--c-accent)]"
          : "border-line bg-white/[0.02] text-ink2 hover:border-accent/60 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Section head ------------------------------ */
export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0 max-w-[56rem]">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink sm:text-xl">
          {icon}
          <span className="text-balance leading-tight">{title}</span>
        </h2>
        {subtitle && <p className="mt-1 max-w-[52rem] text-xs leading-relaxed text-ink3 sm:text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Equalizer --------------------------------- */
export function Equalizer({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("flex h-3.5 items-end gap-[2px]", className)}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn("w-[2px] rounded-full bg-accent", active ? "eq-bar" : "opacity-40")}
          style={{
            height: "100%",
            animationDelay: `${i * 0.13}s`,
            animationDuration: `${0.7 + i * 0.09}s`,
            transform: active ? undefined : "scaleY(0.3)",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

/* --------------------------------- Slider --------------------------------- */
export function Slider({
  value,
  max,
  buffered,
  onChange,
  onCommit,
  className,
  height = "h-1.5",
  disabled,
  ariaLabel,
}: {
  value: number;
  max: number;
  buffered?: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  className?: string;
  height?: string;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  const bufPct = max > 0 ? clamp(((buffered ?? 0) / max) * 100, 0, 100) : 0;

  const positionToValue = (clientX: number) => {
    const el = ref.current;
    if (!el || max <= 0) return 0;
    const rect = el.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1) * max;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || max <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(positionToValue(e.clientX));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onChange(positionToValue(e.clientX));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const v = positionToValue(e.clientX);
    setDragging(false);
    onCommit?.(v);
    onChange(v);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(value)}
      aria-valuemax={Math.round(max)}
      aria-valuemin={0}
      tabIndex={0}
      onKeyDown={(e) => {
        if (disabled || max <= 0) return;
        if (e.key === "ArrowRight") onCommit?.(clamp(value + max * 0.03, 0, max));
        if (e.key === "ArrowLeft") onCommit?.(clamp(value - max * 0.03, 0, max));
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDragging(false)}
      className={cn("group/slider relative flex cursor-pointer touch-none items-center py-2", disabled && "opacity-50", className)}
    >
      <div className={cn("relative w-full overflow-hidden rounded-full bg-ink/15", height)}>
        {buffered !== undefined && (
          <div className="absolute inset-y-0 left-0 rounded-full bg-ink/15 transition-[width] duration-300" style={{ width: `${bufPct}%` }} />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--c-accent2), var(--c-accent))",
            boxShadow: "0 0 12px color-mix(in oklab, var(--c-accent) 60%, transparent)",
          }}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink shadow transition-opacity",
          dragging ? "opacity-100" : "opacity-0 group-hover/slider:opacity-100",
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

/* --------------------------------- Modal ---------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          "blur-panel relative z-10 w-full animate-slide-up p-5 shadow-2xl sm:animate-scale-in",
          maxWidth,
          "rounded-b-none sm:rounded-[var(--panel-radius)]",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <IconButton size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- Toaster --------------------------------- */
export function Toaster() {
  const { toasts, dismissToast } = usePlayer();
  return (
    <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] left-1/2 z-[95] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2 sm:bottom-[calc(env(safe-area-inset-bottom)+6rem)] sm:left-6 sm:translate-x-0">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={cn(
            "blur-panel pointer-events-auto flex animate-fade-up items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium shadow-xl",
            t.tone === "error" ? "text-rose-300" : t.tone === "success" ? "text-accent" : "text-ink",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              t.tone === "error" ? "bg-rose-400" : t.tone === "success" ? "bg-accent" : "bg-ink2",
            )}
          />
          <span className="line-clamp-2">{t.text}</span>
        </button>
      ))}
    </div>
  );
}
