import { create } from 'zustand'

interface User {
  id: string
  nickname: string
  balance: number
}

interface Position {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  margin_mode: 'CROSS' | 'ISOLATED'
  leverage: number
  entry_price: number
  size: number
  isolated_margin?: number
  liquidation_price: number
  take_profit_price?: number
  stop_loss_price?: number
  created_at: string
}

interface TradeHistory {
  id: string
  action: 'OPEN' | 'CLOSE' | 'LIQUIDATION' | 'TP' | 'SL'
  side: 'LONG' | 'SHORT'
  price: number
  size: number
  realized_pnl?: number
  fee?: number
  timestamp: string
}

interface TradingStore {
  user: User | null
  positions: Position[]
  tradeHistory: TradeHistory[]
  currentPrice: number
  setUser: (user: User | null) => void
  setPositions: (positions: Position[]) => void
  setTradeHistory: (history: TradeHistory[]) => void
  setCurrentPrice: (price: number) => void
  addPosition: (position: Position) => void
  removePosition: (id: string) => void
}

export const useTradingStore = create<TradingStore>((set) => ({
  user: null,
  positions: [],
  tradeHistory: [],
  currentPrice: 0,
  setUser: (user) => set({ user }),
  setPositions: (positions) => set({ positions }),
  setTradeHistory: (tradeHistory) => set({ tradeHistory }),
  setCurrentPrice: (currentPrice) => set({ currentPrice }),
  addPosition: (position) => set((state) => ({ positions: [...state.positions, position] })),
  removePosition: (id) => set((state) => ({ positions: state.positions.filter(p => p.id !== id) })),
}))