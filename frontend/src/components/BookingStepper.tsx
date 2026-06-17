interface StepDef {
  label: string;
}

interface BookingStepperProps {
  steps: StepDef[];
  currentStep: number;
}

export function BookingStepper({ steps, currentStep }: BookingStepperProps) {
  return (
    <ol
      className="flex flex-col md:flex-row border border-gov-border bg-white mb-6"
      aria-label="ขั้นตอนการจอง"
    >
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const lastRow = i === steps.length - 1;
        const cellBg = active ? 'bg-gov-primary-tint font-semibold' : '';
        const badge = done
          ? 'bg-gov-ok-bg text-gov-ok-ink border-gov-ok-ink'
          : active
            ? 'bg-gov-primary text-white border-gov-primary-dark'
            : 'bg-gray-100 border-gov-border text-gray-500';
        return (
          <li
            key={step.label}
            className={`flex-1 px-4 py-3 border-b md:border-b-0 ${
              lastRow ? '' : 'md:border-r'
            } border-gov-border flex items-center gap-2 ${cellBg}`}
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={`inline-grid place-items-center w-7 h-7 border font-semibold text-sm ${badge}`}
            >
              {done ? '✓' : stepNum}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
