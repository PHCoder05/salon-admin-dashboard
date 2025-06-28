import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function EmailConfirmation() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          // Update profile to active
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('email', session.user.email)

          if (updateError) throw updateError

          toast.success('Email confirmed successfully!')
          navigate('/login')
        } else {
          throw new Error('No session found')
        }
      } catch (error: any) {
        console.error('Error confirming email:', error)
        toast.error(error.message || 'Failed to confirm email')
      } finally {
        setIsProcessing(false)
      }
    }

    handleEmailConfirmation()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isProcessing ? 'Confirming Your Email' : 'Email Confirmation'}
          </h2>
          <p className="text-white/60">
            {isProcessing 
              ? 'Please wait while we confirm your email address...'
              : 'Your email has been confirmed. You can now log in.'}
          </p>
        </div>

        {isProcessing ? (
          <div className="flex justify-center">
            <motion.div
              className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/login')}
            className="w-full py-3 px-6 text-white bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            Go to Login
          </motion.button>
        )}
      </motion.div>
    </div>
  )
} 