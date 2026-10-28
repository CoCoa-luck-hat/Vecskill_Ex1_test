<template>
  <v-app>
    <component :is="layout">
      <router-view />
    </component>
    <AppAlert />
  </v-app>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AppAlert from './components/AppAlert.vue'

const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})

const layout = computed(() => {
  if (route.name === 'login') {
    return 'div'
  }
  return DefaultLayout
})
</script>

<style>
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #F1F5F9;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
</style>
