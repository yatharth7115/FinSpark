import { useState } from 'react'
import ProgressBar from '../components/wizard/ProgressBar'
import StepUpload from '../components/wizard/StepUpload'
import StepAnalysis from '../components/wizard/StepAnalysis'
import StepMapping from '../components/wizard/StepMapping'
import StepSimulate from '../components/wizard/StepSimulate'

const steps = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Analysis' },
  { id: 3, label: 'Mapping' },
  { id: 4, label: 'Deploy' },
]

export default function NewIntegration() {
  const [step, setStep] = useState(1)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">New Integration</h1>
        <p className="text-slate-400 text-sm mt-1">Create a new API integration with AI assistance</p>
      </div>
      <ProgressBar steps={steps} currentStep={step} />
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        {step === 1 && <StepUpload onNext={() => setStep(2)} />}
        {step === 2 && <StepAnalysis onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepMapping onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepSimulate onBack={() => setStep(3)} />}
      </div>
    </div>
  )
}
