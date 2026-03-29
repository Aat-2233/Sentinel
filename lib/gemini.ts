import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Delay utility — returns a promise that resolves after `ms` milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * List of models to try, in order of preference.
 * Each model has its own separate quota pool on the free tier,
 * so if one model's quota is exhausted, the next one may still work.
 */
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
]

/**
 * Checks if an error message indicates a quota/rate-limit issue.
 */
function isRateLimitError(message: string): boolean {
  return (
    message.includes('429') ||
    message.includes('Too Many Requests') ||
    message.includes('quota') ||
    message.includes('RESOURCE_EXHAUSTED')
  )
}

/**
 * Checks if the error is a hard quota exhaustion (limit: 0) vs a temporary rate limit.
 * Hard exhaustion means the daily/minute quota is fully gone — retrying the same model won't help.
 */
function isHardQuotaExhaustion(message: string): boolean {
  return message.includes('limit: 0')
}

/**
 * Extracts retry delay from a 429 error message.
 * Looks for "Please retry in Xs" pattern and returns milliseconds.
 */
function parseRetryDelay(errorMessage: string, fallbackMs: number): number {
  const match = errorMessage.match(/retry in ([\d.]+)s/i)
  if (match) {
    const seconds = parseFloat(match[1])
    if (!isNaN(seconds) && seconds > 0) {
      return Math.ceil((seconds + 2) * 1000)
    }
  }
  return fallbackMs
}

/**
 * Attempts to call a single model. Returns the result or throws on error.
 */
async function tryModel(
  modelName: string,
  systemPrompt: string,
  userInput: string,
): Promise<{ data: Record<string, unknown> | null; output: string; error?: boolean; message?: string }> {
  // gemini-2.0-flash supports tools + JSON response mode together.
  // Other models may not — for those, we skip tools and responseMimeType
  // and rely on the prompt to produce JSON output.
  const isPrimaryModel = modelName === 'gemini-2.0-flash'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelConfig: any = {
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  }

  if (isPrimaryModel) {
    modelConfig.generationConfig.responseMimeType = 'application/json'
    modelConfig.tools = [{ googleSearch: {} } as never]
  }

  const model = genAI.getGenerativeModel(modelConfig)

  const promptText = isPrimaryModel
    ? `${systemPrompt}\n\nCompany to analyze: ${userInput}`
    : `${systemPrompt}\n\nIMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation — just raw JSON.\n\nCompany to analyze: ${userInput}`

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ],
  })

  const response = result.response
  const text = response.text()

  // Try to parse JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      data: parsed,
      output: JSON.stringify(parsed, null, 2),
    }
  }

  return {
    data: null,
    output: text,
    error: true,
    message: 'Response was not valid JSON',
  }
}

/**
 * Calls a Gemini agent with:
 *  1. Model fallback — tries multiple models if quota is exhausted on one
 *  2. Retry with backoff — retries on temporary rate limits (same model)
 */
export async function callAgent(
  systemPrompt: string,
  userInput: string,
  agentName: string,
): Promise<{ data: Record<string, unknown> | null; output: string; error?: boolean; message?: string }> {
  const errors: string[] = []

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    // For each model, allow up to 2 retries for temporary rate limits
    const maxRetries = 1
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${agentName}] Trying model: ${modelName} (attempt ${attempt + 1})`)
        const result = await tryModel(modelName, systemPrompt, userInput)

        if (result.error) {
          // JSON parse issue — not a rate limit, just return the error
          return { ...result, message: `${agentName}: ${result.message}` }
        }

        console.log(`[${agentName}] Success with model: ${modelName}`)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'

        if (isRateLimitError(message)) {
          if (isHardQuotaExhaustion(message)) {
            // Quota fully exhausted for this model — skip to next model immediately
            console.log(`[${agentName}] Quota exhausted for ${modelName}, trying next model...`)
            errors.push(`${modelName}: quota exhausted`)
            break // break retry loop, try next model
          }

          // Temporary rate limit — retry after delay (only if we have retries left)
          if (attempt < maxRetries) {
            const retryDelay = parseRetryDelay(message, 3000)
            console.log(
              `[${agentName}] Temporary rate limit on ${modelName}, retrying in ${(retryDelay / 1000).toFixed(1)}s...`
            )
            await delay(retryDelay)
            continue
          }

          // Max retries hit on this model, try next model
          console.log(`[${agentName}] Rate limit persists on ${modelName}, trying next model...`)
          errors.push(`${modelName}: rate limited`)
          break
        }

        // Non-rate-limit error — return immediately
        return {
          data: null,
          output: '',
          error: true,
          message: `${agentName}: ${message}`,
        }
      }
    }
  }

  // All models failed
  return {
    data: null,
    output: '',
    error: true,
    message: `${agentName}: All models quota exhausted (${errors.join(', ')}). Please wait a few minutes for quota to reset, or enable billing on your Google AI API key.`,
  }
}

// Agent system prompts
export const AGENT_PROMPTS = {
  profiler: `You are a Senior Corporate Intelligence Analyst. Your task is to extract factual, verifiable data about a company using Google Search. First, verify if the company exists or if there is a likely spelling mistake. If the company name is heavily misspelled or doesn't exist, set "companyPlausible" to false and provide an array of likely intended company names in "suggestedAlternatives". If it exists, set "companyPlausible" to true, "suggestedAlternatives" to [], and focus strictly on objective data: industry vertical, headquarters, structural business units, verified suppliers/partners, employee count, and factual recent announcements (last 6 months). Do not interpret or add opinions. Ensure all extracted entities are accurate. Return ONLY valid JSON with this exact structure: { "industry": "string", "hq": "string", "businessUnits": ["string"], "suppliers": ["string"], "employeeRange": "string", "recentAnnouncements": ["string"], "companyPlausible": boolean, "suggestedAlternatives": ["string"] }`,

  news: `You are a Senior Media Intelligence Analyst. Analyze news from the last 30 days for the given company. Objectively categorize sentiment based on factual events, not editorial opinions. Calculate an overallScore from 0 (overwhelmingly negative/crisis) to 100 (overwhelmingly positive/breakthrough). Extract strictly factual key events and structural business signals (e.g., leadership changes, regulatory actions, product launches, lawsuits). Do not hallucinate events or amplify PR spin. Return ONLY valid JSON with this exact structure: { "sentiment": "positive|negative|neutral", "overallScore": 0-100, "events": [{"title": "string", "type": "string", "severity": "low|medium|high", "date": "string"}], "riskSignals": ["string"] }`,

  financial: `You are a Senior Financial Analyst. Analyze publicly available financial signals for the given company. Extract strictly factual data such as revenue trends, profitability metrics, debt structuring, strategic investments, or cost-cutting measures. Classify healthStatus objectively as 'stable', 'growing', 'declining', or 'uncertain' based purely on evidence. For each signal, note the objective impact ('positive' or 'negative') without exaggeration. Do not hallucinate financial data. Return ONLY valid JSON with this exact structure: { "healthStatus": "stable|growing|declining|uncertain", "signals": [{"type": "string", "description": "string", "impact": "positive|negative"}], "summary": "string" }`,

  synthesizer: `You are a Lead Enterprise Risk Actuary. You are receiving structured intelligence from 3 specialized analysts. Your mandate is to synthesize this data into a rigorous, unbiased enterprise risk assessment. 
RULES FOR ASSESSMENT:
1. STRICTLY NO HALLUCINATION: Base your entire assessment strictly on the provided data. Do not invent threats, opportunities, or metrics. If no clear threats exist, do not generate them.
2. OBJECTIVE SCORING: Calculate an enterprise riskScore (0-100). 0 means absolute zero operational/financial risk. 100 represents imminent bankruptcy or existential collapse. Do not apply a positive or negative bias based on the company's fame. Calculate risk purely on the combined severity of the provided financial, media, and structural data.
3. CONTEXTUAL EVENTS: Extract up to 3 verified threats and up to 2 verified opportunities. 
4. OUTPUT: Write a factual, concise 2-sentence executive summary and one purely strategic recommendation.
Return ONLY valid JSON with this exact structure: { "riskScore": number, "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL", "summary": "string", "threats": [{"title": "string", "description": "string", "severity": "LOW|MEDIUM|HIGH"}], "opportunities": [{"title": "string", "description": "string"}], "recommendation": "string" }`,
}
