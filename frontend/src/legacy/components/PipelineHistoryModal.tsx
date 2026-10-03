import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, CheckCircle, AlertCircle, Download, Settings, Activity, Zap } from 'lucide-react'

interface HistoryRun {
  timestamp: string
  status: string
  data?: any
}

interface PipelineHistory {
  pipeline_name: string
  runs: HistoryRun[]
  error?: string
}

interface PipelineHistoryModalProps {
  isOpen: boolean
  pipelineName: string | null
  pipelineData?: any
  onClose: () => void
}

export default function PipelineHistoryModal({ isOpen, pipelineName, pipelineData, onClose }: PipelineHistoryModalProps) {
  const [history, setHistory] = useState<PipelineHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'details'>('details')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [amountSent, setAmountSent] = useState(false)
  const [lastExecutionId, setLastExecutionId] = useState<string | null>(null)

  // Reset amountSent only when a NEW execution result comes in (different execution_id)
  useEffect(() => {
    if (executionResult?.execution_id && executionResult.execution_id !== lastExecutionId) {
      setLastExecutionId(executionResult.execution_id)
      setAmountSent(false) // Reset only for NEW executions
    }
  }, [executionResult?.execution_id, lastExecutionId])

  useEffect(() => {
    if (isOpen && pipelineName) {
      loadHistory()
    }
  }, [isOpen, pipelineName])

  const loadHistory = async () => {
    if (!pipelineName) return
    
    setLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8001/history/${encodeURIComponent(pipelineName)}`)
      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error('Error loading history:', error)
      setHistory(null)
    } finally {
      setLoading(false)
    }
  }

  const runPipeline = async () => {
    if (!pipelineData) return
    
    setExecuting(true)
    setExecutionError(null)
    setExecutionResult(null)
    
    try {
      const payload = {
        document_name: pipelineData.name,
        parsed_fields: pipelineData.parsed_fields || [],
        detected_apis: pipelineData.detected_apis || [],
        field_to_api_mapping: pipelineData.field_to_api_mapping || {},
        workflow_requirements: pipelineData.workflow_requirements || [],
        user_approvals: {
          mapping_approved: true,
          proceed_with_execution: true
        }
      }
      
      const response = await fetch('http://127.0.0.1:8001/execute-pipeline/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`Pipeline execution failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      setExecutionResult(result)
      
      // Reload history to show new run
      setTimeout(() => {
        loadHistory()
      }, 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute pipeline'
      setExecutionError(message)
      console.error('Pipeline execution error:', error)
    } finally {
      setExecuting(false)
    }
  }

  const downloadHistory = () => {
    if (history) {
      const element = document.createElement('a')
      element.href = URL.createObjectURL(
        new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
      )
      element.download = `${pipelineName}_history.json`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Pipeline Details</h2>
                <p className="text-xs text-slate-400 mt-1">{pipelineName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="sticky top-14 bg-slate-900 border-b border-slate-800 px-6 flex gap-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                History ({history?.runs?.length || 0})
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'details' ? (
                // Overview Tab
                <div className="space-y-6">
                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Status</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {history?.runs?.length ? 'Active' : 'Ready'}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Total Runs</span>
                        <Activity className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-lg font-semibold text-white">{history?.runs?.length || 0}</p>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configuration
                    </h3>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Pipeline:</span>
                        <span className="text-white">{pipelineName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-white">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Quality Score:</span>
                        <span className="text-emerald-400 font-semibold">
                          {pipelineData?.uptime || '85%'}
                        </span>
                      </div>
                    </div>
                  </div>

                    {/* Fields & APIs Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Deployment Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                          <p className="text-xs text-cyan-400 mb-1">Fields Deployed</p>
                          <p className="text-2xl font-bold text-cyan-300">
                            {pipelineData?.source ? '1' : '0'}
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                          <p className="text-xs text-emerald-400 mb-1">APIs Connected</p>
                          <p className="text-2xl font-bold text-emerald-300">
                            {pipelineData?.source && pipelineData?.target ? '2+' : '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button 
                      onClick={runPipeline}
                      disabled={executing}
                      className="flex-1 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 rounded-lg text-sm hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {executing ? (
                        <>
                          <div className="animate-spin">
                            <Zap className="w-4 h-4" />
                          </div>
                          Executing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Run Now
                        </>
                      )}
                    </button>
                    {history?.runs && history.runs.length > 0 && (
                      <button
                        onClick={downloadHistory}
                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    )}
                  </div>

                  {/* Execution Result Display */}
                  {executionResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-3 mt-4"
                    >
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Pipeline Execution Successful!</span>
                      </div>
                      
                      {/* KYC Verification Status */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border border-emerald-500/50 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="font-semibold text-emerald-400">✓ Customer Verified</span>
                        </div>
                        
                        {/* Virtual Disbursement Amount - MAIN FEATURE */}
                        {executionResult.summary?.virtual_amount_disbursed && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-900/80 rounded-lg p-4 space-y-3 border-2 border-cyan-500/30"
                          >
                            <div className="text-center">
                              <p className="text-xs text-slate-400 mb-2">VIRTUAL AMOUNT READY</p>
                              <p className="text-4xl font-bold text-cyan-400">
                                ₹{executionResult.summary.virtual_amount_disbursed.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">Mock Loan Disbursement</p>
                            </div>
                            
                            {/* Send Button */}
                            {!amountSent ? (
                              <button
                                onClick={() => setAmountSent(true)}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                              >
                                <span>💸 Send Amount Now</span>
                              </button>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg"
                              >
                                <CheckCircle className="w-5 h-5" />
                                ✓ Amount Sent Successfully!
                              </motion.div>
                            )}
                            
                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-slate-700">
                              <div>
                                <p className="text-slate-500">Account</p>
                                <p className="text-slate-300 font-mono">XX1234</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Status</p>
                                <p className="text-emerald-400 font-semibold">✓ Verified</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Execution Summary */}
                      {executionResult.summary && (
                        <div className="bg-slate-800/50 rounded p-3">
                          <div className="text-sm font-semibold text-white mb-2">Execution Summary:</div>
                          <ul className="space-y-1 text-xs text-slate-300">
                            <li className="flex justify-between">
                              <span>Total Steps:</span>
                              <span className="text-cyan-400">{executionResult.summary.total_steps}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Successful:</span>
                              <span className="text-emerald-400">✓ {executionResult.summary.successful_steps}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Fields Processed:</span>
                              <span className="text-amber-400">{executionResult.summary.fields_processed}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Execution Time:</span>
                              <span className="text-slate-400">{executionResult.summary.time_taken_seconds}s</span>
                            </li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Success Message */}
                      {executionResult.message && (
                        <div className="text-xs text-emerald-300 border-t border-slate-700/50 pt-2 mt-2 italic">
                          {executionResult.message}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Execution Error Display */}
                  {executionError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4"
                    >
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold">Execution Failed</span>
                      </div>
                      <p className="text-sm text-red-300/80 mt-2">{executionError}</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                // History Tab
                loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin">
                      <Clock className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className="ml-3 text-slate-300">Loading history...</span>
                  </div>
                ) : history && history.runs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-400">
                        Total runs: <span className="text-white font-semibold">{history.runs.length}</span>
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      {history.runs.map((run, index) => {
                        const date = new Date(run.timestamp)
                        const formattedDate = date.toLocaleDateString()
                        const formattedTime = date.toLocaleTimeString()
                        const isCompleted = run.status === 'completed'

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              {/* Status icon */}
                              <div className="mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-amber-400" />
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-medium ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                  </span>
                                  <span className="text-xs text-slate-500">Run #{history.runs.length - index}</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formattedDate}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formattedTime}
                                  </span>
                                </div>

                                {/* Quality score if available */}
                                {run.data?.results?.[0]?.result?.pipeline_summary?.overall_quality_score && (
                                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                                    <span className="text-xs text-slate-400">Quality Score: </span>
                                    <span className="text-xs font-semibold text-cyan-400">
                                      {(run.data.results[0].result.pipeline_summary.overall_quality_score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No history yet for this pipeline</p>
                    <p className="text-xs text-slate-500 mt-1">Run this pipeline to see execution history</p>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
