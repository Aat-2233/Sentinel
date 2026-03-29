import { NextRequest, NextResponse } from 'next/server'
import { callAgent, AGENT_PROMPTS } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json()

    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const result = await callAgent(AGENT_PROMPTS.financial, company, 'Financial Detector')

    return NextResponse.json({
      name: 'Financial Detector',
      status: result.error ? 'error' : 'done',
      output: result.output,
      data: result.data,
      message: result.message,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to run Financial Detector agent' },
      { status: 500 }
    )
  }
}
