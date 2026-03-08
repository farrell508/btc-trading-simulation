'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useTradingStore } from '@/lib/store'
import Chart from './Chart'
import OrderPanel from './OrderPanel'
import PositionsPanel from './PositionsPanel'

interface TradingLayoutProps {
  children?: React.ReactNode
}

export default function TradingLayout({ children }: TradingLayoutProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '1h'>('1m')
  const [mobileTab, setMobileTab] = useState<'order' | 'positions'>('order')
  const { user } = useTradingStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">BTC Trading Simulation</h1>
          {user && (
            <div className="text-green-400 font-semibold">
              Balance: ${user.balance.toFixed(2)}
            </div>
          )}
        </div>
        <div className="flex space-x-4 items-center">
          <Link href="/history" className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700">
            History
          </Link>
          <Link href="/leaderboard" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Leaderboard
          </Link>
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1">
          {/* Chart Area */}
          <div className="flex-1 bg-gray-700 p-4">
            <Chart timeframe={timeframe} onTimeframeChange={setTimeframe} />
          </div>

          {/* Order Panel */}
          <div className="w-80 bg-gray-800 p-4 border-l border-gray-700">
            <OrderPanel />
          </div>
        </div>

        {/* Positions Panel - Desktop */}
        <div className="hidden lg:block w-80 bg-gray-800 p-4 border-l border-gray-700">
          <PositionsPanel />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex-1 flex flex-col">
          {/* Chart Area */}
          <div className="flex-1 bg-gray-700 p-4">
            <Chart timeframe={timeframe} onTimeframeChange={setTimeframe} />
          </div>

          {/* Tabs for Mobile */}
          <div className="h-96 bg-gray-800 border-t border-gray-700">
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setMobileTab('order')}
                className={`flex-1 py-2 px-4 font-semibold ${
                  mobileTab === 'order' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                Order
              </button>
              <button
                onClick={() => setMobileTab('positions')}
                className={`flex-1 py-2 px-4 font-semibold ${
                  mobileTab === 'positions' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                Positions
              </button>
            </div>
            <div className="p-4 h-full overflow-y-auto">
              {mobileTab === 'order' ? <OrderPanel isMobile /> : <PositionsPanel isMobile />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}