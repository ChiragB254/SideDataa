export function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      {steps.map((step, i) => (
        <li key={step.title} className="border-t border-ink pt-4">
          <p className="font-serif text-sm text-muted tabular-nums">Step {i + 1}</p>
          <h3 className="mt-1 text-xl leading-snug">{step.title}</h3>
          <p className="mt-2 text-ink-soft">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
