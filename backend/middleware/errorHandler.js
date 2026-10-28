export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'

  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err)
  }

  res.status(statusCode).json({
    status: 'error',
    message
  })
}
