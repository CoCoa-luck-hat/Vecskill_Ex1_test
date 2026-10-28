<template>
  <div class="global-alert-container">
    <transition name="slide-down">
      <v-alert
        v-if="alertStore.show"
        :type="alertStore.type"
        :color="alertColor"
        variant="elevated"
        elevation="6"
        closable
        rounded="lg"
        class="global-alert"
        @click:close="alertStore.close()"
      >
        <template #prepend>
          <v-icon size="28" :icon="alertIcon" class="mr-2"></v-icon>
        </template>
        <div v-if="alertStore.title" class="font-weight-bold text-subtitle-2 mb-1">
          {{ alertStore.title }}
        </div>
        <div class="text-body-2 font-weight-medium">
          {{ alertStore.message }}
        </div>
      </v-alert>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAlertStore } from '@/stores/alert.js'

const alertStore = useAlertStore()

const alertIcon = computed(() => {
  switch (alertStore.type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-bell'
  }
})

const alertColor = computed(() => {
  switch (alertStore.type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'primary'
  }
})
</script>

<style scoped>
.global-alert-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999999;
  max-width: 440px;
  width: calc(100% - 40px);
  pointer-events: none;
}

.global-alert {
  pointer-events: auto;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-24px) scale(0.95);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-24px) scale(0.95);
}
</style>
