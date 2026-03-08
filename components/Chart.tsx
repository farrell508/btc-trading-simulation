'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, LineStyle, ColorType } from 'lightweight-charts'
import { useTradingStore } from '@/lib/store'

interface ChartProps {
  timeframe: '1m' | '3m' | '1h'
  onTimeframeChange: (tf: '1m' | '3m' | '1h') => void
}

export default function Chart({ timeframe, onTimeframeChange }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const priceLineRef = useRef<any>(null)
  const { positions, currentPrice, setCurrentPrice } = useTradingStore()
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      crosshair: {
        mode: 1,
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries

    // Load initial data
    loadInitialData(timeframe)

    // Add price line
    priceLineRef.current = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      title: 'Current Price',
    })

    // Add position lines
    updatePositionLines()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [timeframe])

  // Load initial candlestick data
  const loadInitialData = async (tf: string) => {
    try {
      const interval = tf === '1m' ? '1m' : tf === '3m' ? '3m' : '1h'
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=100`)
      const data = await response.json()

      const candles = data.map((k: any) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
      }))

      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(candles)
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `wss://stream.binance.com:9443/ws/btcusdt@kline_${timeframe}`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.k) {
        const kline = data.k
        const candle = {
          time: Math.floor(kline.t / 1000),
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        }

        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.update(candle)
        }

        const price = parseFloat(kline.c)
        setCurrentPrice(price)

        // Update price line
        if (priceLineRef.current) {
          priceLineRef.current.setData([{ time: candle.time, value: price }])
        }
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    websocket.onclose = () => {
      console.log('WebSocket closed')
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [timeframe, setCurrentPrice])

  // Update position lines
  const updatePositionLines = () => {
    if (!chartRef.current) return

    // Clear existing lines (except price line)
    // Note: In a real implementation, you'd need to keep track of added lines

    positions.forEach((position) => {
      // Entry price line
      const entryLine = chartRef.current!.addLineSeries({
        color: position.side === 'LONG' ? '#10b981' : '#ef4444',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: `Entry ${position.side}`,
      })
      // For simplicity, add a horizontal line at entry price
      // In practice, you'd need historical data to place it correctly

      // Liquidation price line
      const liqLine = chartRef.current!.addLineSeries({
        color: '#dc2626',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'Liquidation',
      })

      // TP/SL lines if exist
      if (position.take_profit_price) {
        const tpLine = chartRef.current!.addLineSeries({
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'TP',
        })
      }

      if (position.stop_loss_price) {
        const slLine = chartRef.current!.addLineSeries({
          color: '#f97316',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'SL',
        })
      }
    })
  }

  // Update lines when positions change
  useEffect(() => {
    updatePositionLines()
  }, [positions])

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
      <div className="flex justify-center mt-2 space-x-2">
        <button
          onClick={() => onTimeframeChange('1m')}
          className={`px-3 py-1 rounded ${timeframe === '1m' ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          1m
        </button>
        <button
          onClick={() => onTimeframeChange('3m')}
          className={`px-3 py-1 rounded ${timeframe === '3m' ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          3m
        </button>
        <button
          onClick={() => onTimeframeChange('1h')}
          className={`px-3 py-1 rounded ${timeframe === '1h' ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          1h
        </button>
      </div>
    </div>
  )
}