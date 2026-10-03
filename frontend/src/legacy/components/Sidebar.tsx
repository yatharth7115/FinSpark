import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Database, Settings, Zap, Home } from 'lucide-react'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-integration', icon: Plus, label: 'New Integration' },
  { to: '/api-registry', icon: Database, label: 'API Registry' },
  { to: '/configurations', icon: Settings, label: 'Configurations' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 flex items-center px-6 py-3 justify-between">
      <div 
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-400 flex items-center justify-center">
          <Zap className="w-5 h-5 text-slate-950" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-white">FinSpark</h1>
          <p className="text-xs text-slate-500">Integration Orchestrator</p>
        </div>
      </div>
      <div className="flex items-center gap-1 justify-center flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </div>

    </nav>
  )
}
