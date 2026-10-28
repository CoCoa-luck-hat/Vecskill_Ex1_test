import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initDb } from './database/initDb.js'
import apiRouter from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files for uploaded images
const uploadsPath = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsPath))
app.use('/api/uploads', express.static(uploadsPath))

// Mount API routes
app.use('/api', apiRouter)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  })
})

// Global Centralized Error Handler
app.use(errorHandler)

// Start server and initialize database
app.listen(PORT, async () => {
  console.log(`🚀 Ex2 Backend Server is running at http://localhost:${PORT}`)
  await initDb()
})
