import { Fragment } from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Horizontal progress tracker that guides the user through the profile
 * completion flow: fill in profile → pass review → ECR test → MBTI test.
 * Purely presentational and server-component friendly.
 */
export function ProfileProgress({
  hasProfile,
  approved,
  hasEcr,
  hasMbti,
}: {
  hasProfile: boolean;
  approved: boolean;
  hasEcr: boolean;
  hasMbti: boolean;
}) {
  const steps = [
    { label: "填写资料", done: hasProfile },
    { label: "审核通过", done: approved },
    { label: "依恋测试", done: hasEcr },
    { label: "MBTI测试", done: hasMbti },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">完善资料进度</h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {doneCount}/{steps.length}
          </span>
        </div>

        <div className="flex items-start">
          {steps.map((step, i) => (
            <Fragment key={step.label}>
              <div className="flex flex-col items-center gap-2 w-16 shrink-0">
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    step.done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
                  )}
                >
                  {step.done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs text-center leading-tight",
                    step.done
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mt-[1.0625rem]",
                    steps[i + 1].done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
