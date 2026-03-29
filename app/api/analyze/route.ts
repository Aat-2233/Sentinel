import { NextRequest } from 'next/server'
import { callAgent, AGENT_PROMPTS } from '@/lib/gemini'
import type { IntelligenceBrief, AgentResult, SynthesizerData, ThreatItem, OpportunityItem } from '@/types'

export const maxDuration = 120

/**
 * Small delay to stagger API calls and reduce rate limit pressure.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json()

    if (!company || typeof company !== 'string') {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        const agents: AgentResult[] = [
          { name: 'Company Profiler', status: 'idle', output: '', data: null },
          { name: 'News Scanner', status: 'idle', output: '', data: null },
          { name: 'Financial Detector', status: 'idle', output: '', data: null },
          { name: 'Risk Synthesizer', status: 'idle', output: '', data: null },
        ]

        // Run agents sequentially with staggered delays to avoid rate limits
        const agentConfigs = [
          { prompt: AGENT_PROMPTS.profiler, name: 'Company Profiler' },
          { prompt: AGENT_PROMPTS.news, name: 'News Scanner' },
          { prompt: AGENT_PROMPTS.financial, name: 'Financial Detector' },
        ]

        const agentOutputs: Record<string, unknown>[] = []

        for (let i = 0; i < agentConfigs.length; i++) {
          const { prompt, name } = agentConfigs[i]

          // Add a stagger delay between agents (not before the first one)
          if (i > 0) {
            await delay(2000) // 2 second gap between agent calls
          }

          sendEvent({ type: 'agent_start', agentName: name })
          const startTime = Date.now()

          const result = await callAgent(prompt, company, name)
          const duration = ((Date.now() - startTime) / 1000).toFixed(1)

          if (!result.error) {
            agents[i] = {
              name,
              status: 'done',
              output: result.output,
              data: result.data,
              duration: parseFloat(duration),
            }
            agentOutputs.push({ agent: name, data: result.data })
            sendEvent({
              type: 'agent_complete',
              agentName: name,
              data: result.data,
              output: result.output,
              duration: parseFloat(duration),
            })
          } else {
            agents[i] = {
              name,
              status: 'error',
              output: result.message || 'Unknown error',
              data: null,
              duration: parseFloat(duration),
            }
            sendEvent({
              type: 'agent_error',
              agentName: name,
              error: result.message || 'Unknown error',
              duration: parseFloat(duration),
            })
          }
        }

        // Delay before synthesizer to further avoid rate limits
        await delay(2000)

        // Run synthesizer with combined outputs
        sendEvent({ type: 'synthesis_start', agentName: 'Risk Synthesizer' })
        const synthStart = Date.now()

        const synthResult = await callAgent(
          AGENT_PROMPTS.synthesizer,
          `Company: ${company}\n\nAgent Intelligence Data:\n${JSON.stringify(agentOutputs, null, 2)}`,
          'Risk Synthesizer'
        )

        const synthDuration = ((Date.now() - synthStart) / 1000).toFixed(1)

        if (!synthResult.error && synthResult.data) {
          const synthData = synthResult.data as unknown as SynthesizerData
          agents[3] = {
            name: 'Risk Synthesizer',
            status: 'done',
            output: synthResult.output,
            data: synthResult.data,
            duration: parseFloat(synthDuration),
          }

          const brief: IntelligenceBrief = {
            company,
            riskScore: synthData.riskScore ?? 50,
            riskLevel: synthData.riskLevel ?? 'MEDIUM',
            summary: synthData.summary ?? 'Analysis complete.',
            threats: (synthData.threats as ThreatItem[]) ?? [],
            opportunities: (synthData.opportunities as OpportunityItem[]) ?? [],
            recommendation: synthData.recommendation ?? 'Further analysis recommended.',
            agents,
            generatedAt: new Date().toISOString(),
          }

          sendEvent({
            type: 'agent_complete',
            agentName: 'Risk Synthesizer',
            data: synthResult.data,
            output: synthResult.output,
            duration: parseFloat(synthDuration),
          })
          sendEvent({ type: 'synthesis_complete', brief })
        } else {
          agents[3] = {
            name: 'Risk Synthesizer',
            status: 'error',
            output: synthResult.message || 'Synthesis failed',
            data: null,
            duration: parseFloat(synthDuration),
          }

          // Still return a brief with partial data
          const brief: IntelligenceBrief = {
            company,
            riskScore: 50,
            riskLevel: 'MEDIUM',
            summary: 'Partial analysis — synthesis agent encountered an error.',
            threats: [{ title: 'Incomplete Analysis', description: 'The risk synthesizer was unable to process all agent data.', severity: 'MEDIUM' }],
            opportunities: [],
            recommendation: 'Re-run the analysis or review individual agent outputs.',
            agents,
            generatedAt: new Date().toISOString(),
          }

          sendEvent({
            type: 'agent_error',
            agentName: 'Risk Synthesizer',
            error: synthResult.message || 'Synthesis failed',
            duration: parseFloat(synthDuration),
          })
          sendEvent({ type: 'synthesis_complete', brief })
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
