import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.resolve(__dirname, '../uploads')

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF) เท่านั้น'), false)
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
})

export const deleteUploadedFile = async (filePath) => {
  try {
    if (!filePath) return
    const filename = path.basename(filePath)
    const fullPath = path.join(uploadDir, filename)
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath)
    }
  } catch (err) {
    console.error('Error deleting file:', err.message)
  }
}
