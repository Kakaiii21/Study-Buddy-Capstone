import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import Busboy from 'busboy'
import axios from 'axios'
import { extractText } from './extractText'
import { callGroq } from './groqClient'
import { parseQuiz, parseFlashcards } from './parsers'

admin.initializeApp()

// ─── CORS helper ──────────────────────────────────────────────────────────────
function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

// ─── Main Cloud Function ───────────────────────────────────────────────────────
export const generateStudyMaterial = onRequest(
  { timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    setCors(res)

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    try {
      // ── Read Groq key from process.env (functions/.env) ──────────────────
      const apiKey = process.env.GROQ_API_KEY
      if (!apiKey) {
        res.status(500).json({ error: 'GROQ_API_KEY not set in functions/.env' })
        return
      }

      const contentType = req.headers['content-type'] || ''

      let fileBuffer: Buffer | null = null
      let fileType = ''
      let mode: 'quiz' | 'flashcard' = 'quiz'
      let numItems = 10

      // ── Case 1: multipart/form-data (local file upload) ───────────────────
      if (contentType.includes('multipart/form-data')) {
        const result = await parseMultipart(req)
        fileBuffer = result.fileBuffer
        fileType = result.fileType
        mode = result.mode
        numItems = result.numItems
      }

      // ── Case 2: application/json (course file via URL) ────────────────────
      else if (contentType.includes('application/json')) {
        const body = req.body as {
          fileUrl?: string
          fileType?: string
          mode?: string
          numItems?: number
        }

        if (!body.fileUrl || !body.fileType) {
          res.status(400).json({ error: 'fileUrl and fileType are required.' })
          return
        }

        const response = await axios.get(body.fileUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        })
        fileBuffer = Buffer.from(response.data)
        fileType = body.fileType
        mode = (body.mode as 'quiz' | 'flashcard') ?? 'quiz'
        numItems = body.numItems ?? 10
      } else {
        res.status(400).json({ error: 'Unsupported content type.' })
        return
      }

      // ── Extract text ───────────────────────────────────────────────────────
      if (!fileBuffer) {
        res.status(400).json({ error: 'No file received.' })
        return
      }

      const rawText = await extractText(fileBuffer, fileType)
      if (!rawText || rawText.trim().length < 50) {
        res.status(400).json({ error: 'Could not extract enough text from the file.' })
        return
      }

      const textSample = rawText.slice(0, 4000)

      // ── Build prompt ───────────────────────────────────────────────────────
      let prompt = ''

      if (mode === 'quiz') {
        prompt = `Create exactly ${numItems} multiple choice questions based on this text.
For each question provide 4 options (A, B, C, D) and mark the correct answer.
DO NOT add any introduction or closing remarks.

FORMAT (strict):
Question 1: [question text]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: A

TEXT:
${textSample}`
      } else {
        prompt = `Create exactly ${numItems} flashcards based on the text below.

RULES:
- DO NOT add introductions or summaries
- DO NOT say 'Here are the flashcards'
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

      // ── Call Groq ──────────────────────────────────────────────────────────
      const aiResponse = await callGroq(prompt, apiKey)

      // ── Parse & respond ────────────────────────────────────────────────────
      if (mode === 'quiz') {
        const questions = parseQuiz(aiResponse)
        res.status(200).json({ mode: 'quiz', items: questions })
      } else {
        const flashcards = parseFlashcards(aiResponse)
        res.status(200).json({ mode: 'flashcard', items: flashcards })
      }
    } catch (err: unknown) {
      console.error('generateStudyMaterial error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ error: message })
    }
  }
)

// ─── Multipart parser ──────────────────────────────────────────────────────────
function parseMultipart(req: any): Promise<{
  fileBuffer: Buffer
  fileType: string
  mode: 'quiz' | 'flashcard'
  numItems: number
}> {
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
      if (name === 'numItems') {
        const n = parseInt(value, 10)
        if (!isNaN(n)) numItems = n
      }
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