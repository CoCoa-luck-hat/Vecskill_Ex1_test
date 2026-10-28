import { body, validationResult } from 'express-validator'

// Global Error Handler Middleware for express-validator
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
  next()
}

// ==========================================
// 1. Authentication Validators
// ==========================================
export const validateLogin = [
  body('username').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้ (Username)'),
  body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน (Password)'),
  handleValidationErrors
]

export const validateRegister = [
  body('username').trim().isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
  body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  body('fullname').trim().notEmpty().withMessage('กรุณากรอกชื่อ - นามสกุล'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('phone').optional().trim(),
  handleValidationErrors
]

// ==========================================
// 2. User Management Validators (Admin)
// ==========================================
export const validateCreateUser = [
  body('username').trim().isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
  body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  body('fullname').trim().notEmpty().withMessage('กรุณากรอกชื่อ - นามสกุล'),
  body('role').isIn(['user', 'technician', 'admin']).withMessage('บทบาทต้องเป็น user, technician หรือ admin'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('phone').optional().trim(),
  handleValidationErrors
]

export const validateUpdateUser = [
  body('fullname').trim().notEmpty().withMessage('กรุณากรอกชื่อ - นามสกุล'),
  body('role').isIn(['user', 'technician', 'admin']).withMessage('บทบาทต้องเป็น user, technician หรือ admin'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
  body('phone').optional().trim(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  handleValidationErrors
]

// ==========================================
// 3. Repair Request Validators
// ==========================================
export const validateCreateRepair = [
  body('equipment_name').trim().notEmpty().withMessage('กรุณากรอกชื่ออุปกรณ์'),
  body('description').optional().trim(),
  handleValidationErrors
]

export const validateUpdateRepair = [
  body('equipment_name').optional().trim().notEmpty().withMessage('ชื่ออุปกรณ์ต้องไม่ว่างเปล่า'),
  handleValidationErrors
]
