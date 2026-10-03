import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Scan, AlertCircle, CheckCircle, Sparkles, Zap, Code2, Layers, Play, FileCheck, GitBranch, DollarSign, Shield } from 'lucide-react'
import axios from 'axios'
import { useIntegration } from '../../context/IntegrationContext'
import { useNotification } from '../../context/NotificationContext'

interface StepUploadProps {
  onNext: () => void
}

interface DetectedAPI {
  api_id: string
  name: string
  category: string
  confidence: number
  matched_keywords: string[]
  priority: number
  fields: string[]
}

interface ProcessStep {
  step: number
  name: string
  description: string
  status: string
  details?: Record<string, any>
}

interface ExecutionLog {
  timestamp: string
  step: string
  api: string
  status: string
  details: Record<string, any>
}

const FASTAPI_URL = 'http://127.0.0.1:8001'

export default function StepUpload({ onNext }: StepUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const { addNotification } = useNotification()
  const [scanning, setScanning] = useState(false)
  const [detectedAPIs, setDetectedAPIs] = useState<DetectedAPI[]>([])
  const [autoMappedFields, setAutoMappedFields] = useState<Record<string, string[]>>({})  // Now: {field: [apis]}
  const [workflowSteps, setWorkflowSteps] = useState<string[]>([])
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [processDoc, setProcessDoc] = useState<ProcessStep[] | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [mappingApproved, setMappingApproved] = useState(false)
  const { setUploadData, setIsLoading, isLoading, error: contextError, setError: setContextError } = useIntegration()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...dropped])
    addNotification({
      type: 'success',
      title: `Added ${dropped.length} file${dropped.length > 1 ? 's' : ''}`,
      message: 'Ready to analyze. Click "Analyze Files" to continue.',
    })
  }, [addNotification])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files!)
      setFiles(prev => [...prev, ...newFiles])
      addNotification({
        type: 'success',
        title: `Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`,
        message: 'Ready to analyze. Click "Analyze Files" to continue.',
      })
    }
  }

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setContextError('Please upload at least one file')
      addNotification({
        type: 'warning',
        title: 'No Files Selected',
        message: 'Upload at least one PDF or document to continue',
      })
      return
    }

    setScanning(true)
    setIsLoading(true)
    setContextError(null)
    setAnalysisComplete(false)
    setProcessDoc(null)
    setExecutionResult(null)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('file', file)
      })

      console.log('🚀 Sending files for intelligent analysis:', files.map(f => f.name))

      // Call the intelligent processing endpoint
      const response = await axios.post(`${FASTAPI_URL}/process/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 45000,
      })

      console.log('✅ Response received:', response.data)
      
      if (!response || !response.data) {
        throw new Error('Empty response from server')
      }

      // Extract intelligent analysis data
      const intelligentAnalysis = response.data.intelligent_analysis || {}
      const detectedApisData = intelligentAnalysis.detected_apis || []
      const fieldMappings = intelligentAnalysis.field_mappings_auto_generated || {}
      const workflowStepsData = intelligentAnalysis.workflow_steps || []

      // Update state with detected data
      setDetectedAPIs(detectedApisData)
      setAutoMappedFields(fieldMappings)
      setWorkflowSteps(workflowStepsData)
      setAnalysisComplete(true)
      
      // APPEND to existing pipelines instead of replacing
      const newUploadData: typeof response.data = response.data
      const existingData = JSON.parse(localStorage.getItem('fins_upload_data') || 'null')
      if (existingData && existingData.results && Array.isArray(existingData.results)) {
        // Merge results: keep existing ones and add new ones
        newUploadData.results = [...existingData.results, ...(newUploadData.results || [])]
        newUploadData.summary.total_documents = newUploadData.results.length
      }
      
      setUploadData(newUploadData)

      console.log(`🎯 Auto-Detected ${detectedApisData.length} APIs:`, detectedApisData.map(a => a.name))
      console.log(`📌 Auto-Mapped ${Object.keys(fieldMappings).length} Fields`)

      // Generate process documentation
      await generateProcessDocumentation(files[0])

      setScanning(false)
      addNotification({
        type: 'success',
        title: '✅ Analysis Complete!',
        message: `Auto-detected ${detectedApisData.length} APIs and mapped ${Object.keys(fieldMappings).length} fields.`,
      })
    } catch (err) {
      setScanning(false)
      let errorMessage = 'Failed to analyze files'
      
      if (axios.isAxiosError(err)) {
        console.error('❌ Axios error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        })
        errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message
      } else if (err instanceof Error) {
        console.error('❌ Error:', err.message)
        errorMessage = err.message
      }
      
      setContextError(String(errorMessage))
      console.error('Full error:', err)
      
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: String(errorMessage),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateProcessDocumentation = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${FASTAPI_URL}/generate-process-doc/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      })

      console.log('📄 Process document generated:', response.data)
      setProcessDoc(response.data.process_steps || [])
    } catch (err) {
      console.error('Error generating process doc:', err)
    }
  }

  const handleExecutePipeline = async () => {
    setExecuting(true)

    try {
      const response = await axios.post(`${FASTAPI_URL}/execute-pipeline/`, {
        detected_apis: detectedAPIs,
        field_mappings_auto_generated: autoMappedFields,
        workflow_steps: workflowSteps,
      }, {
        timeout: 30000,
      })

      console.log('✅ Pipeline execution result:', response.data)
      setExecutionResult(response.data)

      addNotification({
        type: 'success',
        title: '🎉 Pipeline Executed Successfully!',
        message: response.data.message,
      })
    } catch (err) {
      console.error('❌ Execution failed:', err)
      addNotification({
        type: 'error',
        title: 'Execution Failed',
        message: 'Failed to execute pipeline',
      })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Upload API Documentation</h2>
        <p className="text-slate-400 text-sm">Upload PDF, YAML, JSON, or Swagger files for AI analysis</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragging ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-4 text-slate-500" />
        <p className="text-white font-medium mb-1">Drop files here</p>
        <p className="text-slate-500 text-sm mb-4">or click to browse</p>
        <label className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 rounded-lg text-sm cursor-pointer hover:bg-cyan-400/20 transition-colors">
          Browse Files
          <input type="file" multiple className="hidden" onChange={handleFileInput} accept=".pdf,.yaml,.yml,.json" />
        </label>
      </div>

      <AnimatePresence>
        {files.map((file, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="flex-1 text-sm text-slate-300 truncate">{file.name}</span>
            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
            <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && !scanning && (
        <div className="text-center text-slate-500 text-sm py-2">
          No files selected. Upload API documentation to begin analysis.
        </div>
      )}

      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-slate-800 border border-cyan-400/20 rounded-lg px-4 py-3"
          >
            <Scan className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-400">AI scanning documents...</span>
            <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="h-full bg-cyan-400 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{contextError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detected APIs Section */}
      <AnimatePresence>
        {analysisComplete && detectedAPIs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6 border-t border-slate-700 pt-6 mt-6"
          >
            {/* Extracted Fields Section - MANY-TO-MANY MAPPING */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Extracted Fields ({Object.keys(autoMappedFields).length})
              </h3>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3">
                  {Object.entries(autoMappedFields).map(([field, apis], i) => {
                    const apiList = Array.isArray(apis) ? apis : [apis]  // Handle both old and new format
                    return (
                      <motion.div
                        key={field}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="bg-slate-800/50 rounded px-3 py-2 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Code2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300 font-medium text-xs">{field}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-5">
                          {apiList.map((api_id: string) => {
                            const apiName = detectedAPIs.find(a => a.api_id === api_id)?.name || api_id
                            return (
                              <span key={api_id} className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded border border-purple-500/50">
                                → {apiName}
                              </span>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
              {Object.keys(autoMappedFields).length === 0 && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No fields extracted from document
                </div>
              )}
            </div>

            {/* Detected APIs */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Detected APIs ({detectedAPIs.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectedAPIs.map((api, i) => (
                  <motion.div
                    key={api.api_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-slate-800/50 border border-emerald-500/30 rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white text-sm">{api.name}</p>
                        <p className="text-xs text-slate-400">{api.category}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-500/20 rounded px-2 py-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">{(api.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    {api.matched_keywords && api.matched_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {api.matched_keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Workflow Requirements */}
            {workflowSteps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Workflow Steps Detected ({workflowSteps.length})
                </h3>
                <div className="space-y-2">
                  {workflowSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (detectedAPIs.length + i) * 0.02 }}
                      className="flex items-start gap-3 bg-slate-800/30 border border-slate-700/50 rounded px-3 py-2 hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 rounded px-2 py-1 mt-0.5 flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 flex-1">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION: Process Documentation */}
      <AnimatePresence>
        {analysisComplete && processDoc && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4 border-t border-slate-700 pt-6 mt-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Complete Process Flow</h3>
            </div>

            <div className="space-y-3">
              {processDoc.map((step: ProcessStep, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-800/40 border border-blue-400/20 rounded-lg p-4 hover:border-blue-400/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-300">{step.step}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-white">{step.name}</p>
                        <span className="text-xs text-emerald-400">{step.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{step.description}</p>
                      
                      {step.details && (
                        <div className="text-xs text-slate-500 bg-slate-900/50 rounded p-2 mt-2 max-h-24 overflow-y-auto">
                          {step.details.fields ? (
                            <>
                              <p className="font-semibold text-slate-300 mb-1">Fields: {step.details.fields.length}</p>
                              <div className="flex flex-wrap gap-1">
                                {step.details.fields.slice(0, 5).map((f: string, i: number) => (
                                  <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">
                                    {f}
                                  </span>
                                ))}
                                {step.details.fields.length > 5 && (
                                  <span className="text-slate-400 px-2 py-0.5">+{step.details.fields.length - 5}</span>
                                )}
                              </div>
                            </>
                          ) : step.details.apis_detected ? (
                            <>
                              <p className="font-semibold text-slate-300 mb-1">APIs Detected: {step.details.apis_detected.length}</p>
                              {step.details.apis_detected.map((api: any, i: number) => (
                                <div key={i} className="text-xs mb-1">
                                  <span className="text-slate-300">{api.name}</span> <span className="text-slate-500">({api.confidence})</span>
                                </div>
                              ))}
                            </>
                          ) : step.details.mappings ? (
                            <>
                              <p className="font-semibold text-slate-300 mb-1">Mappings: {step.details.mappings.length}</p>
                              {step.details.mappings.slice(0, 3).map((m: any, i: number) => (
                                <div key={i} className="text-xs mb-1">
                                  <span className="text-cyan-300">{m.field}</span> <span className="text-slate-400">→</span> <span className="text-emerald-300">{m.api_name}</span>
                                </div>
                              ))}
                              {step.details.mappings.length > 3 && (
                                <div className="text-xs text-slate-400">+{step.details.mappings.length - 3} more</div>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-300">{JSON.stringify(step.details).substring(0, 100)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION: Execute Pipeline & Results */}
      <AnimatePresence>
        {analysisComplete && !executionResult && mappingApproved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-900/30 via-slate-800/50 to-blue-900/30 border border-emerald-500/30 rounded-lg p-6 mt-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Ready to Execute Pipeline</h3>
              </div>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Click <span className="font-semibold text-emerald-400">"Run Pipeline"</span> to:
            </p>
            <ul className="text-sm text-slate-300 space-y-2 mb-4 ml-4">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>✅ Verify customer KYC</span>
              </li>
              <li className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span>💰 Disburse ₹50,000 virtual loan (MOCK)</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>🔔 Send customer notifications</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION: Execution Results */}
      <AnimatePresence>
        {executionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 border-t border-slate-700 pt-6 mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Execution Complete ✅</h3>
              </div>
              <span className="text-sm font-semibold bg-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full">
                {executionResult.status}
              </span>
            </div>

            {executionResult.summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{executionResult.summary.total_steps}</div>
                  <div className="text-xs text-slate-400">Steps</div>
                </div>
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{executionResult.summary.successful_steps}</div>
                  <div className="text-xs text-slate-400">Success</div>
                </div>
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{executionResult.summary.fields_processed}</div>
                  <div className="text-xs text-slate-400">Fields</div>
                </div>
                {executionResult.summary.virtual_amount_disbursed && (
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">₹{executionResult.summary.virtual_amount_disbursed.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">Loan</div>
                  </div>
                )}
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{executionResult.summary.time_taken_seconds}s</div>
                  <div className="text-xs text-slate-400">Time</div>
                </div>
              </div>
            )}

            {executionResult.message && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4">
                <p className="text-sm text-emerald-300 font-semibold">{executionResult.message}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Execution Flow:</h4>
              {executionResult.execution_log && executionResult.execution_log.map((log: ExecutionLog, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-800/50 border border-emerald-500/20 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{log.step}</p>
                      <p className="text-xs text-slate-500">{log.api}</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold">{log.status}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {log.details && Object.entries(log.details).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-300 ml-2">
                          {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons - FIXED FLOW */}
      <div className="flex justify-end gap-3 border-t border-slate-700 pt-6 mt-6">
        {analysisComplete ? (
          <div className="flex gap-3 w-full justify-end">
            {!mappingApproved && !executionResult && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setMappingApproved(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Approve Mapping & Review
              </motion.button>
            )}
            
            {mappingApproved && !executionResult && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleExecutePipeline}
                disabled={executing}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {executing ? 'Executing...' : 'Run Pipeline'}
              </motion.button>
            )}
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onNext}
              disabled={executing || (!executionResult && !mappingApproved)}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {executionResult ? 'Complete' : 'Next'}
            </motion.button>
          </div>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || scanning || isLoading}
            className="px-6 py-2.5 bg-cyan-400 text-slate-950 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors"
          >
            {scanning ? 'Analyzing...' : 'Run Intelligent Analysis'}
          </button>
        )}
      </div>
    </div>
  )
}
