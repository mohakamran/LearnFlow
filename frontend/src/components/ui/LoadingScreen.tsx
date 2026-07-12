import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-1 rounded-2xl border-2 border-primary/30 border-t-primary"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading LearnFlow AI...</p>
        </div>
      </motion.div>
    </div>
  )
}
