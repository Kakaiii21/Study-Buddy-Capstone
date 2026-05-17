import axios from 'axios'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

export async function callGroq(
  prompt: string,
  apiKey: string
): Promise<string> {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
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

  const content = response.data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq API')
  return content
}