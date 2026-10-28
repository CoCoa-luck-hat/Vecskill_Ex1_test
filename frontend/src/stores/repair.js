import { defineStore } from 'pinia'
import api from '../services/api.js'

export const useRepairStore = defineStore('repair', {
  state: () => ({
    repairs: [],
    stats: {
      total: 0,
      pending: 0,
      in_progress: 0,
      waiting_parts: 0,
      completed: 0,
      cancelled: 0,
      unassigned: 0
    },
    technicians: [],
    loading: false
  }),

  actions: {
    async fetchRepairs(params = {}) {
      this.loading = true
      try {
        const res = await api.get('/repairs', { params })
        this.repairs = res.data || []
      } catch (err) {
        console.error('Fetch repairs error:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchStats() {
      try {
        const res = await api.get('/dashboard/stats')
        if (res.data) {
          this.stats = res.data
        }
      } catch (err) {
        console.error('Fetch stats error:', err)
      }
    },

    async fetchTechnicians() {
      try {
        const res = await api.get('/users', { params: { role: 'technician' } })
        this.technicians = res.data || []
      } catch (err) {
        console.error('Fetch technicians error:', err)
      }
    },

    async createRepair(formData) {
      return api.post('/repairs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    async updateRepair(id, formData) {
      return api.put(`/repairs/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    async updateStatus(id, formData) {
      return api.patch(`/repairs/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },

    async deleteRepair(id) {
      return api.delete(`/repairs/${id}`)
    }
  }
})
