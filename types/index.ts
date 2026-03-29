export type AgentStatus = 'idle' | 'loading' | 'done' | 'error'

export type AgentResult = {
  name: string
  status: AgentStatus
  output: string
  data: Record<string, unknown> | null
  duration?: number
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ThreatItem = {
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export type OpportunityItem = {
  title: string
  description: string
}

export type IntelligenceBrief = {
  company: string
  riskScore: number
  riskLevel: RiskLevel
  summary: string
  threats: ThreatItem[]
  opportunities: OpportunityItem[]
  recommendation: string
  agents: AgentResult[]
  generatedAt: string
}

// Agent-specific response types
export type ProfilerData = {
  industry: string
  hq: string
  businessUnits: string[]
  suppliers: string[]
  employeeRange: string
  recentAnnouncements: string[]
  companyPlausible?: boolean
  suggestedAlternatives?: string[]
}

export type NewsEvent = {
  title: string
  type: string
  severity: 'low' | 'medium' | 'high'
  date: string
}

export type NewsData = {
  sentiment: 'positive' | 'negative' | 'neutral'
  overallScore: number
  events: NewsEvent[]
  riskSignals: string[]
}

export type FinancialSignal = {
  type: string
  description: string
  impact: 'positive' | 'negative'
}

export type FinancialData = {
  healthStatus: 'stable' | 'growing' | 'declining' | 'uncertain'
  signals: FinancialSignal[]
  summary: string
}

export type SynthesizerData = {
  riskScore: number
  riskLevel: RiskLevel
  summary: string
  threats: ThreatItem[]
  opportunities: OpportunityItem[]
  recommendation: string
}

// SSE event types
export type SSEEvent = {
  type: 'agent_start' | 'agent_complete' | 'agent_error' | 'synthesis_start' | 'synthesis_complete' | 'error'
  agentName?: string
  data?: Record<string, unknown> | null
  output?: string
  duration?: number
  brief?: IntelligenceBrief
  error?: string
}
