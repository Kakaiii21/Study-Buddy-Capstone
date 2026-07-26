import axios from 'axios'
import { acquireGroqSlot, releaseGroqSlot } from './rateLimit'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-20b'

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

async function postToGroq(prompt: string, apiKey: string) {
  return axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'Be concise. Output only the requested format with no extra explanation or commentary.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  )
}

export async function callGroq(prompt: string, apiKey: string): Promise<GroqResult> {
  // Queue: don't let more than N users hit Groq at the exact same moment.
  const gotSlot = await acquireGroqSlot(3, 1500, 45000)
  if (!gotSlot) {
    throw new Error('Servers are busy right now. Please try again in a moment.')
  }

  try {
    let response
    const maxRetries = 2
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await postToGroq(prompt, apiKey)
        break
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 429 && attempt < maxRetries) {
          const retryAfter = Number(err.response.headers['retry-after'] ?? 2)
          await new Promise((r) => setTimeout(r, retryAfter * 1000))
          continue
        }
        if (status === 429) {
          throw new Error('Rate limit reached. Please try again shortly.')
        }
        throw err
      }
    }

    const content = response!.data?.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from Groq API')

    const usage: GroqUsage = {
      prompt_tokens: response!.data?.usage?.prompt_tokens ?? 0,
      completion_tokens: response!.data?.usage?.completion_tokens ?? 0,
      total_tokens: response!.data?.usage?.total_tokens ?? 0,
    }
    const remainingTokens = parseInt(response!.headers['x-ratelimit-remaining-tokens'] ?? '6000')

    return { text: content, usage, remainingTokens }
  } finally {
    await releaseGroqSlot()
  }
}