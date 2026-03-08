'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTradingStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useTradingStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if user exists in users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // User doesn't exist, create with initial balance
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              nickname: session.user.email?.split('@')[0] || 'Trader',
              balance: 10000
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating user:', createError)
            return
          }

          setUser(newUser)
        } else if (userData) {
          setUser(userData)
        }

        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, setUser])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">BTC Trading Simulation</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10b981',
                  brandAccent: '#059669',
                },
              },
            },
          }}
          providers={[]}
          redirectTo={`${window.location.origin}/auth/callback`}
        />
      </div>
    </div>
  )
}