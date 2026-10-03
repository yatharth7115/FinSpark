import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, GitBranch, Lock, Sparkles, LineChart, BarChart3, Lightbulb } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  const features = [
    { icon: Zap, label: 'AI-Powered', desc: 'Llama 3.1 8B field mapping' },
    { icon: GitBranch, label: '10 APIs', desc: 'Pre-integrated mock endpoints' },
    { icon: Lock, label: 'Secure', desc: 'Enterprise-grade encryption' },
    { icon: Sparkles, label: 'Smart Transforms', desc: 'Intelligent field splitting' },
    { icon: LineChart, label: 'Analytics', desc: 'Real-time monitoring' },
    { icon: BarChart3, label: 'Insights', desc: 'AI-powered recommendations' },
  ]

  const recentActions = [
    { label: 'View API Registry', action: () => navigate('/api-registry'), icon: BarChart3, color: 'text-cyan-400' },
    { label: 'New Integration', action: () => navigate('/new-integration'), icon: Zap, color: 'text-amber-400' },
    { label: 'Dashboard', action: () => navigate('/dashboard'), icon: LineChart, color: 'text-emerald-400' },
    { label: 'Settings', action: () => navigate('/configurations'), icon: Lock, color: 'text-violet-400' },
  ]

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h1 className="text-5xl md:text-6xl font-black text-white bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              FinSpark
            </h1>
          </div>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            AI-Powered Integration Orchestrator. Connect APIs, transform data, deploy instantly.
          </p>
          <button
            onClick={() => navigate('/new-integration')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
          >
            Start Integration <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-cyan-400 mb-2">10</p>
            <p className="text-slate-400">APIs Ready</p>
            <p className="text-xs text-slate-500 mt-2">Payments, Banking, CRM, Accounting & more</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-emerald-400 mb-2">Llama 3.1</p>
            <p className="text-slate-400">AI Engine</p>
            <p className="text-xs text-slate-500 mt-2">Intelligent field detection & mapping</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-amber-400 mb-2">4 Stages</p>
            <p className="text-slate-400">Pipeline</p>
            <p className="text-xs text-slate-500 mt-2">Parse, Extract, Map, Simulate & Deploy</p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Why FinSpark?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <Icon className="w-6 h-6 text-cyan-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">{feature.label}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentActions.map((action, i) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={i}
                  onClick={action.action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-left hover:border-slate-600 transition-all group"
                >
                  <Icon className={`w-6 h-6 mb-2 ${action.color}`} />
                  <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                    {action.label}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16 text-slate-500 text-sm"
        >
          <p>FinSpark Integration Orchestrator v1.0 — Powered by Llama 3.1 AI</p>
          <p className="mt-2">Get started by uploading a document or exploring the API Registry</p>
        </motion.div>
      </div>
    </div>
  )
}
