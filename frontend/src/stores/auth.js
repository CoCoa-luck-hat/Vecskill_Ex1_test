import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api.js'

export const ROLE_THEMES = {
  admin: {
    primary: '#673AB7',
    bgTint: '#F3E8FF',
    roleLabel: 'ผู้ดูแลระบบ (Admin)',
    roleIcon: 'mdi-shield-crown',
    barGradient: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 100%)'
  },
  technician: {
    primary: '#F57C00',
    bgTint: '#FFF8E1',
    roleLabel: 'ช่างซ่อม (Technician)',
    roleIcon: 'mdi-wrench',
    barGradient: 'linear-gradient(135deg, #E65100 0%, #FB8C00 100%)'
  },
  user: {
    primary: '#1976D2',
    bgTint: '#E3F2FD',
    roleLabel: 'ผู้ใช้งานทั่วไป (User)',
    roleIcon: 'mdi-account',
    barGradient: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)'
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || null,
    user: localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')) : null,
    isLoading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isTechnician: (state) => state.user?.role === 'technician',
    isUser: (state) => state.user?.role === 'user',
    roleTheme: (state) => ROLE_THEMES[state.user?.role] || ROLE_THEMES.user
  },

  actions: {
    async initAuth() {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      try {
        const decoded = jwtDecode(token)
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          this.token = token
          this.user = {
            id: decoded.id,
            username: decoded.username,
            fullname: decoded.fullname,
            role: decoded.role,
            email: decoded.email
          }
          const res = await api.get('/auth/me').catch(() => null)
          if (res?.data?.user) {
            this.user = res.data.user
            localStorage.setItem('auth_user', JSON.stringify(this.user))
          }
        } else {
          this.logout()
        }
      } catch {
        this.logout()
      }
    },

    async login(credentials) {
      this.isLoading = true
      try {
        const res = await api.post('/auth/login', credentials)
        if (res.status === 'success' && res.data?.token) {
          this.token = res.data.token
          this.user = res.data.user
          localStorage.setItem('auth_token', res.data.token)
          localStorage.setItem('auth_user', JSON.stringify(res.data.user))
          return { success: true }
        }
        return { success: false, message: res.message || 'เข้าสู่ระบบไม่สำเร็จ' }
      } catch (err) {
        return { success: false, message: err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
      } finally {
        this.isLoading = false
      }
    },

    async register(userData) {
      this.isLoading = true
      try {
        const res = await api.post('/auth/register', userData)
        return { success: true, message: res.message }
      } catch (err) {
        return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' }
      } finally {
        this.isLoading = false
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }
})
