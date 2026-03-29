'use client'

import { useState } from 'react'
import type { 
  IntelligenceBrief, 
  ProfilerData, 
  NewsData, 
  FinancialData 
} from '@/types'
import RiskScore from './RiskScore'

interface RiskDashboardProps {
  brief: IntelligenceBrief
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-success/15 text-success border-success/20',
    MEDIUM: 'bg-warning/15 text-warning border-warning/20',
    HIGH: 'bg-danger/15 text-danger border-danger/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${colors[severity.toUpperCase()] || colors.MEDIUM}`}>
      {severity.toUpperCase()}
    </span>
  )
}

function SectionHeader({ icon, title, colorClass }: { icon: string; title: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-surface-container-highest">
      <span className={`material-symbols-outlined text-lg ${colorClass}`}>{icon}</span>
      <h3 className={`font-label text-xs tracking-[0.2em] uppercase font-semibold ${colorClass}`}>
        {title}
      </h3>
    </div>
  )
}

export default function RiskDashboard({ brief }: RiskDashboardProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<number>>(new Set())

  // Type assertions assuming data is properly populated by the agents.
  // We fall back to null if undefined.
  const profilerData = (brief.agents.find(a => a.name === 'Company Profiler' || a.name?.toLowerCase().includes('profiler'))?.data as ProfilerData) || null
  const newsData = (brief.agents.find(a => a.name === 'News Scanner' || a.name?.toLowerCase().includes('news'))?.data as NewsData) || null
  const financialData = (brief.agents.find(a => a.name === 'Financial Detector' || a.name?.toLowerCase().includes('financ'))?.data as FinancialData) || null

  const toggleAgent = (index: number) => {
    setExpandedAgents(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 
        HERO METRICS 
        A dynamic, multi-metric hero section showing the Risk Score
        along side high-level metrics derived from the data.
      */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-up">
        {/* Risk Score */}
        <div className="col-span-1 glass-card border flex flex-col items-center justify-center p-8 rounded-xl border-surface-container-highest hover:border-primary/40 transition-all duration-500 overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h3 className="font-label text-xs tracking-[0.2em] uppercase font-semibold text-outline-variant mb-4 self-start">Overall Risk</h3>
          <RiskScore score={brief.riskScore} level={brief.riskLevel} />
        </div>

        {/* Executive Overview */}
        <div className="col-span-1 xl:col-span-2 glass-card border p-6 lg:p-8 rounded-xl border-surface-container-highest hover:border-primary/40 transition-all duration-500 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div>
            <SectionHeader icon="description" title="Executive Intelligence Brief" colorClass="text-primary" />
            
            <div className="mb-6 relative z-10">
              <p className="text-on-surface leading-relaxed text-sm lg:text-base font-medium">
                {brief.summary}
              </p>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg relative overflow-hidden z-10 backdrop-blur-sm shadow-[0_0_15px_rgba(14,165,233,0.1)]">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary pulse-dot" />
             <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-base">lightbulb_circle</span>
              <span className="font-label text-xs tracking-[0.2em] uppercase font-semibold text-primary">Strategic Recommendation</span>
            </div>
            <p className="text-sm text-on-surface font-medium leading-relaxed pl-1">
              {brief.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* 
        DATA GRIDS: Profiler + Financials + News
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profiler Card */}
        {profilerData && (
          <div className="glass-card border border-surface-container-highest rounded-xl p-6 hover:border-secondary/40 hover:bg-surface-container-low transition-all duration-300 transform hover:-translate-y-1 fade-up" style={{ animationDelay: '100ms' }}>
            <SectionHeader icon="corporate_fare" title="Entity Profile" colorClass="text-secondary" />
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-surface-container-highest/50 group">
                <span className="font-mono text-[10px] uppercase text-outline-variant group-hover:text-secondary transition-colors">Industry</span>
                <span className="text-xs font-semibold text-on-surface text-right max-w-[60%] line-clamp-2">{profilerData.industry}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-surface-container-highest/50 group">
                <span className="font-mono text-[10px] uppercase text-outline-variant group-hover:text-secondary transition-colors">HQ</span>
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-outline-variant">location_on</span>
                  {profilerData.hq}
                </span>
              </div>
              {profilerData.employeeRange && (
                <div className="flex justify-between items-center py-2.5 border-b border-surface-container-highest/50 group">
                  <span className="font-mono text-[10px] uppercase text-outline-variant group-hover:text-secondary transition-colors">Employees</span>
                  <span className="text-xs font-semibold text-on-surface">{profilerData.employeeRange}</span>
                </div>
              )}
              {profilerData.businessUnits && profilerData.businessUnits.length > 0 && (
                <div className="py-2">
                  <span className="font-mono text-[10px] uppercase text-outline-variant block mb-2">Key Business Units</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profilerData.businessUnits.map((bu, i) => (
                      <span key={i} className="px-2 py-1 bg-surface-container border border-surface-container-highest rounded-md text-[10px] text-on-surface-variant font-medium hover:text-on-surface hover:border-secondary/50 transition-colors cursor-default">
                        {bu}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financials Card */}
        {financialData && (
          <div className="glass-card border border-surface-container-highest rounded-xl p-6 hover:border-tertiary/40 hover:bg-surface-container-low transition-all duration-300 transform hover:-translate-y-1 fade-up group" style={{ animationDelay: '200ms' }}>
            <SectionHeader icon="account_balance" title="Financial Health" colorClass="text-tertiary" />
            <div className="mb-5 flex items-center justify-between bg-surface-container p-3 rounded-lg border border-surface-container-highest">
               <span className="font-mono text-xs uppercase text-outline-variant">Status</span>
               <span className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                  financialData.healthStatus === 'stable' ? 'bg-success/15 text-success border-success/20' :
                  financialData.healthStatus === 'growing' ? 'bg-primary/15 text-primary border-primary/20' :
                  financialData.healthStatus === 'declining' ? 'bg-danger/15 text-danger border-danger/20' :
                  'bg-warning/15 text-warning border-warning/20'
               }`}>
                 <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                 {financialData.healthStatus}
               </span>
            </div>
            {financialData.signals && financialData.signals.length > 0 && (
              <div className="space-y-3">
                <span className="font-mono text-[10px] uppercase text-outline-variant block mb-1">Key Signals</span>
                {financialData.signals.slice(0, 3).map((sig, i) => (
                  <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(brief.company + ' financial ' + sig.type)}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 items-start p-2.5 rounded-lg bg-surface-container border border-transparent hover:border-tertiary/30 hover:bg-tertiary/5 transition-all cursor-pointer group/item">
                    <span className={`material-symbols-outlined text-[16px] mt-0.5 p-1 rounded-full bg-surface-container-highest group-hover/item:bg-tertiary/20 ${sig.impact === 'positive' ? 'text-success' : 'text-danger'}`}>
                      {sig.impact === 'positive' ? 'trending_up' : 'trending_down'}
                    </span>
                    <div>
                       <p className="text-xs font-bold text-on-surface mb-0.5 leading-tight group-hover/item:text-tertiary transition-colors flex items-center gap-1">{sig.type} <span className="material-symbols-outlined text-[10px] opacity-0 group-hover/item:opacity-100 transition-opacity">open_in_new</span></p>
                       <p className="text-[11px] text-on-surface-variant leading-snug">{sig.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* News Sentiment Card */}
        {newsData && (
          <div className="glass-card border border-surface-container-highest rounded-xl p-6 hover:border-primary-container/40 hover:bg-surface-container-low transition-all duration-300 transform hover:-translate-y-1 fade-up" style={{ animationDelay: '300ms' }}>
            <SectionHeader icon="monitoring" title="Media Sentiment" colorClass="text-primary-container" />
             <div className="mb-6 flex items-center justify-between border-b border-surface-container-highest/50 pb-4">
               <div>
                  <span className="font-mono text-[10px] uppercase text-outline-variant block mb-1">Overall Sentiment</span>
                  <span className={`px-3 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border inline-block ${
                      newsData.sentiment === 'positive' ? 'bg-success/15 text-success border-success/20' :
                      newsData.sentiment === 'negative' ? 'bg-danger/15 text-danger border-danger/20' :
                      'bg-outline-variant/30 text-outline-variant border-outline-variant/30'
                  }`}>
                    {newsData.sentiment}
                  </span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="font-mono text-[10px] uppercase text-outline-variant block mb-[-4px]">Signal Score</span>
                 <span className="text-3xl font-bold font-mono text-on-surface tracking-tighter">
                   {newsData.overallScore}<span className="text-sm text-outline-variant">/100</span>
                 </span>
               </div>
            </div>
            {newsData.events && newsData.events.length > 0 && (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[9px] before:w-px before:bg-surface-container-highest">
                <span className="font-mono text-[10px] uppercase text-outline-variant block mb-2 bg-transparent relative z-10 pl-6">Recent Events</span>
                {newsData.events.slice(0, 3).map((event, i) => (
                  <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(brief.company + ' news ' + event.title)}`} target="_blank" rel="noopener noreferrer" className="relative pl-7 flex flex-col gap-1.5 group cursor-pointer hover:bg-primary/5 p-2 rounded-lg -ml-2 transition-all hover:border-primary/20 border border-transparent">
                    <div className="absolute left-[9px] top-2 w-[12px] h-px bg-surface-container-highest group-hover:bg-primary/50 transition-colors" />
                    <div className={`absolute left-[6.5px] top-1 w-1.5 h-1.5 rounded-full ring-4 ring-[#181b25] ${event.severity === 'high' ? 'bg-danger' : event.severity === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                    <p className="text-[12px] font-semibold text-on-surface leading-tight line-clamp-2 group-hover:text-primary transition-colors flex items-center gap-1">{event.title} <span className="material-symbols-outlined text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span></p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-mono text-outline-variant uppercase bg-surface-container px-1.5 py-0.5 rounded tracking-widest">{event.type}</span>
                       <span className="text-[9px] font-mono text-outline-variant/50">{event.date}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 
        THREATS & OPPORTUNITIES
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* THREAT SIGNALS */}
        <div className="glass-card border border-surface-container-highest rounded-xl p-6 lg:p-8 hover:border-danger/30 transition-all duration-500 fade-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-highest/50">
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center border border-danger/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-danger/20 animate-pulse opacity-50" />
                <span className="material-symbols-outlined text-danger text-2xl relative z-10">warning</span>
              </div>
              <div>
                 <h3 className="font-label text-sm tracking-[0.2em] uppercase font-bold text-danger mb-1">Threat Signals</h3>
                 <p className="font-mono text-[10px] text-outline-variant tracking-wider uppercase">Strategic Vulnerabilities</p>
              </div>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-2xl font-mono font-bold text-danger leading-none">{brief.threats.length}</span>
                <span className="font-mono text-[10px] text-outline-variant uppercase">Detected</span>
             </div>
          </div>

          <div className="space-y-4">
            {brief.threats.length > 0 ? (
              brief.threats.map((threat, i) => (
                <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(brief.company + ' threat risk ' + threat.title)}`} target="_blank" rel="noopener noreferrer" className="block bg-surface-container-low border border-danger/20 p-5 rounded-xl relative overflow-hidden group hover:bg-surface-container hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all duration-300 cursor-pointer">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger scale-y-[0.3] group-hover:scale-y-100 transition-transform origin-center duration-300" />
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-on-surface leading-snug group-hover:text-danger transition-colors flex items-center gap-2">{threat.title} <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span></h4>
                    <SeverityBadge severity={threat.severity} />
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{threat.description}</p>
                </a>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-3xl text-success mb-2 opacity-50">check_circle</span>
                <p className="font-mono text-xs text-outline-variant tracking-wider">NO_THREATS_DETECTED</p>
              </div>
            )}
          </div>
        </div>

        {/* OPPORTUNITIES */}
        <div className="glass-card border border-surface-container-highest rounded-xl p-6 lg:p-8 hover:border-success/30 transition-all duration-500 fade-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-highest/50">
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20 relative overflow-hidden group">
                <div className="absolute inset-x-0 bottom-0 bg-success/20 h-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="material-symbols-outlined text-success text-2xl relative z-10">rocket_launch</span>
              </div>
              <div>
                 <h3 className="font-label text-sm tracking-[0.2em] uppercase font-bold text-success mb-1">Opportunities</h3>
                 <p className="font-mono text-[10px] text-outline-variant tracking-wider uppercase">Strategic Growth Areas</p>
              </div>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-2xl font-mono font-bold text-success leading-none">{brief.opportunities.length}</span>
                <span className="font-mono text-[10px] text-outline-variant uppercase">Identified</span>
             </div>
          </div>

          <div className="space-y-4">
            {brief.opportunities.length > 0 ? (
              brief.opportunities.map((opp, i) => (
                <a key={i} href={`https://www.google.com/search?q=${encodeURIComponent(brief.company + ' ' + opp.title)}`} target="_blank" rel="noopener noreferrer" className="block bg-surface-container-low border border-success/20 p-5 rounded-xl relative overflow-hidden group hover:bg-surface-container hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 cursor-pointer">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-success scale-y-[0.3] group-hover:scale-y-100 transition-transform origin-center duration-300" />
                  <h4 className="text-sm font-bold text-on-surface mb-2 leading-snug group-hover:text-success transition-colors flex items-center gap-2">{opp.title} <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span></h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{opp.description}</p>
                </a>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 opacity-50">search_off</span>
                <p className="font-mono text-xs text-outline-variant tracking-wider">NO_OPPORTUNITIES_FOUND</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        AGENT INTELLIGENCE ACCORDION
      */}
      <div className="glass-card border border-surface-container-highest rounded-xl p-6 lg:p-8 hover:border-outline-variant/50 transition-all duration-300 fade-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary text-xl">hub</span>
          </div>
          <div>
            <h3 className="font-label text-sm tracking-[0.2em] uppercase font-bold text-on-surface mb-0.5">
              Raw Intelligence Logs
            </h3>
            <p className="font-mono text-[10px] text-outline-variant uppercase tracking-wider">Direct outputs from autonomous agents</p>
          </div>
        </div>

        <div className="space-y-3">
          {brief.agents.map((agent, i) => (
            <div key={i} className="border border-outline-variant/20 rounded-xl overflow-hidden group">
              <button
                onClick={() => toggleAgent(i)}
                className="w-full flex items-center justify-between px-5 py-4 bg-surface-container-lowest hover:bg-surface-container-low transition-colors outline-none focus-visible:ring-2 ring-primary/50"
                id={`agent-accordion-${i}`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-6 h-6">
                     <div className={`absolute inset-0 rounded-full opacity-20 ${agent.status === 'done' ? 'bg-success' : agent.status === 'error' ? 'bg-danger' : 'bg-outline-variant'}`} />
                     <div className={`w-2 h-2 rounded-full ${agent.status === 'done' ? 'bg-success' : agent.status === 'error' ? 'bg-danger' : 'bg-outline-variant'} ${agent.status === 'loading' ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className="font-mono text-sm uppercase tracking-widest text-on-surface font-semibold group-hover:text-primary transition-colors">
                    {agent.name}
                  </span>
                  {agent.duration !== undefined && (
                    <span className="font-mono text-[10px] text-outline-variant bg-surface-container px-2 py-0.5 rounded ml-2">
                      {agent.duration}s
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[10px] tracking-widest uppercase ${agent.status === 'done' ? 'text-success' : agent.status === 'error' ? 'text-danger' : 'text-outline-variant'}`}>
                    {agent.status}
                  </span>
                  <span className={`material-symbols-outlined text-outline-variant text-lg transition-transform duration-300 group-hover:text-primary ${expandedAgents.has(i) ? 'rotate-180' : 'rotate-0'}`}>
                    expand_more
                  </span>
                </div>
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${expandedAgents.has(i) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="bg-[#0b0e17] border-t border-outline-variant/10 p-5">
                    <pre className="font-mono text-xs text-[#aab9d2] leading-relaxed whitespace-pre-wrap break-words overflow-x-auto max-h-80 overflow-y-auto w-full custom-scrollbar">
                      {agent.output || 'No output available'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated timestamp */}
      <div className="text-center pt-6 fade-up flex justify-center w-full" style={{ animationDelay: '700ms' }}>
        <p className="font-mono text-[10px] text-outline-variant tracking-[0.2em] flex items-center justify-center gap-3 bg-surface-container-lowest px-6 py-2 rounded-full border border-surface-container-highest">
           <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
           INTELLIGENCE GENERATED: {new Date(brief.generatedAt).toLocaleString()} UTC
        </p>
      </div>
    </div>
  )
}

