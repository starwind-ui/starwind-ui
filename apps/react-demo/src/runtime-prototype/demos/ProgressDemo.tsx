import { useState } from "react";
import { Button, Progress } from "../kit";

const progressVariants = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export function ProgressDemo() {
  const [interactiveValue, setInteractiveValue] = useState(25);

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Progress</h2>
      <div className="max-w-lg space-y-4">
        <Progress
          id="react-runtime-progress-default"
          value={40}
          variant="primary"
          label="React upload progress"
        />
        <div className="grid gap-3">
          {progressVariants.map((variant, index) => (
            <div key={variant} className="grid gap-1">
              <span className="text-sm font-medium capitalize">{variant}</span>
              <Progress
                id={`react-runtime-progress-variant-${variant}`}
                value={15 + index * 12}
                variant={variant}
                label={`React runtime ${variant} progress`}
              />
            </div>
          ))}
        </div>
        <Progress
          id="react-runtime-progress-indeterminate"
          variant="warning"
          label="React sync progress"
        />
        <Progress
          id="react-runtime-progress-updating"
          value={interactiveValue}
          variant="success"
          label="React processing progress"
        />
        <Button
          id="react-runtime-progress-toggle"
          variant="outline"
          onClick={() => setInteractiveValue((value) => (value === 75 ? 25 : 75))}
        >
          Toggle Progress (25% to 75%)
        </Button>
      </div>
    </section>
  );
}
