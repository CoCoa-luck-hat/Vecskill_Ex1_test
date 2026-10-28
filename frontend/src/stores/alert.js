import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const show = ref(false)
  const message = ref('')
  const title = ref('')
  const type = ref('success') // 'success' | 'error' | 'warning' | 'info'
  const timeout = ref(4000)
  let timerId = null

  function trigger({ message: msg, type: customType = 'success', title: customTitle = '', duration = 4000 }) {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }

    message.value = msg || ''
    type.value = customType
    title.value = customTitle
    timeout.value = duration
    show.value = true

    if (duration > 0) {
      timerId = setTimeout(() => {
        show.value = false
        timerId = null
      }, duration)
    }
  }

  function success(msg, customTitle = 'สำเร็จ') {
    trigger({ message: msg, type: 'success', title: customTitle })
  }

  function error(msg, customTitle = 'เกิดข้อผิดพลาด') {
    trigger({ message: msg, type: 'error', title: customTitle, duration: 5000 })
  }

  function warning(msg, customTitle = 'แจ้งเตือน') {
    trigger({ message: msg, type: 'warning', title: customTitle })
  }

  function info(msg, customTitle = 'ข้อมูล') {
    trigger({ message: msg, type: 'info', title: customTitle })
  }

  function close() {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
    show.value = false
  }

  return {
    show,
    message,
    title,
    type,
    timeout,
    trigger,
    success,
    error,
    warning,
    info,
    close
  }
})
