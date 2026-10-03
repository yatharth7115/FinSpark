import { Check } from 'lucide-react'

interface Step {
  id: number
  label: string
}

interface ProgressBarProps {
  steps: Step[]
  currentStep: number
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step.id < currentStep
                  ? 'bg-emerald-400 text-slate-950'
                  : step.id === currentStep
                  ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <span className={`text-xs whitespace-nowrap ${step.id === currentStep ? 'text-cyan-400 font-medium' : step.id < currentStep ? 'text-emerald-400' : 'text-slate-600'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mt-[-12px] ${step.id < currentStep ? 'bg-emerald-400' : 'bg-slate-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
