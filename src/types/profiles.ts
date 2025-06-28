export interface Profile {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  username: string
  avatar_url?: string
  email: string
  phone_number?: string
  whatsapp_number?: string
  role: 'salon_owner' | 'admin' | 'manager' | 'stylist'
  is_active: boolean
  last_active?: string
  salon_name?: string
  subscription_plan?: 'basic' | 'premium' | 'enterprise'
  monthly_revenue?: number
  client_id?: string // Reference to parent client for staff members
  settings?: {
    notifications: boolean
    theme: 'light' | 'dark'
    language: string
  }
  metadata?: Record<string, any>
}

export interface CreateProfileData {
  username?: string
  full_name?: string
  email?: string
  phone_number?: string
  whatsapp_number?: string
  role?: string
  is_active?: boolean
  avatar_url?: string
}

export interface UpdateProfileData {
  username?: string
  full_name?: string
  email?: string
  phone_number?: string
  whatsapp_number?: string
  role?: string
  is_active?: boolean
  avatar_url?: string
}

export interface ProfileFilters {
  role?: string
  status?: string
  search?: string
  dateRange?: {
    start: Date
    end: Date
  }
  client_id?: string
}

export interface ProfileStats {
  totalProfiles: number
  activeProfiles: number
  inactiveProfiles: number
  newThisMonth: number
  growthRate: number
  roleDistribution: Record<string, number>
} 