import { Activity, CheckCircle, AlertTriangle, TrendingUp, Zap, BarChart3, Shield, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import { useIntegration } from '../context/IntegrationContext'
import MetricCard from '../components/dashboard/MetricCard'
import PipelinesTable from '../components/dashboard/PipelinesTable'

export default function Dashboard() {
  const { uploadData } = useIntegration()

  const metrics = uploadData
    ? [
        {
          title: 'Documents Processed',
          value: uploadData.results.length,
          change: `${uploadData.summary.total_documents} total`,
          icon: Activity,
          color: 'cyan' as const,
        },
        {
          title: 'Quality Score',
          value: `${(
            (uploadData.results.reduce((sum, r) => sum + (r.result?.pipeline_summary?.overall_quality_score || 0), 0) /
              uploadData.results.length) *
            100
          ).toFixed(0)}%`,
          change: 'Average across documents',
          icon: CheckCircle,
          color: 'emerald' as const,
        },
        {
          title: 'Fields Extracted',
          value: uploadData.results.reduce((sum, r) => sum + (r.result?.pipeline_summary?.field_count || 0), 0),
          change: 'Total fields found',
          icon: TrendingUp,
          color: 'violet' as const,
        },
        {
          title: 'APIs Mapped',
          value: new Set(uploadData.results.flatMap(r => r.result?.step_3_api_mapping?.available_apis?.map((a: any) => a.api_id) || [])).size,
          change: 'Unique APIs used',
          icon: BarChart3,
          color: 'rose' as const,
        },
      ]
    : [
        { title: 'Active Pipelines', value: 0, change: 'No data yet', icon: Activity, color: 'cyan' as const },
        { title: 'Successful Runs', value: 0, change: 'Upload files to start', icon: CheckCircle, color: 'emerald' as const },
        { title: 'Quality Score', value: '-', change: 'Pending analysis', icon: TrendingUp, color: 'violet' as const },
        { title: 'API Count', value: '-', change: 'Ready for upload', icon: BarChart3, color: 'rose' as const },
      ]

  // Calculate AI insights
  const aiInsights = uploadData
    ? [
        {
          title: 'AI Confidence',
          value: `${(
            (uploadData.results.reduce((sum, r) => sum + (r.result?.step_3_api_mapping?.ai_analysis?.reduce((s: number, a: any) => s + (a.ai_confidence || 0), 0) / Math.max(1, r.result?.step_3_api_mapping?.ai_analysis?.length || 0)), 0) / uploadData.results.length) * 100
          ).toFixed(0)}%`,
          desc: 'Field mapping accuracy',
          icon: Zap,
          color: 'yellow',
        },
        {
          title: 'Field Transformations',
          value: uploadData.results.reduce((sum, r) => sum + (r.result?.step_3_api_mapping?.mapping_statistics?.matches_with_transformation || 0), 0),
          desc: 'Smart field splits performed',
          icon: Shield,
          color: 'emerald',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          {uploadData ? 'AI-Powered Integration Orchestration' : 'Ready to process your integrations'}
        </p>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* AI Insights Section */}
      {uploadData && aiInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">🤖 AI Analysis & Insights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, i) => {
              const IconComponent = insight.icon
              const colorClasses = {
                yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              }
              const bgClass = colorClasses[insight.color as keyof typeof colorClasses] || colorClasses.yellow

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`border rounded-lg p-4 ${bgClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium opacity-75 mb-1">{insight.title}</p>
                      <p className="text-2xl font-bold">{insight.value}</p>
                      <p className="text-xs opacity-60 mt-2">{insight.desc}</p>
                    </div>
                    <IconComponent className="w-6 h-6 opacity-50" />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mt-4"
          >
            <p className="text-xs font-medium text-slate-400 mb-3">💡 RECOMMENDATIONS</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {uploadData && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>Your documents show <strong>{uploadData.results.length > 5 ? 'high volume' : 'optimal volume'}</strong> - {uploadData.results.length > 5 ? 'consider batch processing for better performance' : 'perfect for real-time processing'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Field extraction quality is <strong>excellent</strong> - {uploadData.results[0]?.result?.step_2_field_extraction?.extracted_fields?.length || 0}+ fields per document detected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">✓</span>
                    <span>Using <strong>{new Set(uploadData.results.flatMap(r => r.result?.step_3_api_mapping?.mappings?.map((m: any) => m.target_api_id) || [])).size} APIs</strong> - well-distributed across integration endpoints</span>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}

      {/* Pipelines Table */}
      <PipelinesTable />

      {/* Empty State */}
      {!uploadData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center"
        >
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No integrations processed yet</p>
          <p className="text-sm text-slate-500">Upload documents to see AI-powered insights and mapping analytics</p>
        </motion.div>
      )}
    </div>
  )
}
