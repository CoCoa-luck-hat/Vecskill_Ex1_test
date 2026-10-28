import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import LoginView from '../views/LoginView.vue'
import RepairsView from '../views/RepairsView.vue'
import UsersView from '../views/UsersView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    name: 'repairs',
    component: RepairsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: UsersView,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Route Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.initAuth()

  // 1. If route requires login and user is not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 2. If route is guest-only and user is already logged in
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'repairs' })
  }

  // 3. If route requires specific roles
  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    return next({ name: 'repairs' })
  }

  next()
})

export default router
