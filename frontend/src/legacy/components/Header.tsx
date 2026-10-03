import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, LogOut, User } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import { useAuth } from '../context/AuthContext'

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['Home', 'Dashboard'],
  '/home': ['Home'],
  '/new-integration': ['Home', 'New Integration'],
  '/api-registry': ['Home', 'API Registry'],
  '/configurations': ['Home', 'Configurations'],
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const crumbs = breadcrumbMap[location.pathname] || ['Home']

  // Close menu only when clicking outside
  const handleMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Navigate to API Registry with search query
      navigate(`/api-registry?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setShowProfileMenu(false)
  }

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
            <span className={i === crumbs.length - 1 ? 'text-white font-medium' : 'text-slate-500'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 w-48 transition-colors"
          />
        </div>
        <NotificationCenter />
        
        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} className="w-full h-full rounded-full" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-sm text-slate-300 hidden sm:inline max-w-[120px] truncate">
              {user?.full_name || user?.email.split('@')[0]}
            </span>
          </button>
          
          {/* Dropdown Menu - stays open until button clicked again */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
