<template>
  <div class="min-h-screen bg-background">
    <!-- Sidebar -->
    <aside :class="[
      'h-screen fixed left-0 top-0 border-r border-outline-variant bg-white shadow-sm flex flex-col py-6 z-50 transition-all duration-300',
      isSidebarCollapsed ? 'w-[80px]' : 'w-[240px]'
    ]">
      <div class="px-4 mb-8 flex items-center justify-between">
        <div v-if="!isSidebarCollapsed" class="text-center sm:text-left flex-1 whitespace-nowrap overflow-hidden">
          <h1 class="text-xl font-bold tracking-tight text-primary">ProForeman</h1>
          <p class="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Bản Supabase</p>
        </div>
        <button 
          @click="isSidebarCollapsed = !isSidebarCollapsed" 
          class="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors mx-auto"
        >
          <Menu class="w-5 h-5" />
        </button>
      </div>
      
      <nav class="flex-1 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <div v-for="section in menuSections" :key="section.label" class="space-y-1">
          <div class="px-6 mb-2 min-h-[16px]">
            <p v-if="!isSidebarCollapsed" class="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em] whitespace-nowrap">{{ section.label }}</p>
            <div v-else class="w-4 h-[2px] bg-outline-variant/30 mx-auto rounded-full"></div>
          </div>
          <router-link
            v-for="item in section.items"
            :key="item.id"
            :to="item.href"
            class="flex items-center gap-3 py-2.5 text-sm font-medium transition-all border-r-2"
            :class="[
              activeTab === item.id 
                ? 'text-primary bg-primary/5 border-primary font-bold' 
                : 'text-on-surface-variant border-transparent hover:bg-surface-container-lowest hover:text-primary',
              isSidebarCollapsed ? 'px-0 justify-center' : 'px-6'
            ]"
            :title="isSidebarCollapsed ? item.label : undefined"
          >
            <component :is="item.icon" :class="['w-5 h-5 shrink-0', activeTab === item.id ? 'text-primary' : 'text-on-surface-variant/70']" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <div class="px-4 py-4 border-t border-outline-variant">
         <button 
          @click="handleLogout"
          class="flex items-center gap-3 py-3 text-sm font-medium text-error hover:bg-error/5 rounded-lg transition-colors"
          :class="isSidebarCollapsed ? 'justify-center w-full' : 'px-4 w-full'"
          :title="isSidebarCollapsed ? 'Đăng xuất' : undefined"
         >
            <LogOut class="w-5 h-5 shrink-0" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Đăng xuất</span>
         </button>
      </div>
    </aside>

    <!-- Top Bar -->
    <header :class="[
      'fixed top-0 right-0 h-16 z-40 border-b border-outline-variant bg-white/80 backdrop-blur-md flex items-center justify-between px-8 transition-all duration-300',
      isSidebarCollapsed ? 'left-[80px]' : 'left-[240px]'
    ]">
      <div class="flex items-center gap-4 flex-1">
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center gap-4 border-r border-outline-variant pr-6">
          <button class="text-on-surface-variant hover:text-primary transition-colors">
            <Bell class="w-5 h-5" />
          </button>
        </div>
        <router-link to="/profile" class="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-black text-primary leading-none">{{ currentUser?.name || 'Đang tải...' }}</p>
            <p class="text-[11px] font-bold text-on-surface-variant uppercase mt-0.5">{{ currentUser?.system_role || 'Nhân viên' }}</p>
          </div>
          <div class="w-10 h-10 rounded-full border-2 border-surface-container-low bg-surface-container overflow-hidden relative">
             <img 
               src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
               alt="Profile" 
               class="w-full h-full object-cover"
             />
          </div>
        </router-link>
      </div>
    </header>

    <!-- Main Content -->
    <main :class="[
      'pt-16 min-h-screen transition-all duration-300',
      isSidebarCollapsed ? 'ml-[80px]' : 'ml-[240px]'
    ]">
      <div class="p-8 max-w-7xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  LayoutDashboard, Rocket, FileText, Users, Settings, Search, Bell, HelpCircle, Download, LogOut, Briefcase, Menu 
} from 'lucide-vue-next'
import { supabase } from '#/supabase'

defineProps<{
  activeTab: string
}>()

const router = useRouter()
const currentUser = ref<any>(null)
const isSidebarCollapsed = ref(false)

const menuSections = [
  {
    label: 'Hệ thống',
    items: [
      { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    label: 'Tổ chức',
    items: [
      { id: 'departments', label: 'Phòng ban', icon: Settings, href: '/departments' },
      { id: 'personnel', label: 'Nhân sự', icon: Users, href: '/personnel' },
    ]
  },
  {
    label: 'Dự án',
    items: [
      { id: 'projects', label: 'Danh sách dự án', icon: Rocket, href: '/projects' },
      { id: 'project-roles', label: 'Chức danh dự án', icon: Briefcase, href: '/project-roles' },
      { id: 'reports', label: 'Báo cáo định kỳ', icon: FileText, href: '/reports' },
    ]
  },
  {
    label: 'Tài chính',
    items: [
      { id: 'payments', label: 'Thanh toán', icon: Download, href: '/payments' },
    ]
  }
]

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: profile } = await supabase.from('employees').select('*').eq('id', session.user.id).single()
    if (profile) currentUser.value = profile
  }
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
