import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../../lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/departments',
      name: 'departments',
      component: () => import('../views/Departments.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/personnel',
      name: 'personnel',
      component: () => import('../views/Personnel.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/Reports.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/project-roles',
      name: 'project-roles',
      component: () => import('../views/ProjectRoles.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('../views/Payments.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects/detail',
      name: 'project-detail',
      component: () => import('../views/ProjectDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/Projects.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/permissions',
      name: 'permissions',
      component: () => import('../views/Permissions.vue'),
      meta: { requiresAuth: true }
    },
    // Add other routes as they are created
  ]
})

router.beforeEach(async (to, from, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (to.meta.requiresAuth && !session) {
      next('/login')
    } else if (to.path === '/login' && session) {
      const { data: empData } = await supabase
        .from('employees')
        .select('system_role')
        .eq('id', session.user.id)
        .single()
      
      if (empData && empData.system_role === 'ADMIN') {
        next('/dashboard')
      } else {
        next('/reports')
      }
    } else {
      next()
    }
  } catch (err: any) {
    console.error("Router beforeEach exception:", err)
    if (to.meta.requiresAuth) {
      next('/login')
    } else {
      next()
    }
  }
})

// Handle chunk loading errors when new version is deployed
router.onError((error, to) => {
  console.error("Router navigation error:", error)
  if (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')
  ) {
    // Only reload once by checking session storage to prevent infinite loops
    if (!sessionStorage.getItem('chunk-failed-reload')) {
      sessionStorage.setItem('chunk-failed-reload', 'true')
      window.location.href = to.fullPath
    } else {
      console.error("Chunk reload infinite loop detected, aborting reload:", error)
    }
  }
})

export default router
