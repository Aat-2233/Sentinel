import { NextRequest, NextResponse } from 'next/server'
import { callAgent, AGENT_PROMPTS } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { company, agentOutputs } = await req.json()

    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const combinedInput = `Company: ${company}\n\nAgent Intelligence Data:\n${JSON.stringify(agentOutputs, null, 2)}`

    const result = await callAgent(AGENT_PROMPTS.synthesizer, combinedInput, 'Risk Synthesizer')

    return NextResponse.json({
      name: 'Risk Synthesizer',
      status: result.error ? 'error' : 'done',
      output: result.output,
      data: result.data,
      message: result.message,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to run Risk Synthesizer agent' },
      { status: 500 }
    )
  }
}
