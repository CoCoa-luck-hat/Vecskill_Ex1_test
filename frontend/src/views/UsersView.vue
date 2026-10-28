<template>
  <div>
    <!-- หัวข้อและปุ่มเพิ่มผู้ใช้ -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <div>
        <h1 class="text-h5 font-weight-bold">จัดการผู้ใช้งานในระบบ</h1>
        <p class="text-body-2 text-medium-emphasis">กำหนดสิทธิ์และจัดการบัญชีผู้ใช้งาน (ผู้แจ้ง, ช่าง, ผู้ดูแลระบบ)</p>
      </div>
      <v-btn
        :color="authStore.roleTheme.primary"
        prepend-icon="mdi-account-plus"
        class="font-weight-bold"
        @click="openCreateDialog"
      >
        เพิ่มผู้ใช้งานใหม่
      </v-btn>
    </div>

    <!-- กล่องค้นหาและกรองตามบทบาท -->
    <v-card class="pa-3 mb-4 rounded-lg elevation-1">
      <v-row density="compact" align="center">
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="search"
            label="ค้นหา (ชื่อผู้ใช้, ชื่อ-นามสกุล, เบอร์โทร)"
            prepend-inner-icon="mdi-magnify"
            hide-details
            density="compact"
            variant="outlined"
            @update:model-value="loadUsers"
          ></v-text-field>
        </v-col>
        <v-col cols="8" sm="4">
          <v-select
            v-model="roleFilter"
            :items="roleFilterOptions"
            label="กรองตามบทบาท"
            hide-details
            density="compact"
            variant="outlined"
            @update:model-value="loadUsers"
          ></v-select>
        </v-col>
        <v-col cols="4" sm="2">
          <v-btn block variant="tonal" color="primary" prepend-icon="mdi-refresh" @click="loadUsers">
            รีเฟรช
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- ตารางรายชื่อผู้ใช้งาน -->
    <v-card rounded="lg" elevation="1" class="overflow-hidden">
      <v-table hover>
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-bold">ชื่อผู้ใช้ (Username)</th>
            <th class="font-weight-bold">ชื่อ - นามสกุล</th>
            <th class="font-weight-bold">เบอร์โทรศัพท์</th>
            <th class="font-weight-bold text-center">บทบาท (Role)</th>
            <th class="font-weight-bold text-center" style="width: 140px;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center pa-6">กำลังโหลดข้อมูล...</td>
          </tr>
          <tr v-else-if="users.length === 0">
            <td colspan="5" class="text-center pa-6 text-medium-emphasis">ไม่พบข้อมูลผู้ใช้งาน</td>
          </tr>
          <tr v-for="user in users" :key="user.id">
            <td class="font-weight-bold text-primary">{{ user.username }}</td>
            <td class="font-weight-medium">{{ user.fullname }}</td>
            <td>{{ user.phone || '-' }}</td>
            <td class="text-center">
              <v-chip size="small" :color="roleBadge(user.role).color" variant="flat">
                <v-icon :icon="roleBadge(user.role).icon" start size="14"></v-icon>
                {{ roleBadge(user.role).label }}
              </v-chip>
            </td>
            <td class="text-center">
              <!-- แก้ไข -->
              <v-btn icon="mdi-pencil" size="small" variant="text" color="warning" title="แก้ไข" @click="openEditDialog(user)"></v-btn>

              <!-- ลบ (ป้องกันไม่ให้ลบตัวเอง) -->
              <v-btn
                v-if="user.id !== authStore.user?.id"
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                title="ลบ"
                @click="openDeleteDialog(user)"
              ></v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Modal 1: สร้าง / แก้ไขผู้ใช้ (User Form Dialog) -->
    <v-dialog v-model="formDialog" max-width="500" persistent>
      <v-card class="rounded-xl pa-2">
        <v-card-title class="font-weight-bold d-flex align-center ga-2">
          <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" color="primary"></v-icon>
          {{ isEditing ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitForm" class="d-flex flex-column ga-3">
            <v-text-field
              v-model="form.username"
              label="ชื่อผู้ใช้ (Username) *"
              variant="outlined"
              density="comfortable"
              :disabled="isEditing"
              required
            ></v-text-field>

            <v-text-field
              v-model="form.fullname"
              label="ชื่อ - นามสกุล *"
              variant="outlined"
              density="comfortable"
              required
            ></v-text-field>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="อีเมล"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="เบอร์โทรศัพท์"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-select
              v-model="form.role"
              :items="roleOptions"
              label="บทบาทในระบบ *"
              variant="outlined"
              density="comfortable"
              required
            ></v-select>

            <v-text-field
              v-model="form.password"
              :label="isEditing ? 'รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน (Password) *'"
              type="password"
              variant="outlined"
              density="comfortable"
              :required="!isEditing"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="plain" @click="formDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitForm">
            {{ isEditing ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal 2: ยืนยันการลบผู้ใช้ (Delete Dialog) -->
    <v-dialog v-model="deleteDialog" max-width="450">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="font-weight-bold d-flex align-center ga-2 text-error">
          <v-icon icon="mdi-alert-circle" color="error"></v-icon>
          ยืนยันการลบผู้ใช้งาน
        </v-card-title>
        <v-card-text>
          คุณต้องการลบบัญชีผู้ใช้ <b>{{ selectedUser?.fullname }}</b> ({{ selectedUser?.username }}) ใช่หรือไม่?
        </v-card-text>
        <v-card-actions class="pa-3 justify-end">
          <v-btn variant="plain" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="flat" :loading="saving" @click="submitDelete">
            ลบผู้ใช้งาน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useAlertStore } from '../stores/alert.js'
import api from '../services/api.js'

const authStore = useAuthStore()
const alertStore = useAlertStore()

// State
const users = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const roleFilter = ref('all')

// Dialogs
const formDialog = ref(false)
const deleteDialog = ref(false)
const isEditing = ref(false)
const selectedUser = ref(null)

const form = ref({
  username: '',
  fullname: '',
  email: '',
  phone: '',
  role: 'user',
  password: ''
})

const roleOptions = [
  { title: 'ผู้ใช้งานทั่วไป (User)', value: 'user' },
  { title: 'ช่างซ่อมบำรุง (Technician)', value: 'technician' },
  { title: 'ผู้ดูแลระบบ (Admin)', value: 'admin' }
]

const roleFilterOptions = [
  { title: 'ทุกบทบาท', value: 'all' },
  { title: 'ผู้ดูแลระบบ (Admin)', value: 'admin' },
  { title: 'ช่างซ่อม (Technician)', value: 'technician' },
  { title: 'ผู้ใช้งานทั่วไป (User)', value: 'user' }
]

const roleBadge = (role) => {
  const map = {
    admin: { label: 'ผู้ดูแลระบบ', color: 'deep-purple', icon: 'mdi-shield-crown' },
    technician: { label: 'ช่างซ่อม', color: 'orange', icon: 'mdi-wrench' },
    user: { label: 'ผู้ใช้งาน', color: 'blue', icon: 'mdi-account' }
  }
  return map[role] || { label: role, color: 'grey', icon: 'mdi-help' }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await api.get('/users', {
      params: { search: search.value, role: roleFilter.value }
    })
    users.value = res.data || []
  } catch (err) {
    alertStore.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  isEditing.value = false
  form.value = {
    username: '',
    fullname: '',
    email: '',
    phone: '',
    role: 'user',
    password: ''
  }
  formDialog.value = true
}

const openEditDialog = (user) => {
  isEditing.value = true
  selectedUser.value = user
  form.value = {
    username: user.username,
    fullname: user.fullname,
    email: user.email || '',
    phone: user.phone || '',
    role: user.role,
    password: ''
  }
  formDialog.value = true
}

const openDeleteDialog = (user) => {
  selectedUser.value = user
  deleteDialog.value = true
}

const submitForm = async () => {
  if (!form.value.username || !form.value.fullname) {
    alertStore.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }
  if (!isEditing.value && !form.value.password) {
    alertStore.error('กรุณากำหนดรหัสผ่าน')
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await api.put(`/users/${selectedUser.value.id}`, form.value)
      alertStore.success('แก้ไขข้อมูลผู้ใช้สำเร็จ')
    } else {
      await api.post('/users', form.value)
      alertStore.success('เพิ่มผู้ใช้งานใหม่เรียบร้อยแล้ว')
    }
    formDialog.value = false
    await loadUsers()
  } catch (err) {
    alertStore.error(err.message || 'บันทึกข้อมูลไม่สำเร็จ')
  } finally {
    saving.value = false
  }
}

const submitDelete = async () => {
  saving.value = true
  try {
    await api.delete(`/users/${selectedUser.value.id}`)
    alertStore.success('ลบผู้ใช้งานเรียบร้อยแล้ว')
    deleteDialog.value = false
    await loadUsers()
  } catch (err) {
    alertStore.error(err.message || 'ไม่สามารถลบผู้ใช้ได้')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>
