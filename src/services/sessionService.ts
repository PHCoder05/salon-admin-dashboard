import { supabase } from '../lib/supabase'
import { UserSession } from '../types/profiles'

// Function to create a new user session
export async function createUserSession(
  userId: string,
  profileId: string,
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  },
  ipAddress: string,
  location?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        profile_id: profileId,
        device_info: deviceInfo,
        ip_address: ipAddress,
        location: location || null,
        is_active: true
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating user session:', error);
    return null;
  }
}

// Function to increment action count for a session
export async function incrementSessionActionCount(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        actions_count: supabase.raw('actions_count + 1'),
        last_active: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing session action count:', error);
  }
}

// Function to end a user session
export async function endUserSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        last_active: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error ending user session:', error);
  }
}

// Function to get all active sessions
export async function getActiveSessions(): Promise<UserSession[]> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        profiles:profile_id (
          full_name,
          email,
          role
        )
      `)
      .eq('is_active', true)
      .order('last_active', { ascending: false });

    if (error) throw error;

    return data.map(session => ({
      ...session,
      full_name: session.profiles.full_name,
      email: session.profiles.email,
      role: session.profiles.role
    }));
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

// Function to clean up stale sessions (inactive for more than 24 hours)
export async function cleanupStaleSessions(): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
  } catch (error) {
    console.error('Error cleaning up stale sessions:', error);
  }
}

// Function to get session statistics
export async function getSessionStats() {
  try {
    const { data: activeCount } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: totalCount } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: uniqueLocations } = await supabase
      .from('user_sessions')
      .select('location->city')
      .not('location->city', 'is', null);

    const { data: highActivity } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .gt('actions_count', 100);

    return {
      activeSessions: activeCount?.count || 0,
      totalSessions: totalCount?.count || 0,
      uniqueLocations: new Set(uniqueLocations?.map(l => l.location.city)).size,
      highActivitySessions: highActivity?.count || 0
    };
  } catch (error) {
    console.error('Error getting session statistics:', error);
    return {
      activeSessions: 0,
      totalSessions: 0,
      uniqueLocations: 0,
      highActivitySessions: 0
    };
  }
} 