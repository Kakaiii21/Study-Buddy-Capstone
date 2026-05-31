import axios from 'axios'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

export interface GroqUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface GroqResult {
  text: string
  usage: GroqUsage
  remainingTokens: number
}


export async function callGroq(
  prompt: string,
  apiKey: string
): Promise<GroqResult> {
  let response
  try {
    response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    )
  } catch (err: any) {
    if (err?.response?.status === 429) {
      const retryAfter = err.response.headers['retry-after'] ?? '30'
      throw new Error(`Rate limit reached. Please wait ${retryAfter} seconds and try again.`)
    }
    throw err
  }

  const content = response.data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq API')

  const usage: GroqUsage = {
    prompt_tokens: response.data?.usage?.prompt_tokens ?? 0,
    completion_tokens: response.data?.usage?.completion_tokens ?? 0,
    total_tokens: response.data?.usage?.total_tokens ?? 0,
  }

  const remainingTokens = parseInt(
    response.headers['x-ratelimit-remaining-tokens'] ?? '6000'
  )

  return { text: content, usage, remainingTokens }
}