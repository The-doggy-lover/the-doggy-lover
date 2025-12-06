import axios from 'axios' 
axios.defaults.withCredentials = true

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
