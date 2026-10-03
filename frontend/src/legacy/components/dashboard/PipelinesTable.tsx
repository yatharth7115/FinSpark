import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { useIntegration } from '../../context/IntegrationContext'
import { useNotification } from '../../context/NotificationContext'
import PipelineHistoryModal from '../PipelineHistoryModal'

interface Pipeline {
  id: string
  name: string
  source: string
  target: string
  status: 'completed' | 'pending' | 'error' | 'not-started'
  lastRun: string
  uptime: string
}

const statusConfig = {
  completed: { icon: CheckCircle, class: 'text-emerald-400', label: 'Completed', dot: 'bg-emerald-400' },
  pending: { icon: Clock, class: 'text-amber-400', label: 'Pending', dot: 'bg-amber-400' },
  error: { icon: AlertCircle, class: 'text-red-400', label: 'Error', dot: 'bg-red-400' },
  'not-started': { icon: XCircle, class: 'text-slate-500', label: 'Not Started', dot: 'bg-slate-500' },
}

const defaultPipelines: Pipeline[] = [
  { id: '1', name: 'Stripe → Salesforce', source: 'Stripe API', target: 'Salesforce CRM', status: 'not-started', lastRun: 'Not yet', uptime: '-' },
  { id: '2', name: 'Plaid → QuickBooks', source: 'Plaid Banking', target: 'QuickBooks', status: 'not-started', lastRun: 'Not yet', uptime: '-' },
  { id: '3', name: 'Twilio → HubSpot', source: 'Twilio SMS', target: 'HubSpot CRM', status: 'not-started', lastRun: 'Not yet', uptime: '-' },
]

export default function PipelinesTable() {
  const { uploadData, setUploadData } = useIntegration()
  const { addNotification } = useNotification()
  const navigate = useNavigate()
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)
  const [selectedPipelineData, setSelectedPipelineData] = useState<any>(null)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  const deletePipeline = (pipelineIndex: number) => {
    if (!uploadData) return
    const confirmed = window.confirm('Are you sure you want to delete this pipeline?')
    if (!confirmed) return
    
    const updatedResults = uploadData.results.filter((_, idx) => idx !== pipelineIndex)
    const updatedData = {
      ...uploadData,
      results: updatedResults,
      summary: { ...uploadData.summary, total_documents: updatedResults.length }
    }
    
    setUploadData(updatedData)
    setHistoryModalOpen(false)
    addNotification({
      type: 'success',
      title: 'Pipeline Deleted',
      message: 'Pipeline has been removed from dashboard',
    })
  }

  const pipelines: Pipeline[] = uploadData
    ? uploadData.results.map((result, i) => {
        const isReady = result.result?.step_4_simulation?.deployment_readiness?.is_ready
        const timestamp = result.timestamp || new Date().toISOString()
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        
        let lastRunText = 'Just now'
        if (minutes > 1) lastRunText = `${minutes}m ago`
        if (hours > 0) lastRunText = `${hours}h ago`
        if (hours > 24) lastRunText = date.toLocaleDateString()
        
        return {
          id: String(i + 1),
          name: `${result.document_name} Integration`,
          source: result.result?.pipeline_summary?.intent || 'API Source',
          target: result.result?.pipeline_summary?.workflow_type || 'Target System',
          status: isReady ? 'completed' : 'pending',
          lastRun: lastRunText,
          uptime: `${((result.result?.pipeline_summary?.overall_quality_score || 0) * 100).toFixed(0)}%`,
        }
      })
    : defaultPipelines

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-white">Pipelines</h2>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{pipelines.length} total</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="px-6 py-3 text-left text-xs text-slate-500 font-medium">Pipeline</th>
            <th className="px-6 py-3 text-left text-xs text-slate-500 font-medium">Source → Target</th>
            <th className="px-6 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
            <th className="px-6 py-3 text-left text-xs text-slate-500 font-medium">Last Run</th>
            <th className="px-6 py-3 text-left text-xs text-slate-500 font-medium">Quality</th>
            <th className="px-6 py-3 text-right text-xs text-slate-500 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.map((p, i) => {
            const cfg = statusConfig[p.status as keyof typeof statusConfig]
            const StatusIcon = cfg.icon
            return (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedPipeline(p.name)
                  setSelectedPipelineData(p)
                  setHistoryModalOpen(true)
                }}
              >
                <td className="px-6 py-4 font-medium text-white hover:text-blue-300 transition-colors">{p.name}</td>
                <td className="px-6 py-4 text-slate-400">
                  <span className="text-slate-300">{p.source}</span>
                  <span className="text-slate-600 mx-2">→</span>
                  <span className="text-slate-300">{p.target}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 ${cfg.class}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${p.status === 'completed' ? '' : p.status === 'pending' ? 'animate-pulse' : ''}`}></span>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{p.lastRun}</td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${p.uptime === '-' ? 'text-slate-500' : parseFloat(p.uptime) > 90 ? 'text-emerald-400' : parseFloat(p.uptime) > 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {p.uptime}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePipeline(i)
                    }}
                    className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
      
      <PipelineHistoryModal
        isOpen={historyModalOpen}
        pipelineName={selectedPipeline}
        pipelineData={selectedPipelineData}
        onClose={() => setHistoryModalOpen(false)}
      />
    </motion.div>
  )
}
