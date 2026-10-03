import { motion } from 'framer-motion'
import { CheckCircle, Code, Globe, Shield, AlertCircle } from 'lucide-react'
import { useIntegration } from '../../context/IntegrationContext'

interface StepAnalysisProps {
  onNext: () => void
  onBack: () => void
}

export default function StepAnalysis({ onNext, onBack }: StepAnalysisProps) {
  const { uploadData, currentDocumentIndex } = useIntegration()

  if (!uploadData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">No analysis data available. Please upload files first.</span>
        </div>
        <div className="flex justify-between">
          <button onClick={onBack} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  const currentResult = uploadData.results[currentDocumentIndex]
  const pipelineSummary = currentResult?.result?.pipeline_summary
  const fieldExtraction = currentResult?.result?.step_2_field_extraction
  const extractedFields = fieldExtraction?.extracted_fields || []

  const analysisResults = [
    {
      icon: Globe,
      label: 'Workflow Intent',
      value: pipelineSummary?.intent || 'N/A',
      status: 'success',
    },
    {
      icon: Code,
      label: 'Extracted Fields',
      value: `${extractedFields.length} fields detected`,
      status: 'success',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">AI Analysis Results</h2>
        <p className="text-slate-400 text-sm">
          Review the extracted schema and document details
          {uploadData.results.length > 1 && ` (Document ${currentDocumentIndex + 1} of ${uploadData.results.length})`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {analysisResults.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800 rounded-xl p-4 border border-slate-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-500">{item.label}</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
            </div>
            <p className="text-sm font-medium text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Extracted Schema Fields</h3>
          <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full">{extractedFields.length} fields</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-2 text-left text-xs text-slate-500">Field Name</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Type</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Confidence</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Value</th>
            </tr>
          </thead>
          <tbody>
            {extractedFields.length > 0 ? (
              extractedFields.map((f, i) => (
                <motion.tr
                  key={f.field_name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="px-4 py-2.5 font-mono text-cyan-400 text-xs">{f.field_name}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-1.5 py-0.5 bg-violet-400/10 text-violet-400 rounded text-xs font-mono">{f.data_type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{(f.confidence * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2.5 text-slate-300 truncate">{f.value}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                  No fields extracted
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="px-6 py-2.5 bg-cyan-400 text-slate-950 rounded-lg font-semibold text-sm hover:bg-cyan-300 transition-colors">
          Proceed to Mapping →
        </button>
      </div>
    </div>
  )
}
