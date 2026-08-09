import { Check } from "lucide-react";
import { tokens } from "@/lib/tokens";

/** Numbered-circle step header - same visual pattern as the loan application
 * wizard (/loans/apply): completed steps turn green with a checkmark, the
 * current step is blue, upcoming steps are outlined and unclickable. */
export function WizardStepper({
  steps,
  currentIndex,
  furthestIndex,
  onStepClick,
}: {
  steps: string[];
  currentIndex: number;
  furthestIndex: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length},1fr)` }}>
      {steps.map((label, i) => {
        const completed = i < currentIndex;
        const isCurrent = i === currentIndex;
        const reachable = i <= furthestIndex;
        const color = completed ? tokens.success : isCurrent ? tokens.accent : tokens.textMuted;
        return (
          <button
            key={label}
            type="button"
            disabled={!reachable}
            onClick={() => onStepClick(i)}
            className="flex flex-col items-center gap-2"
            style={{
              background: "transparent",
              border: "none",
              textAlign: "center",
              cursor: reachable ? "pointer" : "default",
              padding: 0,
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: completed ? tokens.success : isCurrent ? "#EEF2FB" : "#F1F4FA",
                color: completed ? "#fff" : isCurrent ? tokens.accent : tokens.textMuted,
                border: isCurrent
                  ? `1px solid ${tokens.accent}`
                  : !completed
                    ? `1px solid ${tokens.border}`
                    : undefined,
              }}
            >
              {completed ? <Check size={13} /> : i + 1}
            </div>
            <div style={{ fontSize: 11, color, fontWeight: isCurrent ? 700 : 300 }}>{label}</div>
          </button>
        );
      })}
    </div>
  );
}
