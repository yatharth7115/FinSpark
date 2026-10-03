import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const { notifications, removeNotification, clearAll } = useNotification()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />
      default:
        return <Bell className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 max-h-96 flex flex-col"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Content */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <AnimatePresence mode="popLayout">
                    {notifications.map(notif => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors flex gap-3 items-start group"
                      >
                        <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">{notif.title}</p>
                          {notif.message && (
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{notif.message}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeNotification(notif.id)}
                          className="flex-shrink-0 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
