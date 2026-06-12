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

function getTextSample(rawText: string): string {
  const words = rawText.trim().split(/\s+/)
  const start = Math.floor(words.length * 0.05) // skip first 5% (TOC/headers)
  return words.slice(start).join(' ').slice(0, 3000)
}

function shuffleQuizOptions(items: any[]): any[] {
  const letters = ['A', 'B', 'C', 'D']
  return items.map((item) => {
    const options = [item.a, item.b, item.c, item.d]
    const correctIndex = letters.indexOf(item.correct?.toUpperCase())
    if (correctIndex === -1) return item

    // Fisher-Yates shuffle
    const indices = [0, 1, 2, 3]
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }

    const shuffled = indices.map(i => options[i])
    const newCorrectLetter = letters[indices.indexOf(correctIndex)]

    return { ...item, a: shuffled[0], b: shuffled[1], c: shuffled[2], d: shuffled[3], correct: newCorrectLetter }
  })
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

      // ── SMARTER TEXT SAMPLING ─────────────────────────────────────────────
      const textSample = getTextSample(rawText)
      // ─────────────────────────────────────────────────────────────────────

      // ── LANGUAGE DETECTION ────────────────────────────────────────────────
      const sampleWords = textSample.toLowerCase()
      const tagalogMatches = (sampleWords.match(/\b(ang|mga|ay|ito|niya|hindi|kung|pero|kaya|dahil|siya|namin|tayo)\b/g) || []).length
      const hasTagalog = tagalogMatches >= 3
      const sourceLang = hasTagalog ? 'Filipino/Tagalog' : 'English'
      // ─────────────────────────────────────────────────────────────────────

      let prompt = ''
      if (mode === 'quiz') {
        prompt = `You are a quiz generator. Use ONLY the text below to create ${numItems} multiple choice questions.

RULES:
- Test understanding, not just memorization
- 4 options per question (A, B, C, D)
- Only ONE correct answer
- Wrong options must be related but clearly incorrect
- IMPORTANT: Spread correct answers across A, B, C, D evenly — do NOT put correct answer in A every time
- No repeated concepts
- ${sourceLang} only, keep format keywords in English
- Do NOT add any intro, outro, or explanations

FORMAT — follow exactly:
Question 1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: B

Question 2: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: D

TEXT:
${textSample}`

      } else {
        prompt = `You are a flashcard generator. Use ONLY the text below to create ${numItems} flashcards.

RULES:
- Each card must cover a unique concept — no repeats
- Front: short term or question (max 10 words)
- Back: clear concise definition or answer (1-2 sentences)
- ${sourceLang} only, keep format keywords in English
- Do NOT add any intro, outro, or explanations

FORMAT — follow exactly:
Card 1 Front: [term or question]
Card 1 Back: [definition or answer]

Card 2 Front: [term or question]
Card 2 Back: [definition or answer]

TEXT:
${textSample}`
      }

      const { text: aiResponse, usage, remainingTokens } = await callGroq(prompt, apiKey)
      console.log(`[Token Usage] prompt: ${usage.prompt_tokens} | completion: ${usage.completion_tokens} | total: ${usage.total_tokens}`)
      console.log(`[Remaining Tokens] ${remainingTokens}`)
      console.log('[Raw AI Response]', aiResponse)

      let items = mode === 'quiz' ? parseQuiz(aiResponse) : parseFlashcards(aiResponse)

      // ── SHUFFLE QUIZ OPTIONS to fix answer-always-A bias ──────────────────
      if (mode === 'quiz') items = shuffleQuizOptions(items)
      // ─────────────────────────────────────────────────────────────────────

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

      const userRecord = await admin.auth().getUser(uid)
      if (!userRecord.email) { res.status(400).json({ error: 'User has no email' }); return }

      // ✅ Check if newEmail is already taken by another account
      try {
        const existing = await admin.auth().getUserByEmail(newEmail)
        if (existing.uid !== uid) {
          res.status(400).json({ error: 'This email is already in use by another account.', code: 'auth/email-already-in-use' })
          return
        }
      } catch (e: any) {
        // getUserByEmail throws if not found — that's fine, means email is available
        if (e.code !== 'auth/user-not-found') throw e
      }

      // ✅ DO NOT call updateUser here — just store pendingEmail in Firestore
      await admin.firestore().doc(`users/${uid}`).update({ pendingEmail: newEmail })

      const crypto = await import('crypto')

      // ✅ Generate both tokens
      const verifyToken = crypto.randomBytes(32).toString('hex')
      const cancelToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = Date.now() + 1000 * 60 * 60 // 1 hour

      await admin.firestore().doc(`emailChangeTokens/${verifyToken}`).set({
        uid,
        newEmail,
        oldEmail: userRecord.email,
        cancelToken, // ✅ link them so confirmEmailChange can delete the cancel token too
        expiresAt,
      })

      await admin.firestore().doc(`emailCancelTokens/${cancelToken}`).set({
        uid,
        newEmail,
        oldEmail: userRecord.email,
        verifyToken, // ✅ link them so cancel can delete the verify token too
        expiresAt,
      })

      const verifyLink = `https://us-central1-study-buddy-cbaa8.cloudfunctions.net/confirmEmailChange?token=${verifyToken}`
      const cancelLink = `https://us-central1-study-buddy-cbaa8.cloudfunctions.net/cancelEmailChange?token=${cancelToken}`

      const resend = new Resend(process.env.RESEND_API_KEY!)

      // ✅ To new email — verify link
      await resend.emails.send({
        from: 'Study Buddy <support@studybuddyph.site>',
        to: newEmail,
        subject: 'Verify your new Study Buddy email',
        html: emailTemplate(`
          <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            We received a request to update the email address on your <strong style="color:#195791;">Study Buddy</strong> account to <strong style="color:#195791;">${newEmail}</strong>.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">Click the button below to verify your new email address. This link expires in 1 hour.</p>
          ${actionButton(verifyLink, 'Verify New Email')}
        `),
      })

      // ✅ To old email — cancel link (1 hour window before confirm)
      await resend.emails.send({
        from: 'Study Buddy <support@studybuddyph.site>',
        to: userRecord.email,
        subject: 'Your Study Buddy email address is being changed',
        html: emailTemplate(`
          <p style="font-size:16px; margin-bottom:8px;">Hello there! 👋</p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            A request was made to change the email on your <strong style="color:#195791;">Study Buddy</strong> account to <strong style="color:#195791;">${newEmail}</strong>.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            If this was you, no action is needed — just verify via the email sent to <strong>${newEmail}</strong>.
          </p>
          <p style="font-size:15px; line-height:1.6; color:#444;">
            If you did <strong>not</strong> request this, click below to cancel the change and keep your current email.
          </p>
          ${actionButton(cancelLink, 'Cancel Email Change')}
        `),
      })

      res.status(200).json({ success: true })
    } catch (err: unknown) {
      console.error('sendChangeEmail error:', err)
      const error = err as { code?: string; message?: string }
      res.status(500).json({
        error: error.message || 'Internal server error',
        code: error.code || 'auth/unknown'
      })
    }
  }
)

// ── CONFIRM CHANGE EMAIL ─────────────────────────────────────────────────────
export const confirmEmailChange = onRequest(
  { timeoutSeconds: 60, memory: '256MiB', secrets: ['RESEND_API_KEY'] },
  async (req, res) => {
    setCors(res)
    const { token } = req.query as { token: string }

    if (!token) {
      res.status(400).send('Missing token.')
      return
    }

    try {
      const tokenDoc = await admin.firestore().doc(`emailChangeTokens/${token}`).get()

      if (!tokenDoc.exists) {
        res.status(400).send('Invalid or already used verification link.')
        return
      }

      const { uid, newEmail, oldEmail, cancelToken, expiresAt } = tokenDoc.data()!

      if (Date.now() > expiresAt) {
        await tokenDoc.ref.delete()
        res.status(400).send('This verification link has expired. Please request a new one.')
        return
      }

      // ✅ NOW we update the email — only after user clicked the link
      await admin.auth().updateUser(uid, { email: newEmail, emailVerified: true })

      // ✅ Update Firestore user doc
      await admin.firestore().doc(`users/${uid}`).update({
        email: newEmail,
        pendingEmail: admin.firestore.FieldValue.delete(),
      })

      // ✅ Extend cancel token to 7 days as a recovery token (don't delete it yet)
      if (cancelToken) {
        await admin.firestore().doc(`emailCancelTokens/${cancelToken}`).update({
          expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
          confirmed: true, // flag so cancelEmailChange knows to revert the auth email too
        })
      }

      // ✅ Delete the used verify token
      await tokenDoc.ref.delete()

      // ✅ Notify old email that the change is now live, with a 7-day undo link
      if (oldEmail && cancelToken) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const cancelLink = `https://us-central1-study-buddy-cbaa8.cloudfunctions.net/cancelEmailChange?token=${cancelToken}`

        await resend.emails.send({
          from: 'Study Buddy <support@studybuddyph.site>',
          to: oldEmail,
          subject: 'Your Study Buddy email has been changed',
          html: emailTemplate(`
            <p style="font-size:16px; margin-bottom:8px;">Heads up! ⚠️</p>
            <p style="font-size:15px; line-height:1.6; color:#444;">
              The email on your <strong style="color:#195791;">Study Buddy</strong> account has been changed from <strong style="color:#195791;">${oldEmail}</strong> to <strong style="color:#195791;">${newEmail}</strong>.
            </p>
            <p style="font-size:15px; line-height:1.6; color:#444;">
              If this was you, no action is needed.
            </p>
            <p style="font-size:15px; line-height:1.6; color:#444;">
              If you did <strong>not</strong> do this, click below to revert to your original email immediately. This link is valid for <strong>7 days</strong>.
            </p>
            ${actionButton(cancelLink, 'Undo Email Change')}
          `),
        })
      }

      // ✅ Redirect to login with success message
      res.redirect('https://studybuddyph.site/login?emailUpdated=true')
    } catch (err) {
      console.error('confirmEmailChange error:', err)
      res.status(500).send('Something went wrong. Please try again.')
    }
  }
)

// ── CANCEL EMAIL CHANGE ──────────────────────────────────────────────────────
export const cancelEmailChange = onRequest(
  { timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    setCors(res)
    const { token } = req.query as { token: string }

    if (!token) {
      res.status(400).send('Missing token.')
      return
    }

    try {
      const cancelDoc = await admin.firestore().doc(`emailCancelTokens/${token}`).get()

      if (!cancelDoc.exists) {
        res.redirect('https://studybuddyph.site/login?cancelResult=already-used')
        return
      }

      const { uid, oldEmail, verifyToken, expiresAt, confirmed } = cancelDoc.data()!

      if (Date.now() > expiresAt) {
        await cancelDoc.ref.delete()
        res.redirect('https://studybuddyph.site/login?cancelResult=expired')
        return
      }

      if (confirmed) {
        // ✅ Change already went through — fully revert auth email back to oldEmail
        await admin.auth().updateUser(uid, {
          email: oldEmail,
          emailVerified: true,
        })

        await admin.firestore().doc(`users/${uid}`).update({
          email: oldEmail,
          pendingEmail: admin.firestore.FieldValue.delete(),
        })
      } else {
        // ✅ Change not yet confirmed — just clear pendingEmail
        await admin.firestore().doc(`users/${uid}`).update({
          pendingEmail: admin.firestore.FieldValue.delete(),
        })

        // ✅ Delete the verify token so the new email link no longer works
        if (verifyToken) {
          await admin.firestore().doc(`emailChangeTokens/${verifyToken}`).delete()
        }
      }

      // ✅ Delete the cancel token — it's been used
      await cancelDoc.ref.delete()

      res.redirect('https://studybuddyph.site/login?cancelResult=success')
    } catch (err) {
      console.error('cancelEmailChange error:', err)
      res.status(500).send('Something went wrong. Please try again.')
    }
  }
)

export { deleteCloudinaryAsset } from './deleteCloudinaryAsset'