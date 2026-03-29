'use client'

import { useEffect, useState, useRef, useCallback, use } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AgentResult, IntelligenceBrief, SSEEvent } from '@/types'
import AgentCard from '@/components/AgentCard'
import RiskDashboard from '@/components/RiskDashboard'

const AGENT_DEFS = [
  { number: '01', name: 'Company Profiler', icon: 'corporate_fare' },
  { number: '02', name: 'News Scanner', icon: 'newspaper' },
  { number: '03', name: 'Financial Detector', icon: 'account_balance' },
  { number: '04', name: 'Risk Synthesizer', icon: 'hub' },
]

export default function AnalyzePage({ params }: { params: Promise<{ company: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const companySlug = decodeURIComponent(resolvedParams.company)
  const companyName = searchParams.get('name') || companySlug.replace(/-/g, ' ')

  const [phase, setPhase] = useState<'loading' | 'synthesizing' | 'complete'>('loading')
  const [agents, setAgents] = useState<AgentResult[]>(
    AGENT_DEFS.map((d) => ({
      name: d.name,
      status: 'idle',
      output: '',
      data: null,
    }))
  )
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [time, setTime] = useState('')
  const [showFlash, setShowFlash] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [intelligenceDepth, setIntelligenceDepth] = useState<'Standard' | 'Deep Scan'>('Deep Scan')
  const [dataSources, setDataSources] = useState<string[]>(['Google Search Grounding', 'Real-time News APIs'])
  const [companyNotFound, setCompanyNotFound] = useState(false)
  const [suggestedAlternatives, setSuggestedAlternatives] = useState<string[]>([])
  const eventSourceRef = useRef<AbortController | null>(null)
  const startTimeRef = useRef(Date.now())

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Elapsed timer
  useEffect(() => {
    if (phase === 'complete') return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Format elapsed time
  const formatElapsed = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0')
    const secs = (s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  // Start SSE analysis
  const startAnalysis = useCallback(async () => {
    const controller = new AbortController()
    eventSourceRef.current = controller

    // Set first 3 agents to loading
    setAgents((prev) =>
      prev.map((a, i) => (i < 3 ? { ...a, status: 'loading' } : a))
    )

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to start analysis')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6))
              handleSSEEvent(event)
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Analysis error:', err)
      }
    }
  }, [companyName])

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.type) {
      case 'agent_start':
        setAgents((prev) =>
          prev.map((a) =>
            a.name === event.agentName ? { ...a, status: 'loading' } : a
          )
        )
        break

      case 'agent_complete':
        if (event.agentName === 'Company Profiler' && event.data && event.data.companyPlausible === false) {
          eventSourceRef.current?.abort();
          setCompanyNotFound(true);
          setSuggestedAlternatives((event.data.suggestedAlternatives as string[]) || []);
          return;
        }

        setAgents((prev) =>
          prev.map((a) =>
            a.name === event.agentName
              ? {
                  ...a,
                  status: 'done',
                  output: event.output || '',
                  data: (event.data as Record<string, unknown>) || null,
                  duration: event.duration,
                }
              : a
          )
        )
        break

      case 'agent_error':
        setAgents((prev) =>
          prev.map((a) =>
            a.name === event.agentName
              ? {
                  ...a,
                  status: 'error',
                  output: event.error || 'Unknown error',
                  duration: event.duration,
                }
              : a
          )
        )
        break

      case 'synthesis_start':
        setPhase('synthesizing')
        setShowFlash(true)
        setTimeout(() => setShowFlash(false), 1000)
        setAgents((prev) =>
          prev.map((a) =>
            a.name === 'Risk Synthesizer' ? { ...a, status: 'loading' } : a
          )
        )
        break

      case 'synthesis_complete':
        if (event.brief) {
          setBrief(event.brief as unknown as IntelligenceBrief)
          setPhase('complete')
        }
        break
    }
  }

  // Start on mount
  useEffect(() => {
    startAnalysis()
    return () => {
      eventSourceRef.current?.abort()
    }
  }, [startAnalysis])

  // Calculate progress
  const doneCount = agents.filter((a) => a.status === 'done' || a.status === 'error').length
  const progress = phase === 'complete' ? 100 : Math.round((doneCount / 4) * 100)

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid z-0 opacity-40" />

      {/* Decorative blurs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-container/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px] pointer-events-none" />

      {/* === FIXED HEADER === */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between bg-[#10131C]">
        <div className="flex items-center gap-3">
          <a href="/" className="text-primary-container font-black italic text-xl tracking-tight hover:opacity-80 transition-opacity">
            SENTINEL
          </a>
          <span className="font-mono text-[10px] text-outline-variant tracking-widest uppercase">
            V2.0.4-BETA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-primary font-bold uppercase tracking-tighter text-sm">
            BETA
          </span>
          <button onClick={() => setSettingsOpen(true)} className="text-outline-variant hover:text-primary transition-colors cursor-pointer" aria-label="Settings">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <button className="text-outline-variant hover:text-primary transition-colors cursor-pointer" aria-label="Notifications">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>
      <div className="fixed top-16 left-0 right-0 h-[2px] bg-[#181B25] z-50" />

      {/* === LAYOUT: SIDEBAR + MAIN === */}
      <div className="relative z-10 flex min-h-screen pt-[66px]">
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[280px] min-h-screen bg-[#0D1117] border-r border-[#1E2D40] fixed top-[66px] left-0 bottom-0 z-40">
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Company name */}
            <h2 className="text-xl font-bold text-on-surface mb-3 capitalize">
              {companyName}
            </h2>

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
              {phase !== 'complete' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-primary-container pulse-dot" />
                  <span className="font-mono text-xs text-primary tracking-wider">
                    {phase === 'synthesizing' ? 'SYNTHESIZING...' : 'ANALYZING...'}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-mono text-xs text-success tracking-wider">
                    COMPLETE
                  </span>
                </>
              )}
            </div>

            {/* Timestamp */}
            <p className="font-mono text-[10px] text-outline-variant mb-6">
              {phase === 'complete'
                ? `Completed in ${formatElapsed(elapsed)}`
                : `Started ${formatElapsed(elapsed)} ago`}
            </p>

            {/* Divider */}
            <div className="h-px bg-[#1E2D40] mb-6" />

            {/* Agent status list */}
            <div className="space-y-4">
              {AGENT_DEFS.map((def, i) => {
                const agent = agents[i]
                const dotColor =
                  agent.status === 'loading'
                    ? 'bg-primary-container pulse-dot'
                    : agent.status === 'done'
                    ? 'bg-success'
                    : agent.status === 'error'
                    ? 'bg-danger'
                    : 'bg-outline-variant'

                const statusText =
                  agent.status === 'loading'
                    ? 'SCANNING...'
                    : agent.status === 'done'
                    ? 'COMPLETE'
                    : agent.status === 'error'
                    ? 'ERROR'
                    : 'QUEUED'

                return (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface">
                          {def.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-outline-variant">
                        {statusText}
                      </span>
                    </div>
                    {/* Micro-preview on complete */}
                    {agent.status === 'done' && agent.output && (
                      <p className="font-mono text-[10px] text-secondary mt-1 ml-4 line-clamp-1 opacity-60">
                        {agent.output.slice(0, 80)}...
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom pinned */}
          <div className="p-4 border-t border-[#1E2D40]">
            <p className="font-mono text-[10px] text-outline-variant leading-relaxed">
              Powered by Gemini 2.0 Flash
              <br />+ Google Search Grounding
            </p>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 lg:ml-[280px] p-6 lg:p-8">
          {companyNotFound ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in zoom-in duration-500">
              <span className="material-symbols-outlined text-6xl text-warning mb-6">warning</span>
              <h2 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Entity Not Found</h2>
              <p className="text-on-surface-variant max-w-md mx-auto mb-8">
                The intelligence systems could not verify <span className="text-primary font-semibold">"{companyName}"</span> as a plausible corporate entity. It may be misspelled or not publicly tracked.
              </p>
              
              {suggestedAlternatives.length > 0 && (
                <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-6 w-full max-w-lg">
                  <h3 className="font-label text-xs tracking-[0.2em] uppercase font-semibold text-outline-variant mb-4">
                    Are you referring to any of these companies?
                  </h3>
                  <div className="flex flex-col gap-3">
                    {suggestedAlternatives.map((alt, i) => (
                      <a 
                        key={i} 
                        href={`/analyze/${encodeURIComponent(alt.toLowerCase().replace(/\s+/g, '-'))}?name=${encodeURIComponent(alt)}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-surface-container-highest bg-[#10131C] hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{alt}</span>
                        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-sm">arrow_forward</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <a href="/" className="mt-8 px-6 py-2.5 bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold rounded-lg border border-surface-container-highest transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">search</span>
                New Search
              </a>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-on-surface-variant tracking-wider">
                Intelligence Gathering
              </span>
              <span className="font-mono text-xs text-primary">{progress}%</span>
            </div>
            <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Phase 1: Agent cards grid */}
          {phase !== 'complete' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {AGENT_DEFS.map((def, i) => (
                  <AgentCard
                    key={i}
                    number={def.number}
                    name={def.name}
                    icon={def.icon}
                    status={agents[i].status}
                    output={agents[i].output}
                    duration={agents[i].duration}
                    error={agents[i].status === 'error' ? agents[i].output : undefined}
                    delay={i * 40}
                  />
                ))}
              </div>

              {/* Synthesizing overlay */}
              {phase === 'synthesizing' && (
                <div className="flex flex-col items-center justify-center py-16 relative">
                  {/* Flash */}
                  {showFlash && (
                    <div className="absolute inset-0 bg-primary-container/10 flash-overlay rounded-xl" />
                  )}

                  {/* Radar sweep */}
                  <div className="relative w-32 h-32 mb-6">
                    <svg viewBox="0 0 128 128" className="w-full h-full">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#1E2D40"
                        strokeWidth="2"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="40"
                        fill="none"
                        stroke="#1E2D40"
                        strokeWidth="1"
                        strokeDasharray="4 8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="24"
                        fill="none"
                        stroke="#1E2D40"
                        strokeWidth="1"
                        strokeDasharray="2 6"
                      />
                    </svg>

                    {/* Sweep line */}
                    <div className="absolute inset-0 radar-sweep">
                      <svg viewBox="0 0 128 128" className="w-full h-full">
                        <defs>
                          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
                            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                        <line
                          x1="64"
                          y1="64"
                          x2="64"
                          y2="8"
                          stroke="url(#sweepGrad)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-container pulse-dot" />
                  </div>

                  <p className="font-mono text-sm text-primary tracking-wider animate-pulse">
                    SYNTHESIZING INTELLIGENCE...
                  </p>
                </div>
              )}
            </>
          )}

          {/* Phase 2: Intelligence Brief */}
          {phase === 'complete' && brief && (
            <RiskDashboard brief={brief} />
          )}
            </>
          )}
        </main>
      </div>

      {/* Settings Modal Setup */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#10131C] border border-[#1E2D40] rounded-xl shadow-2xl p-6 overflow-hidden border-t-primary/30">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-mono tracking-tight text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                SYSTEM CONFIGURATION
              </h3>
              <button onClick={() => setSettingsOpen(false)} className="text-outline-variant hover:text-danger transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-label uppercase tracking-widest text-outline-variant mb-2">Intelligence Depth</label>
                <div className="flex bg-[#0D1117] rounded-lg p-1 border border-[#1E2D40]">
                  <button 
                    onClick={() => setIntelligenceDepth('Standard')} 
                    className={`flex-1 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${intelligenceDepth === 'Standard' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/20' : 'text-outline-variant hover:text-on-surface'}`}
                  >
                    Standard
                  </button>
                  <button 
                    onClick={() => setIntelligenceDepth('Deep Scan')} 
                    className={`flex-1 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${intelligenceDepth === 'Deep Scan' ? 'bg-surface-container-highest text-primary shadow-sm border border-primary/20' : 'text-outline-variant hover:text-on-surface'}`}
                  >
                    Deep Scan
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-label uppercase tracking-widest text-outline-variant mb-2">Data Sources</label>
                <div className="space-y-2">
                  {['Google Search Grounding', 'Enterprise Knowledge Graph', 'Real-time News APIs'].map((src, i) => {
                    const isChecked = dataSources.includes(src)
                    return (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => {
                        e.preventDefault()
                        setDataSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])
                      }}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary/20 border-primary' : 'border-outline-variant group-hover:border-primary/50'}`}>
                          {isChecked && <span className="material-symbols-outlined text-[12px] text-primary">check</span>}
                        </div>
                        <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">{src}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#1E2D40] flex justify-end">
                <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
                  SAVE & APPLY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === FIXED FOOTER === */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex justify-between items-end p-4 lg:p-6 pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-sm animate-pulse" style={{ fontSize: '12px' }}>
              sensors
            </span>
            <span className="font-label text-[10px] tracking-[0.1em] uppercase font-semibold text-on-surface-variant">
              System Status: Optimal
            </span>
          </div>
          <span className="font-mono text-[10px] text-outline-variant">
            LATENCY: 14MS // UPTIME: 99.99%
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline-variant text-sm" style={{ fontSize: '12px' }}>
              schedule
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-on-surface-variant">
              {time}
            </span>
          </div>
          <span className="font-label text-[10px] tracking-widest uppercase text-outline-variant">
            Intelligence Protocol V2
          </span>
        </div>
      </footer>
    </div>
  )
}
