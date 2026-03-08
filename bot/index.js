const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@trade';

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// In-memory storage for positions
let positions = [];

// Function to load positions from DB
async function loadPositions() {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*');

    if (error) {
      console.error('Error loading positions:', error);
      return;
    }

    positions = data;
    console.log(`Loaded ${positions.length} positions`);
  } catch (err) {
    console.error('Failed to load positions:', err);
  }
}

// Function to calculate liquidation price
function calculateLiquidationPrice(entryPrice, leverage, side, marginMode, isolatedMargin, balance) {
  // Simplified calculation - in real trading, this is more complex
  // For cross margin: liquidation when loss > balance
  // For isolated: loss > isolated_margin
  // This is a placeholder - implement proper liquidation logic
  if (marginMode === 'ISOLATED') {
    return side === 'LONG' ? entryPrice * (1 - 1/leverage) : entryPrice * (1 + 1/leverage);
  } else {
    // Cross margin - simplified
    return side === 'LONG' ? entryPrice * (1 - 1/leverage) : entryPrice * (1 + 1/leverage);
  }
}

// Function to check and execute liquidation/TP/SL
async function checkAndExecute(position, currentPrice) {
  const { id, user_id, side, entry_price, size, leverage, margin_mode, isolated_margin, liquidation_price, take_profit_price, stop_loss_price } = position;

  let shouldClose = false;
  let action = '';
  let realizedPnl = 0;
  let fee = 0;

  // Calculate current PNL
  const priceDiff = side === 'LONG' ? currentPrice - entry_price : entry_price - currentPrice;
  const pnl = priceDiff * size * leverage;

  // Check liquidation
  if ((side === 'LONG' && currentPrice <= liquidation_price) || (side === 'SHORT' && currentPrice >= liquidation_price)) {
    shouldClose = true;
    action = 'LIQUIDATION';
    realizedPnl = pnl; // Loss
    fee = Math.abs(pnl) * 0.0005; // Simplified fee
  }
  // Check TP
  else if (take_profit_price && ((side === 'LONG' && currentPrice >= take_profit_price) || (side === 'SHORT' && currentPrice <= take_profit_price))) {
    shouldClose = true;
    action = 'TP';
    realizedPnl = pnl;
    fee = Math.abs(pnl) * 0.0005;
  }
  // Check SL
  else if (stop_loss_price && ((side === 'LONG' && currentPrice <= stop_loss_price) || (side === 'SHORT' && currentPrice >= stop_loss_price))) {
    shouldClose = true;
    action = 'SL';
    realizedPnl = pnl;
    fee = Math.abs(pnl) * 0.0005;
  }

  if (shouldClose) {
    try {
      // Start transaction
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user_id)
        .single();

      if (userError) throw userError;

      const newBalance = userData.balance + realizedPnl - fee;

      // Update balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user_id);

      if (updateError) throw updateError;

      // Delete position
      const { error: deleteError } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Insert trade history
      const { error: historyError } = await supabase
        .from('trade_history')
        .insert({
          user_id,
          action,
          side,
          price: currentPrice,
          size,
          realized_pnl: realizedPnl,
          fee
        });

      if (historyError) throw historyError;

      console.log(`Executed ${action} for user ${user_id}: PNL ${realizedPnl}, Fee ${fee}`);

      // Remove from memory
      positions = positions.filter(p => p.id !== id);

    } catch (err) {
      console.error('Error executing trade:', err);
    }
  }
}

// WebSocket connection
function connectWebSocket() {
  const ws = new WebSocket(BINANCE_WS_URL);

  ws.on('open', () => {
    console.log('Connected to Binance WebSocket');
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.stream === 'btcusdt@trade') {
        const currentPrice = parseFloat(message.data.p);
        // Check all positions
        positions.forEach(position => {
          checkAndExecute(position, currentPrice);
        });
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('close', () => {
    console.log('WebSocket closed, reconnecting...');
    setTimeout(connectWebSocket, 5000);
  });
}

// Main function
async function main() {
  console.log('Starting Liquidation Bot...');

  // Initial load
  await loadPositions();

  // Periodic reload every 30 seconds
  setInterval(loadPositions, 30000);

  // Connect to WebSocket
  connectWebSocket();
}

// Start the bot
main().catch(console.error);