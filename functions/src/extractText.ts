import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase()

  // ── TXT ───────────────────────────────────────────────────────────────────
  if (ext === 'txt') {
    return buffer.toString('utf-8')
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (ext === 'pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
    const data = await pdfParse(buffer)
    return data.text
  }

  // ── DOCX / DOC ────────────────────────────────────────────────────────────
  if (ext === 'docx' || ext === 'doc') {
    const mammoth = require('mammoth') as {
      extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>
    }
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // ── PPTX / PPT ────────────────────────────────────────────────────────────
  if (ext === 'pptx' || ext === 'ppt') {
    const officeParser = require('officeparser') as {
      parseOffice: (filePath: string, cb: (text: string, err: Error) => void) => void
    }
    const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`)
    fs.writeFileSync(tmpPath, buffer)

    return new Promise((resolve, reject) => {
      officeParser.parseOffice(tmpPath, (text: string, err: Error) => {
        try { fs.unlinkSync(tmpPath) } catch (_) { /* ignore */ }
        if (err) return reject(err)
        resolve(text)
      })
    })
  }

  throw new Error(`Unsupported file type: ${ext}`)
}