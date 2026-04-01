import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

export function MonthNavigation({
  monthYearLabel,
  isCurrentMonth,
  onPrev,
  onNext,
  onToday,
  disableNext
}: {
  monthYearLabel: string;
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  disableNext: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors"
        title="Previous month"
      >
        <ChevronLeftIcon size={16} />
      </button>
      <div className="flex-1 text-center">
        <button
          onClick={onToday}
          className={`text-xs font-mono uppercase tracking-wider transition-colors ${
            isCurrentMonth ? 'text-foreground font-semibold' : 'text-muted hover:text-foreground'
          }`}
          title="Jump to current month"
        >
          {monthYearLabel}
        </button>
      </div>
      <button
        onClick={onNext}
        className="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={disableNext}
        title="Next month"
      >
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}
