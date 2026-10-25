import { StepIcon } from "./illustrations/Icons";

export function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
      {steps.map((step, i) => {
        return (
          <li key={step.title} className="flex gap-4 border-t border-ink pt-5">
            <StepIcon index={i} className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <p className="font-serif text-sm text-muted tabular-nums">Step {i + 1}</p>
              <h3 className="mt-1 text-xl leading-snug">{step.title}</h3>
              <p className="mt-2 text-ink-soft">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
