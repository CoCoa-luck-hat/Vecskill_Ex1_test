// ==============================================================================
// มิดเดิลแวร์สำหรับตรวจสอบความถูกต้องของข้อมูลนำเข้า (Data Validation Middleware)
// หน้าที่: ตรวจสอบความถูกต้องของข้อมูล (Input Validation) ก่อนส่งต่อไปทำงานใน Controller
//         โดยใช้ express-validator เพื่อป้องกันข้อมูลผิดรูปแบบและการโจมตีเบื้องต้น
// ==============================================================================

import { body, validationResult } from 'express-validator'

// ------------------------------------------------------------------------------
// ตัวประมวลผลข้อผิดพลาดจาก Validation (Validation Error Processor)
// ------------------------------------------------------------------------------
// หาก express-validator พบข้อผิดพลาด ฟังก์ชันนี้จะดักส่ง HTTP 400 Bad Request
// พร้อมข้อความแจ้งเตือนแรกสุด (firstError.msg) ให้ผู้ใช้ทราบทันที
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0]
    return res.status(400).json({
      status: 'error',
      message: firstError.msg,
      errors: errors.array()
    })
  }
  // ข้อมูลถูกต้องครบถ้วน ให้ผ่านไปยัง Middleware หรือ Route ถัดไป
  next()
}

// ------------------------------------------------------------------------------
// 1. กฎการตรวจสอบสำหรับการเข้าสู่ระบบและลงทะเบียน (Authentication Validators)
// ------------------------------------------------------------------------------

// ตรวจสอบข้อมูลก่อนเข้าสู่ระบบ (Login)
export const validateLogin = [
  body('username').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้ (Username)'),
  body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน (Password)'),
  handleValidationErrors
]

// ตรวจสอบข้อมูลก่อนลงทะเบียนบัญชีใหม่ (Register)
export const validateRegister = [
  body('username').trim().isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
  body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  body('fullname').trim().notEmpty().withMessage('กรุณากรอกชื่อ - นามสกุล'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('phone').optional().trim(),
  handleValidationErrors
]

// ------------------------------------------------------------------------------
// 2. กฎการตรวจสอบสำหรับการจัดการผู้ใช้งานของผู้ดูแลระบบ (User Management Validators)
// ------------------------------------------------------------------------------

// ตรวจสอบข้อมูลตอนแอดมินสร้างผู้ใช้ใหม่
export const validateCreateUser = [
  body('username').trim().isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
  body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  body('fullname').trim().notEmpty().withMessage('กรุณากรอกชื่อ - นามสกุล'),
  body('role').isIn(['user', 'technician', 'admin']).withMessage('บทบาทต้องเป็น user, technician หรือ admin เท่านั้น'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('phone').optional().trim(),
  handleValidationErrors
]

// ตรวจสอบข้อมูลตอนแอดมินแก้ไขข้อมูลผู้ใช้ (รหัสผ่านเป็นทางเลือก ถ้าไม่กรอกคือไม่เปลี่ยน)
export const validateUpdateUser = [
  body('fullname').trim().notEmpty().withMessage('กรุณากรอกชื่อ - นามสกุล'),
  body('role').isIn(['user', 'technician', 'admin']).withMessage('บทบาทต้องเป็น user, technician หรือ admin เท่านั้น'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('phone').optional().trim(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  handleValidationErrors
]

// ------------------------------------------------------------------------------
// 3. กฎการตรวจสอบสำหรับคำขอแจ้งซ่อม (Repair Request Validators)
// ------------------------------------------------------------------------------

// ตรวจสอบข้อมูลตอนสร้างคำขอแจ้งซ่อมใหม่ (ชื่ออุปกรณ์จำเป็นต้องระบุ)
export const validateCreateRepair = [
  body('equipment_name').trim().notEmpty().withMessage('กรุณากรอกชื่ออุปกรณ์ / หมายเลขครุภัณฑ์'),
  body('description').optional().trim(),
  handleValidationErrors
]

// ตรวจสอบข้อมูลตอนแก้ไขคำขอแจ้งซ่อมเดิม
export const validateUpdateRepair = [
  body('equipment_name').optional().trim().notEmpty().withMessage('ชื่ออุปกรณ์ต้องไม่เป็นค่าว่างเปล่า'),
  handleValidationErrors
]
