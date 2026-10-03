import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Zap } from 'lucide-react'
import { useIntegration } from '../../context/IntegrationContext'

interface StepMappingProps {
  onNext: () => void
  onBack: () => void
}

interface APIInfo {
  api_id: string
  description: string
  keywords: string[]
  is_selected: boolean
}

function FieldBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    string: 'text-cyan-400 bg-cyan-400/10',
    number: 'text-amber-400 bg-amber-400/10',
    decimal: 'text-amber-400 bg-amber-400/10',
    enum: 'text-violet-400 bg-violet-400/10',
    datetime: 'text-emerald-400 bg-emerald-400/10',
    date: 'text-emerald-400 bg-emerald-400/10',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${colors[type] || 'text-slate-400 bg-slate-700'}`}>
      {type}
    </span>
  )
}

function APIBadge({ apiId, isSelected }: { apiId: string; isSelected: boolean }) {
  const colors: Record<string, string> = {
    "loan-api": "bg-blue-500/20 text-blue-400 border-blue-500/50",
    "kyc-api": "bg-purple-500/20 text-purple-400 border-purple-500/50",
    "account-api": "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    "document-api": "bg-orange-500/20 text-orange-400 border-orange-500/50",
  }
  
  return (
    <span className={`text-xs px-2 py-1 rounded border font-mono ${colors[apiId] || 'bg-slate-700 text-slate-400'} ${isSelected ? 'ring-2 ring-offset-1' : ''}`}>
      {apiId}
      {isSelected && ' ✓'}
    </span>
  )
}

export default function StepMapping({ onNext, onBack }: StepMappingProps) {
  const { uploadData, currentDocumentIndex } = useIntegration()

  if (!uploadData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">No mapping data available. Please complete analysis first.</span>
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
  const extractedFields = currentResult?.result?.step_2_field_extraction?.extracted_fields || []
  const mappings = currentResult?.result?.step_3_api_mapping?.mappings || []
  const availableAPIs = currentResult?.result?.step_3_api_mapping?.available_apis || []
  const mappingStats = currentResult?.result?.step_3_api_mapping?.mapping_statistics || {}
  const selectedAPI = currentResult?.result?.step_3_api_mapping?.selected_api || ""
  const mappingStrategy = currentResult?.result?.step_3_api_mapping?.mapping_strategy || "ai_based"
  const aiStatus = currentResult?.result?.step_3_api_mapping?.ai_status || "disabled"

  // Create source fields from extracted fields
  const sourceFields = extractedFields.map((f, i) => ({
    id: `src-${i}`,
    name: f.field_name,
    type: f.data_type,
    index: i
  }))

  // Create target fields from actual mappings
  const targetFields = mappings.map((m, i) => ({
    id: `tgt-${i}`,
    name: m.target_field,
    type: sourceFields[sourceFields.findIndex(sf => sf.name === m.source_field)]?.type || m.data_type,
    api: m.target_api_id,
    sourceIndex: sourceFields.findIndex(sf => sf.name === m.source_field),
    mappingType: m.mapping_type || 'direct'
  }))

  // Optimize target field ordering to minimize connection crossing
  const optimizeTargetFieldOrder = () => {
    if (targetFields.length <= 1) return targetFields

    // Group by source field and sort for better layout
    const grouped = new Map<number, typeof targetFields>()
    targetFields.forEach(tf => {
      if (!grouped.has(tf.sourceIndex)) grouped.set(tf.sourceIndex, [])
      grouped.get(tf.sourceIndex)!.push(tf)
    })

    const optimized: typeof targetFields = []
    const seen = new Set<string>()

    // Order by source field index, then by api group to minimize crossing
    Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([_, fields]) => {
        // Group by API for better visual organization
        const byApi = new Map<string, typeof fields>()
        fields.forEach(f => {
          if (!byApi.has(f.api)) byApi.set(f.api, [])
          byApi.get(f.api)!.push(f)
        })

        // Add fields in API order
        Array.from(byApi.values()).forEach(apiFields => {
          apiFields.forEach(f => {
            if (!seen.has(f.id)) {
              optimized.push(f)
              seen.add(f.id)
            }
          })
        })
      })

    return optimized
  }

  const orderedTargetFields = optimizeTargetFieldOrder()

  // Show ALL connections with optimized field ordering
  const allConnections = orderedTargetFields.map((tf) => ({
    fromId: `src-${tf.sourceIndex}`,
    toId: tf.id,
    confidence: 0.85,
  }))

  const relevantAPIs = availableAPIs.filter(api => 
    mappings.some(m => m.target_api_id === api.api_id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Schema Mapping Studio</h2>
        <p className="text-slate-400 text-sm flex items-center gap-2">
          {aiStatus === 'enabled' ? (
            <>
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>AI-powered intelligent mapping</span>
            </>
          ) : (
            <>
              <span>Rule-based field mappings</span>
              <span className="text-xs text-slate-500">(Ollama not available)</span>
            </>
          )}
        </p>
      </div>

      {/* Mapping Visualization - Clean Table View */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-sm font-medium text-slate-300">Field Mappings ({orderedTargetFields.length})</h3>
        
        {orderedTargetFields.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Source Field</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Target Field</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">API</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orderedTargetFields.map((targetField, idx) => {
                  const sourceField = sourceFields[targetField.sourceIndex]
                  return (
                    <motion.tr
                      key={targetField.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-200 font-mono">{sourceField?.name || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {sourceField && <FieldBadge type={sourceField.type} />}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-200 font-mono">{targetField.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <APIBadge apiId={targetField.api} isSelected={true} />
                      </td>
                      <td className="px-4 py-3">
                        {targetField.mappingType === 'intelligent' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
                            <span>✓</span> Smart
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-slate-500/20 text-slate-300 px-2 py-1 rounded">
                            <span>→</span> Direct
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 text-sm py-8 text-center">No mappings available</div>
        )}
      </div>

      {/* Mapping Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">Mapped Fields</p>
          <p className="text-2xl font-bold text-cyan-400">{mappingStats.mapped_fields || 0}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">Transformations</p>
          <p className="text-2xl font-bold text-emerald-400">{mappingStats.matches_with_transformation || 0}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">Confidence</p>
          <p className="text-2xl font-bold text-amber-400">{((mappingStats.average_confidence || 0.85) * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* API Details Modal - Removed */}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="px-6 py-2.5 bg-cyan-400 text-slate-950 rounded-lg font-semibold text-sm hover:bg-cyan-300 transition-colors">
          Simulate & Deploy →
        </button>
      </div>
    </div>
  )
}
