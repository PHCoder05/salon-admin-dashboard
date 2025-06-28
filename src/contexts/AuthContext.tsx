import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { createUserSession, endUserSession } from '../services/sessionService'
import { useNavigate, useLocation } from 'react-router-dom'

// Demo credentials for fallback authentication
const DEMO_CREDENTIALS = {
  'admin': { password: 'admin', role: 'admin', id: 'admin-001', profile_id: 'profile-001' },
  'salon_admin': { password: 'password123', role: 'admin', id: 'admin-002', profile_id: 'profile-002' },
  'super_admin': { password: 'super123', role: 'super_admin', id: 'admin-003', profile_id: 'profile-003' },
  'admin123': { password: 'admin123', role: 'admin', id: 'admin-004', profile_id: 'profile-004' },
  'admin@salon.com': { password: 'admin', role: 'admin', id: 'admin-005', profile_id: 'profile-005' },
}

interface User {
  id: string
  email: string
  role: string
  created_at: string
  profile_id?: string
  session_id?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Function to get device info
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    deviceType = 'mobile';
  }
  
  const browser = (() => {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident/')) return 'Internet Explorer';
    return 'Unknown';
  })();
  
  const os = (() => {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  })();
  
  return { type: deviceType, browser, os };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect effect
  useEffect(() => {
    if (!isLoading) {
      const publicRoutes = ['/login', '/password-reset', '/email-confirmation']
      const isPublicRoute = publicRoutes.includes(location.pathname)
      
      if (user && isPublicRoute) {
        // If user is authenticated and tries to access a public route, redirect to dashboard
        navigate('/dashboard')
      } else if (!user && !isPublicRoute && location.pathname !== '/') {
        // If user is not authenticated and tries to access a protected route, redirect to login
        navigate('/login')
      }
    }
  }, [user, isLoading, location.pathname, navigate])

  useEffect(() => {
    // Check for existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('auth_user_id', session.user.id)
            .single()

          if (profileData) {
            const newUser = {
              id: session.user.id,
              email: session.user.email || '',
              role: profileData.role,
              created_at: session.user.created_at,
              profile_id: profileData.id
            }
            setUser(newUser)
          }
        } else {
          // Check for demo user
          const savedUser = localStorage.getItem('demo_admin_user')
          if (savedUser) {
            setUser(JSON.parse(savedUser))
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('auth_user_id', session.user.id)
          .single()

        if (profileData) {
          const newUser = {
            id: session.user.id,
            email: session.user.email || '',
            role: profileData.role,
            created_at: session.user.created_at,
            profile_id: profileData.id
          }
          setUser(newUser)
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const createSession = async (userId: string, profileId: string) => {
    try {
      // Get device info
      const deviceInfo = getDeviceInfo();
      
      // Get IP address (in a real app, you'd use a geolocation service)
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      
      // Get location (in a real app, you'd use a geolocation service)
      const location = {
        city: 'Unknown',
        country: 'Unknown',
        latitude: 0,
        longitude: 0
      };
      
      // Create session
      const sessionId = await createUserSession(
        userId,
        profileId,
        deviceInfo,
        ipData.ip || '127.0.0.1',
        location
      );
      
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Login failed - no user data returned')
      }

      // Get or create profile
      let profileData;
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one using the secure function
        const { data: newProfile, error: createError } = await supabase
          .rpc('create_initial_profile', {
            user_id: data.user.id,
            user_email: data.user.email,
            user_role: 'admin'
          });

        if (createError) throw createError;
        profileData = newProfile;
      } else if (profileError) {
        throw profileError;
      } else {
        profileData = existingProfile;
      }

      const sessionId = await createSession(data.user.id, profileData.id);

      const newUser = {
        id: data.user.id,
        email: data.user.email || '',
        role: profileData.role,
        created_at: data.user.created_at,
        profile_id: profileData.id,
        session_id: sessionId
      }
      setUser(newUser)
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      // End the user's session if it exists
      if (user?.session_id) {
        await endUserSession(user.session_id);
      }
      
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem('demo_admin_user')
    } catch (error: any) {
      console.error('Logout error:', error)
      throw new Error(error.message || 'Logout failed')
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 