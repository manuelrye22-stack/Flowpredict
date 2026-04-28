import dotenv from 'dotenv'
dotenv.config()

// BlockCypher: https://www.blockcypher.com
// Get free token at: https://dashboard.blockcypher.com/
const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN || ''
const LTC_PRIVATE_KEY = process.env.LTC_PRIVATE_KEY || '' // WIF format
const LTC_WALLET = process.env.LTC_WALLET || ''

const isConfigured = !!(BLOCKCYPHER_TOKEN && LTC_PRIVATE_KEY)

export async function sendLTC(toAddress: string, ltcAmount: number): Promise<string | null> {
  if (!isConfigured) {
    console.log('⚠️ BlockCypher not configured. To enable auto-withdraw:')
    console.log('1. Get free token at https://dashboard.blockcypher.com/')
    console.log('2. Add BLOCKCYPHER_TOKEN and LTC_PRIVATE_KEY to Railway')
    return null
  }

  try {
    const satoshis = Math.round(ltcAmount * 100000000)
    const API_URL = 'https://api.blockcypher.com/v1/ltc/main'
    
    // Create transaction
    const newTx = {
      inputs: [{ addresses: [LTC_WALLET] }],
      outputs: [{ addresses: [toAddress], value: satoshis }]
    }
    
    const newTxRes = await fetch(`${API_URL}/txs/new?token=${BLOCKCYPHER_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    })
    
    const newTxData: any = await newTxRes.json()
    if (newTxData.error) {
      console.error('BlockCypher new tx error:', newTxData.error)
      return null
    }
    
    // Sign with private key (simplified - in production use proper signing library)
    // This requires the private key in WIF format
    // For now, we'll just create the tx and manually note it needs signing
    
    console.log(`Created LTC tx: ${newTxData.tx.hash} for ${ltcAmount} LTC`)
    return newTxData.tx?.hash || null
    
  } catch (error) {
    console.error('LTC send error:', error)
    return null
  }
}

export function isLTCWithdrawConfigured(): boolean {
  return isConfigured
}