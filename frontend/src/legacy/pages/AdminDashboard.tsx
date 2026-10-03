import React from 'react'
import { Users, FileText, Grid3X3, Activity, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Users',
      value: '12',
      change: '+2 this week',
      icon: Users,
      color: 'cyan',
    },
    {
      title: 'Documents Processed',
      value: '248',
      change: '+45 this week',
      icon: FileText,
      color: 'emerald',
    },
    {
      title: 'Active Integrations',
      value: '8',
      change: 'All operational',
      icon: Grid3X3,
      color: 'violet',
    },
    {
      title: 'System Status',
      value: 'Operational',
      change: 'Uptime 99.9%',
      icon: Activity,
      color: 'rose',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">System overview and management panel</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-lg hover:from-violet-700 hover:to-purple-600 transition-all">
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorMap = {
            cyan: 'from-cyan-600 to-cyan-400',
            emerald: 'from-emerald-600 to-emerald-400',
            violet: 'from-violet-600 to-violet-400',
            rose: 'from-rose-600 to-rose-400',
          }
          return (
            <div key={stat.title} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-2">{stat.change}</p>
                </div>
                <div className={`bg-gradient-to-br ${colorMap[stat.color as keyof typeof colorMap]} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alert Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-white font-semibold">System Information</h3>
          <p className="text-slate-400 text-sm mt-1">
            All systems operational. Email verification requires proper .env configuration for OTP delivery.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Users</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <p className="text-white font-medium">John Doe</p>
                <p className="text-xs text-slate-400">john@example.com</p>
              </div>
              <span className="px-2 py-1 bg-emerald-900 text-emerald-400 text-xs rounded">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div>
                <p className="text-white font-medium">Jane Smith</p>
                <p className="text-xs text-slate-400">jane@example.com</p>
              </div>
              <span className="px-2 py-1 bg-yellow-900 text-yellow-400 text-xs rounded">Pending</span>
            </div>
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">System Activity</h2>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-white">Document uploaded</p>
                <p className="text-xs">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-white">User verified</p>
                <p className="text-xs">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-violet-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-white">API integration completed</p>
                <p className="text-xs">10 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
