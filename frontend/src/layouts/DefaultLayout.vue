<template>
  <div>
    <!-- เมนูด้านข้าง (Navigation Drawer) -->
    <v-navigation-drawer v-model="drawer">
      <div class="pa-4 d-flex align-center ga-3 border-b">
        <v-avatar :style="{ background: authStore.roleTheme.primary }" size="40">
          <v-icon icon="mdi-tools" color="white"></v-icon>
        </v-avatar>
        <div>
          <div class="font-weight-bold">ระบบแจ้งซ่อม</div>
          <div class="text-caption text-medium-emphasis">Repair System V2 (Ex2)</div>
        </div>
      </div>

      <v-list density="comfortable" nav class="pa-2">
        <v-list-item
          prepend-icon="mdi-format-list-bulleted"
          title="รายการแจ้งซ่อม"
          to="/"
          rounded="lg"
        ></v-list-item>

        <v-list-item
          v-if="authStore.isAdmin"
          prepend-icon="mdi-account-cog"
          title="จัดการผู้ใช้งาน"
          to="/admin/users"
          rounded="lg"
        ></v-list-item>
      </v-list>

      <!-- ส่วนท้ายแถบเมนู: ข้อมูลผู้ใช้ และปุ่ม Logout -->
      <template #append>
        <div class="pa-4 border-t bg-grey-lighten-5">
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar :style="{ background: authStore.roleTheme.primary }" size="36">
              <span class="text-white font-weight-bold">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <div class="overflow-hidden">
              <div class="text-body-2 font-weight-bold text-truncate">{{ authStore.user?.fullname }}</div>
              <v-chip
                size="x-small"
                variant="flat"
                :style="{ background: authStore.roleTheme.bgTint, color: authStore.roleTheme.primary }"
                class="font-weight-bold mt-1"
              >
                <v-icon :icon="authStore.roleTheme.roleIcon" start size="12"></v-icon>
                {{ authStore.roleTheme.roleLabel }}
              </v-chip>
            </div>
          </div>

          <v-btn
            block
            variant="tonal"
            color="error"
            size="small"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          >
            ออกจากระบบ
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- แถบด้านบน (App Bar) มีเฉดสี Gradient ตามแต่ละ Role -->
    <v-app-bar
      elevation="2"
      class="text-white"
      :style="{ background: authStore.roleTheme.barGradient }"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" color="white"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold">ระบบแจ้งซ่อมอุปกรณ์</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-chip color="white" class="font-weight-bold mr-3 elevation-1" variant="flat" :style="{ color: authStore.roleTheme.primary + ' !important' }">
        <v-icon :icon="authStore.roleTheme.roleIcon" start size="18" :color="authStore.roleTheme.primary"></v-icon>
        <span>{{ authStore.roleTheme.roleLabel }}</span>
      </v-chip>
    </v-app-bar>

    <!-- พื้นที่แสดงเนื้อหาหลัก พร้อมสีพื้นหลัง Tint เปลี่ยนตามแต่ละ Role -->
    <v-main :style="{ backgroundColor: authStore.roleTheme.bgTint, minHeight: '100vh', transition: 'background-color 0.3s ease' }">
      <v-container fluid class="pa-4 pa-md-6" style="max-width: 1400px;">
        <slot />
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAlertStore } from '../stores/alert.js'

const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()
const drawer = ref(true)

const handleLogout = () => {
  authStore.logout()
  alertStore.info('ออกจากระบบเรียบร้อยแล้ว', 'แจ้งเตือน')
  router.push('/login')
}
</script>
