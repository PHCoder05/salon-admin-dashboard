import { supabase } from '../lib/supabase'
import { Profile, CreateProfileData, UpdateProfileData, ProfileFilters, ProfileStats } from '../types/profiles'

export class ProfileService {
  // Fetch all profiles with optional filtering
  static async getProfiles(filters?: ProfileFilters): Promise<Profile[]> {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }

    if (filters?.status && filters.status !== 'all') {
      const isActive = filters.status === 'active'
      query = query.eq('is_active', isActive)
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`)
    }

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      throw new Error(`Failed to fetch profiles: ${error.message}`)
    }

    return data || []
  }

  // Get profile by ID
  static async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    return data
  }

  // Create new profile (Note: This creates a profile for existing auth users only)
  // In a real application, you'd want to create auth users first
  static async createProfile(profileData: CreateProfileData): Promise<Profile> {
    // For this demo, we'll assume the user ID comes from an existing auth user
    // In a real app, you'd call supabase.auth.admin.createUser() first
    
    console.warn('Creating profile requires an existing auth user. This is a demo implementation.')
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    return data
  }

  // Create auth user and profile together (using signup)
  static async createUserWithProfile(userData: CreateProfileData & { password: string }): Promise<Profile> {
    // Create auth user using signup (this doesn't require admin privileges)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email!,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        }
      }
    })

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Create profile with the auth user ID
    const profileData = {
      id: authData.user.id,
      full_name: userData.full_name,
      email: userData.email,
      username: userData.username,
      phone_number: userData.phone_number,
      whatsapp_number: userData.whatsapp_number,
      role: userData.role,
      is_active: userData.is_active,
      avatar_url: userData.avatar_url,
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    return data
  }

  // Update profile
  static async updateProfile(id: string, profileData: UpdateProfileData): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return data
  }

  // Delete profile
  static async deleteProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`)
    }
  }

  // Toggle profile status
  static async toggleProfileStatus(id: string): Promise<Profile> {
    // First get current status
    const profile = await this.getProfile(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Toggle status
    const newStatus = !profile.is_active
    return this.updateProfile(id, { is_active: newStatus })
  }

  // Reset password (sends password reset email)
  static async resetPassword(email: string): Promise<{ message: string }> {
    // Use Supabase's built-in password reset flow
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`)
    }

    return {
      message: `Password reset email sent to ${email}. Please check your inbox.`
    }
  }

  // Get profile statistics
  static async getProfileStats(): Promise<ProfileStats> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, is_active, created_at, role')

    if (error) {
      throw new Error(`Failed to fetch profile stats: ${error.message}`)
    }

    const totalProfiles = data.length
    const activeProfiles = data.filter(p => p.is_active).length
    const inactiveProfiles = totalProfiles - activeProfiles

    // Calculate new this month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const newThisMonth = data.filter(p => new Date(p.created_at) >= thisMonth).length

    // Calculate previous month for growth rate
    const lastMonth = new Date(thisMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthProfiles = data.filter(p => {
      const created = new Date(p.created_at)
      return created >= lastMonth && created < thisMonth
    }).length

    const growthRate = lastMonthProfiles > 0 ? 
      ((newThisMonth - lastMonthProfiles) / lastMonthProfiles) * 100 : 0

    // Role distribution
    const roleDistribution = data.reduce((acc, profile) => {
      const role = profile.role || 'user'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalProfiles,
      activeProfiles,
      inactiveProfiles,
      newThisMonth,
      growthRate,
      roleDistribution
    }
  }
} 