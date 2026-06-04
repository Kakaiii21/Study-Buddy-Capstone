// v2
import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import Busboy from 'busboy'
import axios from 'axios'
import { extractText } from './extractText'
import { callGroq } from './groqClient'
import { parseQuiz, parseFlashcards } from './parsers'

if (!admin.apps.length) admin.initializeApp()

function setCors(res: any) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

function estimateMaxItems(text: string, mode: 'quiz' | 'flashcard'): number {
  const wordCount = text.trim().split(/\s+/).length
  const wordsPerItem = mode === 'quiz' ? 80 : 40
  return Math.max(10, Math.floor(wordCount / wordsPerItem))
}

// ── EMAIL HELPER ─────────────────────────────────────────────────────────────
function emailTemplate(content: string) {
  return `
    <body style="font-family:sans-serif; color:#333; margin:0; padding:30px; background-color:#EFF3FB;">
      <div style="max-width:600px; margin:auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:0.5px solid #c8d8ec;">
        <div style="background-color:#ffffff; padding:24px 30px; text-align:center; border-bottom:3px solid #195791;">
          <img src="https://studybuddyph.site/logo.png" alt="Study Buddy" style="width:160px;" />
        </div>
        <div style="padding:28px 32px;">
          ${content}
          <hr style="border:none; border-top:1px solid #EFF3FB; margin:28px 0;" />
          <div style="background-color:#EFF3FB; border-left:4px solid #195791; border-radius:0 4px 4px 0; padding:11px 14px; margin-bottom:18px;">
            <p style="font-size:12px; color:#555; margin:0;">🔒 If you didn't request this, you can safely ignore this email. Your account will remain unchanged.</p>
          </div>
          <p style="font-size:12px; color:#999; margin-top:20px;">
            Need help? <a href="mailto:support@studybuddyph.site" style="color:#195791;">support@studybuddyph.site</a>
          </p>
        </div>
        <div style="background-color:#EFF3FB; text-align:center; padding:18px 30px;">
          <p style="font-size:13px; color:#195791; font-weight:500; margin:0 0 3px;">Study Buddy</p>
          <p style="font-size:11px; color:#999; margin:0;">Supporting your learning journey · <a href="https://studybuddyph.site" style="color:#195791;">studybuddyph.site</a></p>
        </div>
      </div>
    </body>
  `
}

function actionButton(link: string, label: string) {
  return `
    <div style="text-align:center; margin:32px 0;">
      <a href="${link}" style="background:linear-gradient(135deg,#195791,#2e7fc1); color:#ffffff; padding:13px 32px; text-decoration:none; border-radius:8px; display:inline-block; font-weight:bold; font-size:15px;">
        ${label}
      </a>
    </div>
    <p style="font-size:12px; color:#888;">If the button doesn't work, copy and paste this link:</p>
    <p style="font-size:11px; word-break:break-all;">
      <a href="${link}" style="color:#195791;">${link}</a>
    </p>
  `
}
// ─────────────────────────────────────────────────────────────────────────────

export const generateStudyMaterial = onRequest(
  {
    timeoutSeconds: 300,
    memory: '512MiB',
    secrets: ['GROQ_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  },
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
      const estimatedMax = estimateMaxItems(rawText, mode)
      if (numItems > estimatedMax) {
        res.status(400).json({
          error: `The file may not have enough content for ${numItems} ${mode === 'quiz' ? 'questions' : 'flashcards'}. Try ${estimatedMax} or fewer.`,
          suggested_max: estimatedMax,
        })
        return
      }
      const textSample = rawText.slice(0, 4000)

      // ── LANGUAGE DETECTION ────────────────────────────────────────────────
// After
      const sampleWords = textSample.toLowerCase()
      const tagalogMatches = (sampleWords.match(/\b(ang|mga|ay|ito|niya|hindi|kung|pero|kaya|dahil|siya|namin|tayo)\b/g) || []).length
      const hasTagalog = tagalogMatches >= 3
      const sourceLang = hasTagalog ? 'Filipino/Tagalog' : 'English'

      const languageInstruction = `CRITICAL LANGUAGE RULE:
        - The SOURCE TEXT is in ${sourceLang}.
        - You MUST write ALL generated content strictly in ${sourceLang} ONLY.
        - Keep ALL format keywords in English exactly as shown (Question 1:, A), B), C), D), Correct:, Card 1 Front:, Card 1 Back:, etc.)
        - Do NOT translate or switch to any other language under any circumstance.
        - Use ONLY the information provided in the SOURCE TEXT below. Do NOT use any external knowledge, assumptions, or information not found in the text.
        - If the text does not contain enough information for ${numItems} items, generate fewer items rather than making things up.`
      // ─────────────────────────────────────────────────────────────────────

      let prompt = ''
      if (mode === 'quiz') {
        prompt = `${languageInstruction}

Create exactly ${numItems} multiple choice questions based on the text below.

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

SOURCE TEXT (use ONLY this, nothing else):
${textSample}`
      } else {
        prompt = `${languageInstruction}

Create exactly ${numItems} flashcards based on the text below.

STRICT RULES:
- DO NOT add introductions or summaries
- DO NOT say 'Here are the flashcards'
- Each term must be unique — do NOT repeat or rephrase the same concept twice
- The definition must be clearly different from the term
- Write ALL definitions in the SAME LANGUAGE as the source text
- Use ONLY the format below
- One blank line between cards

FORMAT (STRICT):
Card 1 Front: [short term or concept]
Card 1 Back: [clear and concise definition]

Card 2 Front: ...
Card 2 Back: ...

SOURCE TEXT (use ONLY this, nothing else):
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

// ── SEND PASSWORD RESET ──────────────────────────────────────────────────────
export const sendPasswordReset = onRequest(
  { timeoutSeconds: 60, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }
    try {
      const { Resend } = await import('resend')
      const { email } = req.body as { email: string }
      if (!email) { res.status(400).json({ error: 'Email is required' }); return }
      const resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: 'https://studybuddyph.site/login',
      })
      const resend = new Resend(process.env.RESEND_API_KEY!)
      await resend.emails.send({
        from: 'Study Buddy <support@studybuddyph.site>',
        to: email,
        subject: 'Reset your Study Buddy password',
        html: emailTemplate(`
          <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            We received a request to reset the password for your <strong style="color:#195791;">Study Buddy</strong> account associated with <strong style="color:#195791;">${email}</strong>.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">Click the button below to reset your password. This link will expire shortly.</p>
          ${actionButton(resetLink, 'Reset Password')}
        `),
      })
      res.status(200).json({ success: true })
    } catch (err: unknown) {
      console.error('sendPasswordReset error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ error: message })
    }
  }
)

// ── SEND VERIFICATION EMAIL ──────────────────────────────────────────────────
export const sendVerificationEmail = onRequest(
  { timeoutSeconds: 60, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }
    try {
      const { Resend } = await import('resend')
      const { email } = req.body as { email: string }
      if (!email) { res.status(400).json({ error: 'Email is required' }); return }
      const verifyLink = await admin.auth().generateEmailVerificationLink(email, {
        url: 'https://studybuddyph.site/login',
      })
      const resend = new Resend(process.env.RESEND_API_KEY!)
      await resend.emails.send({
        from: 'Study Buddy <support@studybuddyph.site>',
        to: email,
        subject: 'Verify your Study Buddy email',
        html: emailTemplate(`
          <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            Thanks for signing up for <strong style="color:#195791;">Study Buddy</strong>! Please verify your email address <strong style="color:#195791;">${email}</strong> to get started.
          </p>
          ${actionButton(verifyLink, 'Verify Email')}
        `),
      })
      res.status(200).json({ success: true })
    } catch (err: unknown) {
      console.error('sendVerificationEmail error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ error: message })
    }
  }
)

// ── SEND CHANGE EMAIL ────────────────────────────────────────────────────────
export const sendChangeEmail = onRequest(
  { timeoutSeconds: 60, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') { res.status(204).send(''); return }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }
    try {
      const { Resend } = await import('resend')
      const { uid, newEmail } = req.body as { uid: string; newEmail: string }
      if (!uid || !newEmail) { res.status(400).json({ error: 'uid and newEmail are required' }); return }

      // ✅ Get current user to retrieve their email
      const userRecord = await admin.auth().getUser(uid)
      if (!userRecord.email) { res.status(400).json({ error: 'User has no email' }); return }

      const verifyLink = await admin.auth().generateVerifyAndChangeEmailLink(userRecord.email, newEmail, {
        url: 'https://studybuddyph.site/login',
      })

      const resend = new Resend(process.env.RESEND_API_KEY!)
      await resend.emails.send({
        from: 'Study Buddy <support@studybuddyph.site>',
        to: newEmail,
        subject: 'Verify your new Study Buddy email',
        html: emailTemplate(`
          <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            We received a request to update the email address on your <strong style="color:#195791;">Study Buddy</strong> account to <strong style="color:#195791;">${newEmail}</strong>.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">Click the button below to verify your new email address.</p>
          ${actionButton(verifyLink, 'Verify New Email')}
        `),
      })
      res.status(200).json({ success: true })
    } catch (err: unknown) {
      console.error('sendChangeEmail error:', err)
      const error = err as { code?: string; message?: string }
      // Pass through the original Firebase error code so the frontend can handle it
      res.status(500).json({ 
        error: error.message || 'Internal server error',
        code: error.code || 'auth/unknown'
      })
    }
  }
)

export { deleteCloudinaryAsset } from './deleteCloudinaryAsset'