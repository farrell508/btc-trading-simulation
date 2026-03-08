'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTradingStore } from '@/lib/store'

interface OrderPanelProps {
  isMobile?: boolean
}

export default function OrderPanel({ isMobile = false }: OrderPanelProps) {
  const { user, setPositions, addPosition, currentPrice } = useTradingStore()
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG')
  const [leverage, setLeverage] = useState(1)
  const [marginMode, setMarginMode] = useState<'CROSS' | 'ISOLATED'>('CROSS')
  const [amount, setAmount] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleOrder = async () => {
    if (!user || !amount) return

    setIsLoading(true)
    try {
      const entryPrice = currentPrice
      const size = parseFloat(amount) * leverage
      const fee = size * entryPrice * 0.0005 // Maker fee for simplicity

      // Calculate liquidation price (simplified)
      const liqPrice = side === 'LONG'
        ? entryPrice * (1 - 1/leverage)
        : entryPrice * (1 + 1/leverage)

      // Calculate margin
      const margin = marginMode === 'ISOLATED' ? parseFloat(amount) : 0

      // Check balance
      if (user.balance < parseFloat(amount) + fee) {
        alert('Insufficient balance')
        return
      }

      // Insert position
      const { data: positionData, error: posError } = await supabase
        .from('positions')
        .insert({
          user_id: user.id,
          symbol: 'BTC',
          side,
          margin_mode: marginMode,
          leverage,
          entry_price: entryPrice,
          size,
          isolated_margin: marginMode === 'ISOLATED' ? margin : null,
          liquidation_price: liqPrice,
          take_profit_price: takeProfit ? parseFloat(takeProfit) : null,
          stop_loss_price: stopLoss ? parseFloat(stopLoss) : null,
        })
        .select()
        .single()

      if (posError) throw posError

      // Update balance
      const newBalance = user.balance - parseFloat(amount) - fee
      const { error: balError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id)

      if (balError) throw balError

      // Insert trade history
      const { error: histError } = await supabase
        .from('trade_history')
        .insert({
          user_id: user.id,
          action: 'OPEN',
          side,
          price: entryPrice,
          size,
          fee,
        })

      if (histError) throw histError

      // Update store
      addPosition(positionData)
      setAmount('')
      setTakeProfit('')
      setStopLoss('')

      alert('Order placed successfully')
    } catch (error) {
      console.error('Order error:', error)
      alert('Failed to place order')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`p-4 ${isMobile ? 'h-full' : 'h-full bg-gray-700 rounded'}`}>
      <h3 className="text-lg font-semibold mb-4">Place Order</h3>

      {/* Side Selection */}
      <div className="flex mb-4">
        <button
          onClick={() => setSide('LONG')}
          className={`flex-1 py-3 px-4 rounded-l-lg font-semibold ${
            side === 'LONG' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}
        >
          LONG
        </button>
        <button
          onClick={() => setSide('SHORT')}
          className={`flex-1 py-3 px-4 rounded-r-lg font-semibold ${
            side === 'SHORT' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}
        >
          SHORT
        </button>
      </div>

      {/* Leverage Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Leverage: {leverage}x</label>
        <input
          type="range"
          min="1"
          max="100"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Margin Mode */}
      <div className="flex mb-4">
        <button
          onClick={() => setMarginMode('CROSS')}
          className={`flex-1 py-2 px-4 rounded-l-lg text-sm ${
            marginMode === 'CROSS' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}
        >
          Cross
        </button>
        <button
          onClick={() => setMarginMode('ISOLATED')}
          className={`flex-1 py-2 px-4 rounded-r-lg text-sm ${
            marginMode === 'ISOLATED' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}
        >
          Isolated
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount (USDT)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400"
        />
      </div>

      {/* TP/SL */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Take Profit</label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
            className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Stop Loss</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
            className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Order Button */}
      <button
        onClick={handleOrder}
        disabled={isLoading || !amount}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-lg ${
          side === 'LONG'
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800'
            : 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
        } disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Placing...' : `Place ${side} Order`}
      </button>
    </div>
  )
}