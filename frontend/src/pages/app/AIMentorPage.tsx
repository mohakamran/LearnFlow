import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Brain, User, Sparkles, Code, Lightbulb, TrendingUp } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickPrompts = [
  { icon: Lightbulb, label: 'Explain a concept', prompt: 'Can you explain the concept I\'m currently learning in simple terms?' },
  { icon: Code, label: 'Code review', prompt: 'Please review my code and suggest improvements.' },
  { icon: TrendingUp, label: 'Progress analysis', prompt: 'Analyze my learning progress and tell me what to focus on.' },
  { icon: Sparkles, label: 'Motivation', prompt: 'I\'m feeling stuck. Can you motivate me to keep learning?' },
]

export default function AIMentorPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] ?? 'there'}! 👋 I'm your AI learning mentor. I'm here to help you understand concepts, review your code, keep you motivated, and answer any questions along your learning journey.\n\nWhat would you like to work on today?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.post('/ai/chat', {
      message,
      history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      context: user?.active_roadmap ? `User's learning goal: ${user.active_roadmap.goal}` : undefined,
    }).then(r => r.data),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }])
      setError(null)
    },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const sendMessage = (text = input.trim()) => {
    if (!text || chatMutation.isPending) return

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }])
    setInput('')
    chatMutation.mutate(text)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white">AI Mentor</h1>
          <p className="text-xs text-muted">Your personal learning companion</p>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              )}>
                {msg.role === 'assistant' ? (
                  <div className={cn('prose-custom text-sm', 'prose-p:text-slate-700 dark:prose-p:text-slate-300')}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className={cn('text-xs mt-1.5', msg.role === 'user' ? 'text-white/60' : 'text-muted')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5">
                  <img src={user?.avatar_url} alt={user?.name} className="w-full h-full object-cover" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {chatMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 bg-primary/40 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <Alert message={error} onClose={() => setError(null)} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="py-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 pt-2">
        <div className="flex items-end gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 focus-within:border-primary transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask your mentor anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none max-h-32 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatMutation.isPending}
            className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors shrink-0"
          >
            {chatMutation.isPending ? <Spinner size="sm" className="border-white border-t-white/30" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted text-center mt-2">AI responses are educational — always verify important information</p>
      </div>
    </div>
  )
}
