import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import VueApexCharts from "vue3-apexcharts";

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error("Vue Global Error:", err, info);
  document.body.innerHTML += `<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding:20px;"><h1>GLOBAL VUE ERROR</h1><pre>${err?.message || err}</pre></div>`;
}

app.use(router)
app.use(VueApexCharts)

router.isReady().then(() => {
  app.mount('#app')
})
