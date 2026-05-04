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
      component: () => import('../views/Dashboard.vue'),
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
  const { data: { session } } = await supabase.auth.getSession()
  
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else if (to.path === '/login' && session) {
    next('/dashboard')
  } else {
    next()
  }
})

// Handle chunk loading errors when new version is deployed
router.onError((error, to) => {
  if (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')
  ) {
    window.location.href = to.fullPath
  }
})

export default router
