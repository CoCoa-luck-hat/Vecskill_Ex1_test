<template>
  <div class="d-flex align-center justify-center min-vh-100 pa-4" style="min-height: 100vh; background: linear-gradient(135deg, #EEF2F6 0%, #E2E8F0 100%);">
    <v-card width="100%" max-width="480" class="elevation-4 rounded-xl pa-4 bg-surface">
      <div class="text-center py-4">
        <v-avatar color="primary" size="60" class="mb-3 elevation-2">
          <v-icon icon="mdi-wrench-check" size="34" color="white"></v-icon>
        </v-avatar>
        <h1 class="text-h5 font-weight-bold text-slate-800">ระบบแจ้งซ่อมอุปกรณ์</h1>
        <p class="text-body-2 text-medium-emphasis">Equipment Repair Request Management (Ex2)</p>
      </div>

      <v-tabs v-model="tab" color="primary" grow class="mb-4">
        <v-tab value="login" prepend-icon="mdi-login">เข้าสู่ระบบ</v-tab>
        <v-tab value="register" prepend-icon="mdi-account-plus">ลงทะเบียน</v-tab>
      </v-tabs>

      <v-alert v-if="errorMsg" type="error" variant="tonal" closable class="mb-3" @click:close="errorMsg = ''">
        {{ errorMsg }}
      </v-alert>
      <v-alert v-if="successMsg" type="success" variant="tonal" closable class="mb-3" @click:close="successMsg = ''">
        {{ successMsg }}
      </v-alert>

      <v-window v-model="tab">
        <v-window-item value="login">
          <v-form @submit.prevent="handleLogin" class="d-flex flex-column ga-3">
            <v-text-field
              v-model="loginForm.username"
              label="ชื่อผู้ใช้ (Username)"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
              required
            ></v-text-field>

            <v-text-field
              v-model="loginForm.password"
              label="รหัสผ่าน (Password)"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              density="comfortable"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              required
            ></v-text-field>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="authStore.isLoading"
              class="font-weight-bold mt-2"
            >
              เข้าสู่ระบบ
            </v-btn>

            <div class="mt-4 pt-3 border-t text-center">
              <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">
                คลิกทดสอบเข้าสู่ระบบตามบทบาท:
              </div>
              <div class="d-flex flex-wrap justify-center ga-2">
                <v-chip
                  v-for="u in QUICK_DEMO_USERS"
                  :key="u.username"
                  :color="u.color"
                  variant="tonal"
                  :prepend-icon="u.icon"
                  @click="quickLogin(u.username, u.password)"
                >
                  {{ u.label }}
                </v-chip>
              </div>
            </div>
          </v-form>
        </v-window-item>

        <v-window-item value="register">
          <v-form @submit.prevent="handleRegister" class="d-flex flex-column ga-3">
            <v-text-field
              v-model="regForm.fullname"
              label="ชื่อ - นามสกุล *"
              prepend-inner-icon="mdi-card-account-details"
              variant="outlined"
              density="comfortable"
              required
            ></v-text-field>

            <v-text-field
              v-model="regForm.username"
              label="ชื่อผู้ใช้ (Username) *"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
              required
            ></v-text-field>

            <v-text-field
              v-model="regForm.email"
              label="อีเมล"
              type="email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-text-field
              v-model="regForm.phone"
              label="เบอร์โทรศัพท์"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-text-field
              v-model="regForm.password"
              label="รหัสผ่าน *"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              density="comfortable"
              :type="showPassword ? 'text' : 'password'"
              required
            ></v-text-field>

            <v-btn
              type="submit"
              color="success"
              size="large"
              block
              :loading="authStore.isLoading"
              class="font-weight-bold mt-2"
            >
              สร้างบัญชีผู้ใช้ใหม่
            </v-btn>
          </v-form>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAlertStore } from '../stores/alert.js'

const QUICK_DEMO_USERS = [
  { username: 'admin', password: 'admin123', label: 'Admin (แอดมิน)', color: 'deep-purple', icon: 'mdi-shield-crown' },
  { username: 'tech1', password: 'tech123', label: 'Tech (ช่างซ่อม)', color: 'orange', icon: 'mdi-wrench' },
  { username: 'user1', password: 'user123', label: 'User (ผู้แจ้ง)', color: 'blue', icon: 'mdi-account' }
]

const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()

const tab = ref('login')
const showPassword = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const loginForm = ref({
  username: '',
  password: ''
})

const regForm = ref({
  fullname: '',
  username: '',
  email: '',
  phone: '',
  password: ''
})

const quickLogin = async (username, password) => {
  loginForm.value.username = username
  loginForm.value.password = password
  await handleLogin()
}

const handleLogin = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!loginForm.value.username || !loginForm.value.password) {
    errorMsg.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
    alertStore.warning('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'เข้าสู่ระบบ')
    return
  }

  const res = await authStore.login(loginForm.value)
  if (res.success) {
    alertStore.success('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ' + (authStore.user?.fullname || ''), 'เข้าสู่ระบบ')
    router.push('/')
  } else {
    errorMsg.value = res.message
    alertStore.error(res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'เข้าสู่ระบบไม่สำเร็จ')
  }
}

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!regForm.value.fullname || !regForm.value.username || !regForm.value.password) {
    errorMsg.value = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
    alertStore.warning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'ลงทะเบียน')
    return
  }

  const res = await authStore.register(regForm.value)
  if (res.success) {
    const msg = res.message || 'ลงทะเบียนสำเร็จ! เข้าสู่ระบบได้ทันที'
    successMsg.value = msg
    alertStore.success(msg, 'ลงทะเบียนสำเร็จ')
    loginForm.value.username = regForm.value.username
    loginForm.value.password = ''
    tab.value = 'login'
    regForm.value = { fullname: '', username: '', email: '', phone: '', password: '' }
  } else {
    errorMsg.value = res.message
    alertStore.error(res.message || 'เกิดข้อผิดพลาดในการลงทะเบียน', 'ลงทะเบียนไม่สำเร็จ')
  }
}
</script>
