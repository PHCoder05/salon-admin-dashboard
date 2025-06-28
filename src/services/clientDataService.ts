import { supabase } from '../lib/supabase'
import { Profile } from '../types/profiles'

export interface ClientStats {
  totalClients: number
  activeClients: number
  monthlyRevenue: number
  activeSessions: number
  openTickets: number
}

export interface ClientActivity {
  id: string
  salon_name: string
  owner_name: string
  monthly_revenue: number
  subscription_plan: string
  last_active: string
}

export class ClientDataService {
  static async getClientStats(): Promise<ClientStats> {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'salon_owner')

    if (error) throw error

    const activeClients = profiles.filter(p => p.is_active).length
    
    // Calculate monthly revenue based on subscription plans
    const monthlyRevenue = profiles.reduce((total, profile) => {
      const planRates: Record<string, number> = {
        'basic': 29.99,
        'premium': 49.99,
        'enterprise': 99.99
      }
      return total + (planRates[profile.subscription_plan || 'basic'] || 0)
    }, 0)

    // Get active sessions count
    const { count: activeSessions } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Get open tickets count
    const { count: openTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('status', 'open')

    return {
      totalClients: profiles.length,
      activeClients,
      monthlyRevenue,
      activeSessions: activeSessions || 0,
      openTickets: openTickets || 0
    }
  }

  static async getRecentActivity(): Promise<ClientActivity[]> {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        salon_name,
        subscription_plan,
        last_active,
        monthly_revenue
      `)
      .eq('role', 'salon_owner')
      .order('last_active', { ascending: false })
      .limit(5)

    if (error) throw error

    return profiles.map(profile => ({
      id: profile.id,
      salon_name: profile.salon_name || 'Unnamed Salon',
      owner_name: profile.full_name || 'Unknown Owner',
      monthly_revenue: profile.monthly_revenue || 0,
      subscription_plan: profile.subscription_plan || 'basic',
      last_active: profile.last_active
    }))
  }

  static async getClientDetails(clientId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw error
    return data
  }
} 