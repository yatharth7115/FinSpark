import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, RotateCcw, Shield, Bell, Globe, Key } from 'lucide-react'

interface ConfigSection {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  fields: { key: string; label: string; type: string; value: string; placeholder?: string }[]
}

const configSections: ConfigSection[] = [
  {
    id: 'general',
    icon: Globe,
    title: 'General Settings',
    description: 'Basic configuration options',
    fields: [
      { key: 'org_name', label: 'Organization Name', type: 'text', value: 'FinSpark Corp', placeholder: 'Your organization' },
      { key: 'env', label: 'Environment', type: 'select', value: 'production', placeholder: '' },
      { key: 'timeout', label: 'Request Timeout (ms)', type: 'number', value: '5000', placeholder: '5000' },
    ],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    description: 'Authentication and security settings',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', value: '', placeholder: '' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', value: '', placeholder: '' },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Alert and notification preferences',
    fields: [
      { key: 'alert_email', label: 'Alert Email', type: 'email', value: 'ops@finspark.io', placeholder: 'you@example.com' },
      { key: 'slack_webhook', label: 'Slack Webhook URL', type: 'text', value: '', placeholder: 'https://hooks.slack.com/...' },
    ],
  },
  {
    id: 'api_keys',
    icon: Key,
    title: 'API Credentials',
    description: 'Third-party API credentials',
    fields: [
      { key: 'stripe_key', label: 'Stripe Secret Key', type: 'password', value: '', placeholder: '' },
      { key: 'salesforce_token', label: 'Salesforce Access Token', type: 'password', value: '', placeholder: '' },
    ],
  },
]

export default function Configurations() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurations</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your integration settings</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {configSections.map((section, si) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-400/10 rounded-lg flex items-center justify-center">
              <section.icon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">{section.title}</h2>
              <p className="text-xs text-slate-500">{section.description}</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{field.label}</label>
                {field.type === 'select' ? (
                  <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-400/50">
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                ) : (
                  <input
                    type={field.type}
                    defaultValue={field.value}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50"
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
