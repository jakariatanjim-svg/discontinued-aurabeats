import { CloudOff, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="blur-panel flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
        <CloudOff className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-bold text-ink">The open network is not responding</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink3">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try another mirror
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="blur-panel flex flex-col items-center gap-3 p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <Sparkles className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        {hint && <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink3">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
