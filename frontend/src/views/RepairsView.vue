<template>
  <div>
    <!-- Header & Action Button -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <div>
        <h1 class="text-h5 font-weight-bold">ระบบแจ้งซ่อมอุปกรณ์</h1>
        <p class="text-body-2 text-medium-emphasis">ติดตามและจัดการรายการแจ้งซ่อมทั้งหมด</p>
      </div>
      <v-btn
        v-if="authStore.isUser"
        :color="authStore.roleTheme.primary"
        prepend-icon="mdi-plus"
        class="font-weight-bold"
        @click="openCreateDialog"
      >
        แจ้งซ่อมอุปกรณ์ใหม่
      </v-btn>
    </div>

    <!-- 1. Stats Summary Cards -->
    <v-row class="mb-4" dense>
      <v-col cols="6" sm="4" md="2" v-for="card in statCards" :key="card.title">
        <v-card class="pa-3 rounded-lg elevation-1" :color="card.color" variant="tonal">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption font-weight-medium">{{ card.title }}</div>
              <div class="text-h5 font-weight-bold mt-1">{{ card.value }}</div>
            </div>
            <v-icon :icon="card.icon" size="32" class="opacity-60"></v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 2. Search & Filter Bar -->
    <v-card class="pa-3 mb-4 rounded-lg elevation-1">
      <v-row density="compact" align="center">
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="search"
            label="ค้นหา (รหัสใบแจ้ง, ชื่ออุปกรณ์)"
            prepend-inner-icon="mdi-magnify"
            hide-details
            density="compact"
            variant="outlined"
            @update:model-value="loadRepairs"
          ></v-text-field>
        </v-col>
        <v-col cols="8" sm="4">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="กรองตามสถานะ"
            hide-details
            density="compact"
            variant="outlined"
            @update:model-value="loadRepairs"
          ></v-select>
        </v-col>
        <v-col cols="4" sm="2">
          <v-btn block variant="tonal" color="primary" prepend-icon="mdi-refresh" @click="loadData">
            รีเฟรช
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- 3. Repairs Data Table -->
    <v-card rounded="lg" elevation="1" class="overflow-hidden">
      <v-table hover>
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-bold">รหัสใบแจ้ง</th>
            <th class="font-weight-bold">อุปกรณ์ / รูปภาพ</th>
            <th class="font-weight-bold">รายละเอียดอาการเสีย</th>
            <th class="font-weight-bold text-center">สถานะ</th>
            <th class="font-weight-bold">ผู้แจ้ง / ช่างซ่อม</th>
            <th class="font-weight-bold text-center" style="width: 170px;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="repairStore.loading">
            <td colspan="6" class="text-center pa-6">กำลังโหลดข้อมูล...</td>
          </tr>
          <tr v-else-if="repairStore.repairs.length === 0">
            <td colspan="6" class="text-center pa-6 text-medium-emphasis">ไม่พบรายการแจ้งซ่อม</td>
          </tr>
          <tr v-for="item in repairStore.repairs" :key="item.id">
            <td class="font-weight-bold text-primary">{{ item.ticket_no }}</td>
            <td>
              <div class="d-flex align-center ga-2">
                <v-avatar
                  v-if="item.before_image"
                  size="40"
                  rounded="lg"
                  class="border elevation-1 cursor-pointer"
                  @click="openDetailDialog(item)"
                >
                  <v-img :src="item.before_image" cover></v-img>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.equipment_name }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="text-truncate" style="max-width: 250px;">
                {{ item.description || item.title || '-' }}
              </div>
            </td>
            <td class="text-center">
              <v-chip size="small" :color="statusColor(item.status)" variant="flat">
                {{ statusLabel(item.status) }}
              </v-chip>
            </td>
            <td>
              <div class="text-body-2 font-weight-medium">{{ item.reporter_name }}</div>
              <div class="text-caption text-medium-emphasis">
                ช่าง: {{ item.technician_name || 'ยังไม่มีช่างรับงาน' }}
              </div>
            </td>
            <td class="text-center">
              <!-- ดูรายละเอียด -->
              <v-btn icon="mdi-eye" size="small" variant="text" color="primary" title="ดูรายละเอียด" @click="openDetailDialog(item)"></v-btn>

              <!-- แก้ไข (เจ้าของเมื่อ pending หรือ Admin) -->
              <v-btn
                v-if="canEdit(item)"
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="warning"
                title="แก้ไข"
                @click="openEditDialog(item)"
              ></v-btn>

              <!-- ช่าง หรือ แอดมิน เปลี่ยนสถานะ -->
              <v-btn
                v-if="authStore.isTechnician || authStore.isAdmin"
                icon="mdi-wrench"
                size="small"
                variant="text"
                color="info"
                title="อัปเดตงานช่าง"
                @click="openStatusDialog(item)"
              ></v-btn>

              <!-- ลบรายการ -->
              <v-btn
                v-if="canDelete(item)"
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                title="ลบ"
                @click="openDeleteDialog(item)"
              ></v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Modal 1: แจ้งซ่อม / แก้ไข (Form Dialog) -->
    <v-dialog v-model="formDialog" max-width="600" persistent>
      <v-card class="rounded-xl pa-2">
        <v-card-title class="font-weight-bold d-flex align-center ga-2">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus-box'" color="primary"></v-icon>
          {{ isEditing ? 'แก้ไขคำขอแจ้งซ่อม' : 'แจ้งซ่อมอุปกรณ์ใหม่' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitForm" class="d-flex flex-column ga-3">
            <v-text-field
              v-model="form.equipment_name"
              label="ชื่ออุปกรณ์ / รหัสครุภัณฑ์ *"
              variant="outlined"
              density="comfortable"
              required
            ></v-text-field>

            <v-textarea
              v-model="form.description"
              label="รายละเอียดอาการเสีย / ปัญหาที่พบ *"
              rows="3"
              variant="outlined"
              density="comfortable"
            ></v-textarea>

            <v-file-input
              v-model="formFile"
              label="แนบรูปภาพอุปกรณ์ที่มีปัญหา (JPG, PNG)"
              prepend-icon="mdi-camera"
              variant="outlined"
              density="comfortable"
              accept="image/*"
              show-size
            ></v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="plain" @click="formDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitForm">
            {{ isEditing ? 'บันทึกการแก้ไข' : 'ส่งคำขอแจ้งซ่อม' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal 2: ดูรายละเอียดงานซ่อม (Detail Dialog) -->
    <v-dialog v-model="detailDialog" max-width="700">
      <v-card class="rounded-xl pa-2" v-if="selectedItem">
        <v-card-title class="d-flex justify-space-between align-center border-b pb-3">
          <div class="d-flex align-center ga-2 font-weight-bold">
            <v-icon icon="mdi-file-document-outline" color="primary"></v-icon>
            รายละเอียดงานซ่อม {{ selectedItem.ticket_no }}
          </div>
          <v-chip size="small" :color="statusColor(selectedItem.status)" variant="flat">
            {{ statusLabel(selectedItem.status) }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row dense>
            <v-col cols="12"><b>ชื่ออุปกรณ์:</b> {{ selectedItem.equipment_name }}</v-col>
            <v-col cols="12" class="mt-2">
              <b>อาการเสีย:</b>
              <div class="pa-2 bg-grey-lighten-4 rounded mt-1">{{ selectedItem.description || '-' }}</div>
            </v-col>
            <v-col cols="12" sm="6" class="mt-2"><b>ผู้แจ้ง:</b> {{ selectedItem.reporter_name }} ({{ selectedItem.reporter_phone || '-' }})</v-col>
            <v-col cols="12" sm="6" class="mt-2"><b>ช่างผู้รับผิดชอบ:</b> {{ selectedItem.technician_name || 'ยังไม่ระบุ' }}</v-col>
            <v-col cols="12" sm="6" v-if="selectedItem.repair_cost > 0">
              <b>ค่าใช้จ่ายในการซ่อม:</b> {{ Number(selectedItem.repair_cost).toLocaleString() }} บาท
            </v-col>
            <v-col cols="12" v-if="selectedItem.technician_notes" class="mt-2">
              <b>บันทึกผลการซ่อมของช่าง:</b>
              <div class="pa-2 bg-amber-lighten-5 rounded mt-1">{{ selectedItem.technician_notes }}</div>
            </v-col>
          </v-row>

          <!-- ภาพถ่ายก่อนซ่อมและหลังซ่อม -->
          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 font-weight-bold mb-2">รูปภาพประกอบ</div>
          <v-row dense>
            <v-col cols="12" sm="6" v-if="selectedItem.before_image">
              <div class="text-caption text-medium-emphasis mb-1 font-weight-bold">รูปภาพก่อนซ่อม (จากผู้แจ้ง)</div>
              <v-img :src="selectedItem.before_image" height="180" rounded="lg" cover class="border elevation-1"></v-img>
            </v-col>
            <v-col cols="12" sm="6" v-if="selectedItem.after_image">
              <div class="text-caption text-medium-emphasis mb-1 font-weight-bold">รูปภาพหลังซ่อม (จากช่าง)</div>
              <v-img :src="selectedItem.after_image" height="180" rounded="lg" cover class="border elevation-1"></v-img>
            </v-col>
            <v-col cols="12" v-if="!selectedItem.before_image && !selectedItem.after_image" class="text-medium-emphasis text-caption">
              ไม่มีรูปภาพแนบในรายการนี้
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-3 justify-end">
          <v-btn variant="tonal" color="primary" @click="detailDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal 3: ช่าง/แอดมิน อัปเดตสถานะ (Status Dialog) -->
    <v-dialog v-model="statusDialog" max-width="600" persistent>
      <v-card class="rounded-xl pa-2">
        <v-card-title class="font-weight-bold d-flex align-center ga-2">
          <v-icon icon="mdi-wrench" color="warning"></v-icon>
          อัปเดตสถานะงานซ่อม ({{ selectedItem?.ticket_no }})
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitStatus" class="d-flex flex-column ga-3">
            <v-select
              v-model="statusForm.status"
              :items="statusUpdateOptions"
              label="สถานะงานซ่อม *"
              variant="outlined"
              density="comfortable"
              required
            ></v-select>

            <v-select
              v-if="authStore.isAdmin"
              v-model="statusForm.technician_id"
              :items="technicianSelectItems"
              label="มอบหมายช่างผู้รับผิดชอบ"
              variant="outlined"
              density="comfortable"
            ></v-select>

            <v-text-field
              v-model="statusForm.repair_cost"
              label="ค่าใช้จ่ายในการซ่อม (บาท)"
              type="number"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-textarea
              v-model="statusForm.technician_notes"
              label="บันทึกผลการซ่อม / รายละเอียดอะไหล่ที่เปลี่ยน"
              rows="3"
              variant="outlined"
              density="comfortable"
            ></v-textarea>

            <v-file-input
              v-model="statusFile"
              label="แนบรูปภาพหลังการซ่อมเสร็จสิ้น (ถ้ามี)"
              prepend-icon="mdi-camera-check"
              variant="outlined"
              density="comfortable"
              accept="image/*"
              show-size
            ></v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="plain" @click="statusDialog = false">ยกเลิก</v-btn>
          <v-btn color="warning" variant="flat" :loading="saving" @click="submitStatus">
            บันทึกการอัปเดต
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal 4: ยืนยันการลบ (Delete Dialog) -->
    <v-dialog v-model="deleteDialog" max-width="450">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="font-weight-bold d-flex align-center ga-2 text-error">
          <v-icon icon="mdi-alert-circle" color="error"></v-icon>
          ยืนยันการลบรายการ
        </v-card-title>
        <v-card-text>
          คุณต้องการลบรายการแจ้งซ่อม <b>{{ selectedItem?.ticket_no }}</b> ({{ selectedItem?.equipment_name }}) ใช่หรือไม่?
        </v-card-text>
        <v-card-actions class="pa-3 justify-end">
          <v-btn variant="plain" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="flat" :loading="saving" @click="submitDelete">
            ลบรายการ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useRepairStore } from '../stores/repair.js'
import { useAlertStore } from '../stores/alert.js'

const authStore = useAuthStore()
const repairStore = useRepairStore()
const alertStore = useAlertStore()

// State
const search = ref('')
const statusFilter = ref('all')
const saving = ref(false)

// Dialog visibility
const formDialog = ref(false)
const detailDialog = ref(false)
const statusDialog = ref(false)
const deleteDialog = ref(false)

const isEditing = ref(false)
const selectedItem = ref(null)

// Forms
const form = ref({
  equipment_name: '',
  description: ''
})
const formFile = ref(null)

const statusForm = ref({
  status: 'pending',
  technician_id: null,
  repair_cost: 0,
  technician_notes: ''
})
const statusFile = ref(null)

// Options & Status Mappings
const statusOptions = [
  { title: 'ทั้งหมด', value: 'all' },
  { title: 'รอดำเนินการ', value: 'pending' },
  { title: 'กำลังดำเนินการ', value: 'in_progress' },
  { title: 'รออะไหล่', value: 'waiting_parts' },
  { title: 'เสร็จสิ้น', value: 'completed' },
  { title: 'ยกเลิก', value: 'cancelled' }
]

const statusUpdateOptions = [
  { title: 'รอดำเนินการ (Pending)', value: 'pending' },
  { title: 'กำลังดำเนินการ (In Progress)', value: 'in_progress' },
  { title: 'รออะไหล่ (Waiting Parts)', value: 'waiting_parts' },
  { title: 'ซ่อมเสร็จสิ้น (Completed)', value: 'completed' },
  { title: 'ยกเลิกงานซ่อม (Cancelled)', value: 'cancelled' }
]

const statusColor = (s) => {
  const map = {
    pending: 'warning',
    in_progress: 'info',
    waiting_parts: 'orange',
    completed: 'success',
    cancelled: 'error',
    rejected: 'error'
  }
  return map[s] || 'grey'
}

const statusLabel = (s) => {
  const map = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    waiting_parts: 'รออะไหล่',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    rejected: 'ปฏิเสธ'
  }
  return map[s] || s
}

// Stats Cards data
const statCards = computed(() => [
  { title: 'คำขอทั้งหมด', value: repairStore.stats.total || 0, color: 'primary', icon: 'mdi-clipboard-list' },
  { title: 'รอดำเนินการ', value: repairStore.stats.pending || 0, color: 'warning', icon: 'mdi-clock-outline' },
  { title: 'กำลังซ่อม', value: repairStore.stats.in_progress || 0, color: 'info', icon: 'mdi-wrench' },
  { title: 'รออะไหล่', value: repairStore.stats.waiting_parts || 0, color: 'orange', icon: 'mdi-timer-sand' },
  { title: 'เสร็จสิ้น', value: repairStore.stats.completed || 0, color: 'success', icon: 'mdi-check-circle' },
  { title: 'ยังไม่มีช่าง', value: repairStore.stats.unassigned || 0, color: 'deep-purple', icon: 'mdi-account-alert' }
])

const technicianSelectItems = computed(() => {
  return repairStore.technicians.map((t) => ({
    title: `${t.fullname} (${t.username})`,
    value: t.id
  }))
})

// Permissions
const canEdit = (item) => {
  if (authStore.isAdmin) return true
  return authStore.isUser && item.user_id === authStore.user?.id && item.status === 'pending'
}

const canDelete = (item) => {
  if (authStore.isAdmin) return true
  return authStore.isUser && item.user_id === authStore.user?.id && item.status === 'pending'
}

// Methods
const loadData = async () => {
  await Promise.all([
    repairStore.fetchRepairs({ search: search.value, status: statusFilter.value }),
    repairStore.fetchStats(),
    (authStore.isAdmin || authStore.isTechnician) && repairStore.fetchTechnicians()
  ])
}

const loadRepairs = () => {
  repairStore.fetchRepairs({ search: search.value, status: statusFilter.value })
}

// Handlers
const openCreateDialog = () => {
  isEditing.value = false
  form.value = {
    equipment_name: '',
    description: ''
  }
  formFile.value = null
  formDialog.value = true
}

const openEditDialog = (item) => {
  isEditing.value = true
  selectedItem.value = item
  form.value = {
    equipment_name: item.equipment_name,
    description: item.description || ''
  }
  formFile.value = null
  formDialog.value = true
}

const openDetailDialog = (item) => {
  selectedItem.value = item
  detailDialog.value = true
}

const openStatusDialog = (item) => {
  selectedItem.value = item
  statusForm.value = {
    status: item.status,
    technician_id: item.technician_id || null,
    repair_cost: item.repair_cost || 0,
    technician_notes: item.technician_notes || ''
  }
  statusFile.value = null
  statusDialog.value = true
}

const openDeleteDialog = (item) => {
  selectedItem.value = item
  deleteDialog.value = true
}

// Submit Form (Create / Edit)
const submitForm = async () => {
  if (!form.value.equipment_name) {
    alertStore.error('กรุณาระบุชื่ออุปกรณ์')
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('equipment_name', form.value.equipment_name)
    formData.append('description', form.value.description)
    if (formFile.value) {
      formData.append('file', formFile.value)
    }

    if (isEditing.value) {
      await repairStore.updateRepair(selectedItem.value.id, formData)
      alertStore.success('แก้ไขข้อมูลการแจ้งซ่อมสำเร็จ')
    } else {
      await repairStore.createRepair(formData)
      alertStore.success('สร้างคำขอแจ้งซ่อมอุปกรณ์เรียบร้อยแล้ว')
    }

    formDialog.value = false
    await loadData()
  } catch (err) {
    alertStore.error(err.message || 'บันทึกข้อมูลไม่สำเร็จ')
  } finally {
    saving.value = false
  }
}

// Submit Status Update
const submitStatus = async () => {
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('status', statusForm.value.status)
    if (statusForm.value.technician_id) {
      formData.append('technician_id', statusForm.value.technician_id)
    }
    formData.append('repair_cost', statusForm.value.repair_cost || 0)
    formData.append('technician_notes', statusForm.value.technician_notes || '')
    if (statusFile.value) {
      formData.append('file', statusFile.value)
    }

    await repairStore.updateStatus(selectedItem.value.id, formData)
    alertStore.success('อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว')
    statusDialog.value = false
    await loadData()
  } catch (err) {
    alertStore.error(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ')
  } finally {
    saving.value = false
  }
}

// Submit Delete
const submitDelete = async () => {
  saving.value = true
  try {
    await repairStore.deleteRepair(selectedItem.value.id)
    alertStore.success('ลบรายการแจ้งซ่อมเรียบร้อยแล้ว')
    deleteDialog.value = false
    await loadData()
  } catch (err) {
    alertStore.error(err.message || 'ไม่สามารถลบรายการได้')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
