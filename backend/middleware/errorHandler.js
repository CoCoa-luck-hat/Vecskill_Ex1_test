// ==============================================================================
// มิดเดิลแวร์จัดการข้อผิดพลาดส่วนกลางของ Express (Centralized Error Handler)
// หน้าที่: รับ Error ทั้งหมดที่ถูกส่งต่อมาจาก next(err) ใน Route ต่างๆ
//         และตอบกลับเป็นรูปแบบ JSON มาตรฐาน ป้องกันเซิร์ฟเวอร์ค้างหรือหลุด
// ==============================================================================

export const errorHandler = (err, req, res, next) => {
  // ดึงรหัสสถานะ HTTP (หากไม่ได้ระบุไว้จะกำหนดให้เป็น 500 Internal Server Error)
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'

  // หากเป็นข้อผิดพลาดร้ายแรงฝั่งเซิร์ฟเวอร์ (500) ให้พิมพ์ Stack Trace ลง Console เพื่อใช้วิเคราะห์แก้ไข
  if (statusCode === 500) {
    console.error('❌ ข้อผิดพลาดร้ายแรงของเซิร์ฟเวอร์ (Server Error):', err)
  }

  // ตอบกลับข้อความข้อผิดพลาดในรูปแบบ JSON สม่ำเสมอทุกจุด
  res.status(statusCode).json({
    status: 'error',
    message
  })
}
