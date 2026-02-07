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
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Exam Title & Student */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-foreground">{examTitle}</h1>
            <p className="text-sm text-muted-foreground">{studentName}</p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock
              className={cn(
                "w-5 h-5",
                timer.isDanger && "text-destructive",
                timer.isCritical && !timer.isDanger && "text-orange-600",
                !timer.isDanger && !timer.isCritical && "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "timer text-2xl font-bold tabular-nums",
                timer.isDanger && "text-destructive animate-pulse",
                timer.isCritical && !timer.isDanger && "text-orange-600",
                !timer.isDanger && !timer.isCritical && "text-foreground"
              )}
            >
              {timer.formattedTime}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </div>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Violations Counter & Theme Toggle */}
          <div className="flex items-center gap-3">
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
                "flex items-center gap-2 px-3 py-1.5",
                violations >= maxViolations && "animate-pulse",
                violationPercentage >= 70 && violationPercentage < 100 && "bg-orange-500/10 text-orange-700 border-orange-500/20",
                violationPercentage >= 40 && violationPercentage < 70 && "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
                violationPercentage < 40 && "bg-green-500/10 text-green-700 border-green-500/20"
              )}
            >
              <AlertTriangle className="w-4 h-4" />
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
