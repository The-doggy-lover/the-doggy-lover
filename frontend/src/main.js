import axios from 'axios'
import { createApp } from 'vue'
import App from './App.vue'

axios.defaults.withCredentials = true

const app = createApp(App)

// 🔥 Global error catcher (this is what we wanted)
app.config.errorHandler = (err, vm, info) => {
  console.error('💥 Vue error:', err)
  console.error('📍 Info:', info)
}

app.mount('#app')
