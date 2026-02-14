import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface ExamHeaderProps {
  examTitle: string;
  studentName: string;
  timer: {
    formattedTime: string;
    isDanger: boolean;
    isCritical: boolean;
  };
  progress: number;
  violations: number;
  maxViolations: number;
}

export function ExamHeader({ examTitle, studentName, timer, progress, violations, maxViolations }: ExamHeaderProps) {
  const violationPercentage = (violations / maxViolations) * 100;

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-3 lg:px-4 lg:py-4">
        {/* Mobile: single row; Desktop: full layout */}
        <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3 lg:flex-nowrap lg:flex-row lg:justify-between lg:gap-4">
          {/* Exam Title & Student */}
          <div className="min-w-0 flex-1 sm:flex-initial">
            <h1 className="text-sm sm:text-base lg:text-xl font-bold text-foreground truncate">
              {examTitle}
            </h1>
            <p className="hidden lg:block text-sm text-muted-foreground">{studentName}</p>
          </div>

          {/* Timer - always visible */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Clock
              className={cn(
                "w-4 h-4 sm:w-5 sm:h-5",
                timer.isDanger && "text-destructive",
                timer.isCritical && !timer.isDanger && "text-orange-600",
                !timer.isDanger && !timer.isCritical && "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "timer text-lg sm:text-xl lg:text-2xl font-bold tabular-nums",
                timer.isDanger && "text-destructive animate-pulse",
                timer.isCritical && !timer.isDanger && "text-orange-600",
                !timer.isDanger && !timer.isCritical && "text-foreground"
              )}
            >
              {timer.formattedTime}
            </span>
          </div>

          {/* Progress Bar - hidden on smallest screens, compact otherwise */}
          <div className="hidden sm:block lg:flex-1 lg:max-w-xs">
            <div className="flex items-center justify-between text-xs lg:text-sm text-muted-foreground mb-0.5 lg:mb-1">
              <div className="flex items-center gap-1.5 lg:gap-2">
                <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Progress</span>
              </div>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="progress-bar h-1.5 lg:h-2" role="progressbar" aria-label="Exam progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Violations Counter & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Badge
              variant={
                violations >= maxViolations
                  ? 'destructive'
                  : violationPercentage >= 70
                  ? 'destructive'
                  : violationPercentage >= 40
                  ? 'outline'
                  : 'secondary'
              }
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5",
                violations >= maxViolations && "animate-pulse",
                violationPercentage >= 70 && violationPercentage < 100 && "bg-orange-500/10 text-orange-700 border-orange-500/20",
                violationPercentage >= 40 && violationPercentage < 70 && "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
                violationPercentage < 40 && "bg-green-500/10 text-green-700 border-green-500/20"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-semibold">
                {violations} / {maxViolations}
              </span>
              <span className="hidden sm:inline">Violations</span>
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
