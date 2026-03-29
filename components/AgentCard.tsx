'use client'

import type { AgentStatus } from '@/types'

interface AgentCardProps {
  number: string
  name: string
  icon: string
  status: AgentStatus
  output?: string
  duration?: number
  error?: string
  delay?: number
}

const STATUS_CONFIG = {
  idle: {
    borderColor: 'border-outline-variant/30',
    bgColor: 'bg-surface-container-low',
    dotColor: 'bg-outline-variant',
    statusText: 'QUEUED',
    statusColor: 'text-outline',
  },
  loading: {
    borderColor: 'border-primary-container/60',
    bgColor: 'bg-primary-container/5',
    dotColor: 'bg-primary-container',
    statusText: 'SCANNING',
    statusColor: 'text-primary',
  },
  done: {
    borderColor: 'border-success/40',
    bgColor: 'bg-surface-container-low',
    dotColor: 'bg-success',
    statusText: 'COMPLETE',
    statusColor: 'text-success',
  },
  error: {
    borderColor: 'border-danger/40',
    bgColor: 'bg-danger/5',
    dotColor: 'bg-danger',
    statusText: 'ERROR',
    statusColor: 'text-danger',
  },
}

export default function AgentCard({
  number,
  name,
  icon,
  status,
  output,
  duration,
  error,
  delay = 0,
}: AgentCardProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor}
        p-6 transition-all duration-200 ease-out
        hover:border-opacity-80
        ${status === 'loading' ? 'glow-pulse' : ''}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Scan sweep for loading state */}
      {status === 'loading' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 scanning-line scan-sweep opacity-30" />
        </div>
      )}

      {/* Done checkmark badge */}
      {status === 'done' && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-success text-sm" style={{ fontSize: '14px' }}>
            check
          </span>
        </div>
      )}

      {/* Error X badge */}
      {status === 'error' && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-danger/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-danger text-sm" style={{ fontSize: '14px' }}>
            close
          </span>
        </div>
      )}

      {/* Agent number */}
      <div className="font-mono text-xs text-outline-variant mb-4">{number}</div>

      {/* Agent icon + name */}
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-on-surface-variant text-2xl">
          {icon}
        </span>
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-on-surface">
          {name}
        </h3>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'loading' ? 'pulse-dot' : ''}`} />
        <span className={`font-mono text-xs tracking-wider ${config.statusColor}`}>
          {config.statusText}
          {status === 'loading' && (
            <span className="inline-block ml-1 animate-pulse">●●●</span>
          )}
        </span>
      </div>

      {/* Output preview (done state) */}
      {status === 'done' && output && (
        <p className="text-xs text-secondary font-mono line-clamp-3 mt-2 leading-relaxed opacity-70">
          {typeof output === 'string' && output.length > 150
            ? output.slice(0, 150) + '...'
            : output}
        </p>
      )}

      {/* Error message */}
      {status === 'error' && error && (
        <p className="text-xs text-danger/80 font-mono mt-2 line-clamp-2">
          {error}
        </p>
      )}

      {/* Duration (done state) */}
      {status === 'done' && duration !== undefined && (
        <div className="absolute bottom-3 right-4">
          <span className="font-mono text-[10px] text-outline-variant tracking-wider">
            {duration}s
          </span>
        </div>
      )}
    </div>
  )
}
