import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, InfoIcon, Clock, X } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotification()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <Clock className="w-5 h-5 text-amber-400" />
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-400" />
      default:
        return null
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900/20 border-emerald-800/50'
      case 'error':
        return 'bg-red-900/20 border-red-800/50'
      case 'warning':
        return 'bg-amber-900/20 border-amber-800/50'
      case 'info':
        return 'bg-blue-900/20 border-blue-800/50'
      default:
        return 'bg-slate-900/20 border-slate-800/50'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ duration: 0.3 }}
            className={`${getBackgroundColor(notification.type)} border rounded-lg p-4 backdrop-blur pointer-events-auto`}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm">{notification.title}</h3>
                {notification.message && (
                  <p className="text-slate-300 text-sm mt-1 line-clamp-2">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
