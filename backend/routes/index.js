import express from 'express'
import authRouter from './auth.js'
import dashboardRouter from './dashboard.js'
import repairsRouter from './repairs.js'
import usersRouter from './users.js'

const apiRouter = express.Router()

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  })
})

// Sub-routers
apiRouter.use('/auth', authRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/repairs', repairsRouter)
apiRouter.use('/users', usersRouter)

export default apiRouter
