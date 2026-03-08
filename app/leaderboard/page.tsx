'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface LeaderboardUser {
  nickname: string
  balance: number
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('nickname, balance')
        .order('balance', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading leaderboard:', error)
        return
      }

      setUsers(data)
      setLoading(false)
    }

    loadLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <Link href="/" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Back to Trading
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700 font-semibold">
            <div>Rank</div>
            <div>Nickname</div>
            <div>Balance (USDT)</div>
          </div>

          {users.map((user, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 p-4 border-t border-gray-700">
              <div className="font-semibold">#{index + 1}</div>
              <div>{user.nickname}</div>
              <div className="font-mono">${user.balance.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}