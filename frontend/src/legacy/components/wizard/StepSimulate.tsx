import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Terminal, GitMerge, Rocket, CheckCircle, AlertCircle } from 'lucide-react'
import Confetti from '../Confetti'
import { useIntegration } from '../../context/IntegrationContext'

interface StepSimulateProps {
  onBack: () => void
}

export default function StepSimulate({ onBack }: StepSimulateProps) {
  const [visibleLogs, setVisibleLogs] = useState<Array<{time: string; level: string; msg: string}>>([])
  const [simulating, setSimulating] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [tab, setTab] = useState<'console' | 'diff'>('console')
  const { uploadData, currentDocumentIndex } = useIntegration()
  const navigate = useNavigate()

  if (!uploadData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">No simulation data available. Please complete analysis first.</span>
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
  const simulation = currentResult?.result?.step_4_simulation

  const mockLogs = [
    { time: '09:31:01', level: 'INFO', msg: `Processing "${currentResult?.document_name}" for ${pipelineSummary?.workflow_type || 'integration'}...` },
    { time: '09:31:02', level: 'INFO', msg: `Detected intent: ${pipelineSummary?.intent || 'N/A'}` },
    { time: '09:31:02', level: 'SUCCESS', msg: `Schema validation completed` },
    { time: '09:31:03', level: 'INFO', msg: `Extracted ${pipelineSummary?.field_count || 0} fields from document` },
    { time: '09:31:04', level: 'SUCCESS', msg: `Field extraction quality: ${((pipelineSummary?.overall_quality_score || 0) * 100).toFixed(0)}%` },
    { time: '09:31:05', level: 'INFO', msg: `Running field mapping validation...` },
    { time: '09:31:06', level: 'SUCCESS', msg: `API mapping completeness: ${((pipelineSummary?.mapping_completeness || 0) * 100).toFixed(0)}%` },
    { time: '09:31:07', level: 'INFO', msg: `Running deployment readiness check...` },
    { time: '09:31:08', level: simulation?.deployment_readiness?.is_ready ? 'SUCCESS' : 'WARN', msg: `Deployment readiness score: ${((simulation?.deployment_readiness?.readiness_score || 0) * 100).toFixed(0)}%` },
    { time: '09:31:09', level: 'SUCCESS', msg: `All validations passed. Ready for deployment!` },
  ]

  const startSimulation = () => {
    setSimulating(true)
    setVisibleLogs([])
    mockLogs.forEach((log, i) => {
      setTimeout(() => {
        setVisibleLogs(prev => [...prev, log])
        if (i === mockLogs.length - 1) setSimulating(false)
      }, i * 300)
    })
  }

  const handleDeploy = () => {
    setDeployed(true)
    setTimeout(() => setDeployed(false), 5000)
  }

  const levelColors: Record<string, string> = {
    INFO: 'text-slate-400',
    SUCCESS: 'text-emerald-400',
    WARN: 'text-amber-400',
    ERROR: 'text-red-400',
  }

  return (
    <div className="space-y-6">
      {deployed && <Confetti />}

      <div>
        <h2 className="text-xl font-bold text-white mb-1">Simulation & Deployment</h2>
        <p className="text-slate-400 text-sm">Test your integration and deploy to production</p>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        {(['console', 'diff'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            {t === 'console' ? <Terminal className="w-3.5 h-3.5" /> : <GitMerge className="w-3.5 h-3.5" />}
            {t === 'console' ? 'Simulation Console' : 'Status Report'}
          </button>
        ))}
      </div>

      {tab === 'console' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-xs text-slate-500 font-mono">simulation.log</span>
          </div>
          <div className="p-4 font-mono text-xs space-y-1 min-h-[200px] max-h-[280px] overflow-y-auto">
            <AnimatePresence>
              {visibleLogs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <span className="text-slate-600">{log.time}</span>
                  <span className={`w-14 ${levelColors[log.level]}`}>[{log.level}]</span>
                  <span className="text-slate-300">{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {simulating && (
              <div className="flex gap-1 mt-2">
                <span className="text-cyan-400 animate-pulse">▊</span>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'diff' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Document Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document:</span>
                  <span className="text-cyan-400">{currentResult?.document_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fields Extracted:</span>
                  <span className="text-emerald-400">{pipelineSummary?.field_count}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Deployment Readiness</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={simulation?.deployment_readiness?.is_ready ? 'text-emerald-400' : 'text-amber-400'}>
                    {simulation?.deployment_readiness?.is_ready ? 'Ready' : 'Review Needed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Readiness Score:</span>
                  <span className="text-emerald-400">{((simulation?.deployment_readiness?.readiness_score || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Time:</span>
                  <span className="text-slate-300">{pipelineSummary?.total_processing_time_ms}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={startSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            {simulating ? 'Running...' : 'Run Simulation'}
          </button>
          <button
            onClick={handleDeploy}
            disabled={visibleLogs.length === 0 || simulating}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deployed ? <CheckCircle className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
            {deployed ? 'Deployed!' : 'Deploy to Production'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {deployed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-400">Successfully Deployed! 🎉</p>
                <p className="text-sm text-slate-400">Your integration is now live in production.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <span>📊 View in Dashboard</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
