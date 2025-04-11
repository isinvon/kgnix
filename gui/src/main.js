import { createApp } from 'vue'
import App from './App.vue'
import './assets/tailwind.css'
const app = createApp(App)

// import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(`ele-${key}`, component)
// }

// 自定义图标库
import SvgIcon from '@/components/SvgIcon/index.vue'
app.component('SvgIcon', SvgIcon)

// 自定义样式
import '@/assets/main.scss'

app.mount('#app')
