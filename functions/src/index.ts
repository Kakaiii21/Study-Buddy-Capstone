import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import Busboy from 'busboy'
import axios from 'axios'
import { extractText } from './extractText'
import { callGroq } from './groqClient'
import { parseQuiz, parseFlashcards } from './parsers'

admin.initializeApp()

function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

export const generateStudyMaterial = onRequest(
  { timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    setCors(res)

    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

    try {
      const apiKey = process.env.GROQ_API_KEY
      if (!apiKey) { res.status(500).json({ error: 'GROQ_API_KEY not set' }); return }

      const contentType = req.headers['content-type'] || ''
      let fileBuffer: Buffer | null = null
      let fileType = ''
      let mode: 'quiz' | 'flashcard' = 'quiz'
      let numItems = 10

      if (contentType.includes('multipart/form-data')) {
        const result = await parseMultipart(req)
        fileBuffer = result.fileBuffer
        fileType = result.fileType
        mode = result.mode
        numItems = result.numItems
      } else if (contentType.includes('application/json')) {
        const body = req.body as { fileUrl?: string; fileType?: string; mode?: string; numItems?: number }
        if (!body.fileUrl || !body.fileType) { res.status(400).json({ error: 'fileUrl and fileType are required.' }); return }
        const response = await axios.get(body.fileUrl, { responseType: 'arraybuffer', timeout: 30000 })
        fileBuffer = Buffer.from(response.data)
        fileType = body.fileType
        mode = (body.mode as 'quiz' | 'flashcard') ?? 'quiz'
        numItems = body.numItems ?? 10
      } else {
        res.status(400).json({ error: 'Unsupported content type.' }); return
      }

      if (!fileBuffer) { res.status(400).json({ error: 'No file received.' }); return }

      const rawText = await extractText(fileBuffer, fileType)
      if (!rawText || rawText.trim().length < 50) {
        res.status(400).json({ error: 'Could not extract enough text from the file.' }); return
      }

      const textSample = rawText.slice(0, 4000)
      let prompt = ''

      if (mode === 'quiz') {
        prompt = `Create exactly ${numItems} multiple choice questions based on the text below.

STRICT RULES:
- Each question must have exactly 4 options (A, B, C, D)
- All 4 options must be MEANINGFULLY DIFFERENT from each other
- Do NOT create options that say the same thing in a different order or with minor word swaps
- Each wrong option must be clearly distinct and plausible but incorrect
- Only ONE option can be correct
- You MUST include the "Correct:" line after EVERY question — do NOT skip it
- Do NOT add any introduction, closing remarks, or explanations

FORMAT (copy this pattern exactly for every question):
Question 1: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: A

Question 2: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: C

TEXT:
${textSample}`
      } else {
        prompt = `Create exactly ${numItems} flashcards based on the text below.

STRICT RULES:
- DO NOT add introductions or summaries
- DO NOT say 'Here are the flashcards'
- Each term must be unique — do NOT repeat or rephrase the same concept twice
- The definition must be clearly different from the term
- Use ONLY the format below
- One blank line between cards

FORMAT (STRICT):
Card 1 Front: [short term or concept]
Card 1 Back: [clear and concise definition]

Card 2 Front: ...
Card 2 Back: ...

TEXT:
${textSample}`
      }

      const { text: aiResponse, usage, remainingTokens } = await callGroq(prompt, apiKey)
      console.log(`[Token Usage] prompt: ${usage.prompt_tokens} | completion: ${usage.completion_tokens} | total: ${usage.total_tokens}`)
      console.log(`[Remaining Tokens] ${remainingTokens}`)
      console.log('[Raw AI Response]', aiResponse)

      const items = mode === 'quiz' ? parseQuiz(aiResponse) : parseFlashcards(aiResponse)
      console.log(`[Parsed Items Count] ${items.length}`)

      res.status(200).json({ mode, items, usage })

    } catch (err: unknown) {
      console.error('generateStudyMaterial error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ error: message })
    }
  }
)

function parseMultipart(req: any): Promise<{ fileBuffer: Buffer; fileType: string; mode: 'quiz' | 'flashcard'; numItems: number }> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers })
    let fileType = ''
    let mode: 'quiz' | 'flashcard' = 'quiz'
    let numItems = 10
    const chunks: Buffer[] = []

    bb.on('file', (_field: string, stream: NodeJS.ReadableStream, info: { filename: string }) => {
      fileType = info.filename.split('.').pop()?.toLowerCase() ?? ''
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    })

    bb.on('field', (name: string, value: string) => {
      if (name === 'mode' && (value === 'quiz' || value === 'flashcard')) mode = value
      if (name === 'numItems') { const n = parseInt(value, 10); if (!isNaN(n)) numItems = n }
    })

    bb.on('finish', () => {
      if (chunks.length === 0) return reject(new Error('No file found in request'))
      resolve({ fileBuffer: Buffer.concat(chunks), fileType, mode, numItems })
    })

    bb.on('error', reject)

    if (Buffer.isBuffer(req.rawBody)) {
      const { Readable } = require('stream')
      Readable.from(req.rawBody).pipe(bb)
    } else {
      req.pipe(bb)
    }
  })
}

export { deleteCloudinaryAsset } from './deleteCloudinaryAsset'