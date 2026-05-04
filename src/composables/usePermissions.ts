import { ref, readonly, computed } from 'vue'
import { supabase } from '../../lib/supabase'

export interface AppPermission {
  resource: string
  action: string
}

const userPermissions = ref<AppPermission[]>([])
const systemRole = ref<string>('STAFF')
const isSuperAdmin = computed(() => systemRole.value === 'ADMIN')

const CACHE_KEY = 'app_permissions_cache'

export function usePermissions() {
  const clearPermissions = () => {
    userPermissions.value = []
    systemRole.value = 'STAFF'
    localStorage.removeItem(CACHE_KEY)
  }

  const loadPermissions = async (userId?: string, forceRefresh = false) => {
    // Try to load from cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { role, perms } = JSON.parse(cached)
          systemRole.value = role
          userPermissions.value = perms
          return
        } catch (e) {
          console.error('Failed to parse cached permissions', e)
        }
      }
    }

    let currentUserId = userId
    if (!currentUserId) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) return
      currentUserId = userData.user.id
    }

    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('system_role')
      .eq('id', currentUserId)
      .single()

    if (empError) console.error('Error fetching employee role:', empError.message)
    const role = empData?.system_role || 'STAFF'
    systemRole.value = role

    if (role === 'ADMIN') {
      return // Admin has full permissions
    }

    // Load role permissions
    const { data: rolePerms, error: rpError } = await supabase
      .from('role_permissions')
      .select('resource, actions')
      .eq('role', role)

    if (rpError && rpError.code !== '42P01') { 
       console.error('Error fetching role permissions:', rpError.message)
    }

    // Load user explicit permissions
    const { data: userPerms, error: upError } = await supabase
      .from('user_permissions')
      .select('resource, actions')
      .eq('user_id', currentUserId)

    if (upError && upError.code !== '42P01') {
      console.error('Error fetching user permissions:', upError.message)
    }

    // Merge logic
    const finalPerms: Record<string, boolean> = {}

    // 1. Set role permissions
    if (rolePerms) {
      rolePerms.forEach(p => {
        const resourceActions = p.actions as Record<string, boolean>;
        if (resourceActions) {
          Object.keys(resourceActions).forEach(actionKey => {
            if (resourceActions[actionKey]) {
              finalPerms[`${p.resource}:${actionKey}`] = true
            }
          })
        }
      })
    }

    // 2. Override with user-specific permissions
    if (userPerms) {
      userPerms.forEach(p => {
        const resourceActions = p.actions as Record<string, 'allow' | 'deny' | 'inherit'>;
        if (resourceActions) {
          Object.keys(resourceActions).forEach(actionKey => {
            const state = resourceActions[actionKey];
            if (state === 'allow') {
              finalPerms[`${p.resource}:${actionKey}`] = true
            } else if (state === 'deny') {
              finalPerms[`${p.resource}:${actionKey}`] = false
            }
          })
        }
      })
    }

    const permsArray: AppPermission[] = []
    Object.keys(finalPerms).forEach(key => {
      if (finalPerms[key]) {
        const [resource, action] = key.split(':')
        permsArray.push({ resource, action })
      }
    })

    userPermissions.value = permsArray

    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      role: systemRole.value,
      perms: permsArray
    }))
  }

  const can = (action: string, resource: string) => {
    if (isSuperAdmin.value) return true
    return userPermissions.value.some(p => p.action === action && p.resource === resource)
  }

  return {
    can,
    loadPermissions,
    clearPermissions,
    systemRole: readonly(systemRole),
    isSuperAdmin
  }
}
