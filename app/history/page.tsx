'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTradingStore } from '@/lib/store'
import Link from 'next/link'

interface TradeHistory {
  id: string
  action: string
  side: string
  price: number
  size: number
  realized_pnl?: number
  fee?: number
  timestamp: string
}

export default function HistoryPage() {
  const { user } = useTradingStore()
  const [history, setHistory] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error loading history:', error)
        return
      }

      setHistory(data)
      setLoading(false)
    }

    loadHistory()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Trade History</h1>
          <Link href="/" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Back to Trading
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-4 bg-gray-700 font-semibold text-sm">
            <div>Action</div>
            <div>Side</div>
            <div>Price</div>
            <div>Size</div>
            <div>PnL</div>
            <div>Fee</div>
            <div>Time</div>
          </div>

          {history.map((trade) => (
            <div key={trade.id} className="grid grid-cols-7 gap-4 p-4 border-t border-gray-700 text-sm">
              <div className={`font-semibold ${
                trade.action === 'OPEN' ? 'text-blue-400' :
                trade.action === 'CLOSE' ? 'text-gray-400' :
                trade.action === 'LIQUIDATION' ? 'text-red-400' :
                trade.action === 'TP' ? 'text-green-400' : 'text-orange-400'
              }`}>
                {trade.action}
              </div>
              <div className={trade.side === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                {trade.side}
              </div>
              <div className="font-mono">${trade.price.toFixed(2)}</div>
              <div className="font-mono">{trade.size.toFixed(4)}</div>
              <div className={`font-mono ${trade.realized_pnl && trade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trade.realized_pnl ? `$${trade.realized_pnl.toFixed(2)}` : '-'}
              </div>
              <div className="font-mono text-orange-400">
                {trade.fee ? `$${trade.fee.toFixed(2)}` : '-'}
              </div>
              <div className="text-gray-400">
                {new Date(trade.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}