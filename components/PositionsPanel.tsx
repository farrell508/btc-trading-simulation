'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTradingStore } from '@/lib/store'

interface PositionsPanelProps {
  isMobile?: boolean
}

export default function PositionsPanel({ isMobile = false }: PositionsPanelProps) {
  const { user, positions, setPositions, currentPrice } = useTradingStore()

  useEffect(() => {
    if (!user) return

    const loadPositions = async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading positions:', error)
        return
      }

      setPositions(data)
    }

    loadPositions()
  }, [user, setPositions])

  const calculatePnL = (position: any) => {
    const priceDiff = position.side === 'LONG' ? currentPrice - position.entry_price : position.entry_price - currentPrice
    return priceDiff * position.size * position.leverage
  }

  const handleClosePosition = async (positionId: string) => {
    // Simplified close logic - in real app, implement proper close
    alert('Close position functionality to be implemented')
  }

  return (
    <div className={`p-4 ${isMobile ? 'h-full' : 'h-full bg-gray-700 rounded'}`}>
      <h3 className="text-lg font-semibold mb-4">Positions</h3>

      {positions.length === 0 ? (
        <p className="text-gray-400">No open positions</p>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => (
            <div key={position.id} className="bg-gray-600 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`font-semibold ${position.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {position.side} BTC
                  </span>
                  <span className="text-sm text-gray-400 ml-2">x{position.leverage}</span>
                </div>
                <button
                  onClick={() => handleClosePosition(position.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Entry Price</p>
                  <p>${position.entry_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Size</p>
                  <p>{position.size.toFixed(4)} BTC</p>
                </div>
                <div>
                  <p className="text-gray-400">Liq. Price</p>
                  <p>${position.liquidation_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">PnL</p>
                  <p className={calculatePnL(position) >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${calculatePnL(position).toFixed(2)}
                  </p>
                </div>
              </div>

              {position.take_profit_price && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-400">TP: </span>
                  <span className="text-green-400">${position.take_profit_price.toFixed(2)}</span>
                </div>
              )}

              {position.stop_loss_price && (
                <div className="mt-1 text-sm">
                  <span className="text-gray-400">SL: </span>
                  <span className="text-orange-400">${position.stop_loss_price.toFixed(2)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}