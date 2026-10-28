// ==============================================================================
// มิดเดิลแวร์สำหรับจัดการอัปโหลดไฟล์รูปภาพ (Multer File Upload Middleware)
// หน้าที่:
//   1. upload: รับไฟล์รูปภาพก่อนซ่อม/หลังซ่อม บันทึกลงโฟลเดอร์ uploads/ พร้อมตั้งชื่อไม่ให้ซ้ำ
//   2. deleteUploadedFile: ฟังก์ชันช่วยลบไฟล์รูปภาพออกจากดิสก์เมื่อมีการลบงานซ่อมหรือแก้ไขรูป
// ==============================================================================

import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// กำหนดโฟลเดอร์ปลายทางสำหรับเก็บไฟล์รูปภาพที่อัปโหลด (backend/uploads)
const uploadDir = path.resolve(__dirname, '../uploads')

// ตรวจสอบว่าโฟลเดอร์ uploads มีอยู่จริงหรือไม่ หากยังไม่มีให้สร้างขึ้นมาทันที
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// ------------------------------------------------------------------------------
// การตั้งค่าการจัดเก็บไฟล์ลงดิสก์ (Disk Storage Configuration)
// ------------------------------------------------------------------------------
const storage = multer.diskStorage({
  // โฟลเดอร์ปลายทางที่จะเก็บไฟล์
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  // กำหนดชื่อไฟล์ใหม่: ใช้ Timestamp ร่วมกับสุ่มตัวเลข เพื่อป้องกันชื่อไฟล์ซ้ำกันและทับไฟล์เดิม
  // ตัวอย่างผลลัพธ์: 1729000000000-847291024.jpg
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${uniqueSuffix}${ext}`)
  }
})

// ------------------------------------------------------------------------------
// ตัวกรองชนิดไฟล์ (File Filter)
// ------------------------------------------------------------------------------
// ป้องกันการอัปโหลดไฟล์อันตราย (เช่น .exe, .sh, .js) โดยอนุญาตเฉพาะไฟล์รูปภาพมาตรฐาน
const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF) เท่านั้น'), false)
  }
}

// สร้างอินสแตนซ์ Multer พร้อมจำกัดขนาดไฟล์ไม่เกิน 5 Megabytes (MB)
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
})

// ------------------------------------------------------------------------------
// ฟังก์ชันช่วยลบไฟล์รูปภาพออกจากดิสก์ (Helper Function)
// ------------------------------------------------------------------------------
export const deleteUploadedFile = async (filePath) => {
  try {
    if (!filePath) return
    // สกัดเอาเฉพาะชื่อไฟล์ เช่น จาก '/uploads/xxx.jpg' ดึงได้ 'xxx.jpg'
    const filename = path.basename(filePath)
    const fullPath = path.join(uploadDir, filename)
    // ตรวจสอบว่าไฟล์มีอยู่จริงบนดิสก์หรือไม่ก่อนสั่งลบ
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath)
    }
  } catch (err) {
    console.error('❌ ไม่สามารถลบไฟล์รูปภาพได้:', err.message)
  }
}
