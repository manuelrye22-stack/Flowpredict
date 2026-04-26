import dotenv from 'dotenv'
dotenv.config()

import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import Deposit from '../models/Deposit.js'

const TRONGRID_API = 'https://api.trongrid.io'
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || 'TDPxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY || ''

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

let lastCheckedTimestamp = Date.now()
let isRunning = false

export async function startDepositWatcher() {
  if (isRunning) {
    console.log('Deposit watcher already running')
    return
  }
  
  isRunning = true
  console.log('Starting TronGrid deposit watcher...')
  console.log(`Platform wallet: ${PLATFORM_WALLET}`)
  console.log(`API key configured: ${TRONGRID_API_KEY ? 'Yes' : 'No (will use public API)'}`)
  
  checkDeposits()
  
  setInterval(async () => {
    try {
      await checkDeposits()
    } catch (error) {
      console.error('Deposit check error:', error)
    }
  }, 30000)
}

async function checkDeposits() {
  if (!TRONGRID_API_KEY) {
    console.log('No TronGrid API key - skipping deposit check')
    return
  }

  try {
    const now = Date.now()
    const minTimestamp = Math.max(lastCheckedTimestamp - 60000, now - 300000)
    
    const url = new URL(`${TRONGRID_API}/v1/accounts/${PLATFORM_WALLET}/transactions`)
    url.searchParams.set('only_confirmed', 'true')
    url.searchParams.set('min_timestamp', minTimestamp.toString())
    url.searchParams.set('limit', '200')
    
    const response = await fetch(url.toString(), {
      headers: {
        'TRON-PRO-API-KEY': TRONGRID_API_KEY,
      },
    })
    
    if (!response.ok) {
      console.error(`TronGrid API error: ${response.status}`)
      return
    }
    
    const data = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      return
    }
    
    let newDeposits = 0
    let creditedAmount = 0
    
    for (const tx of data.data) {
      if (tx.token_transfers && Array.isArray(tx.token_transfers)) {
        for (const transfer of tx.token_transfers) {
          if (transfer.token_info?.address?.toLowerCase() === USDT_CONTRACT.toLowerCase()) {
            const txHash = tx.tx_id
            const amount = parseFloat(transfer.amount) / 1e6
            const fromAddress = transfer.from
            const toAddress = transfer.to
            const blockNumber = tx.block_number
            
            if (toAddress === PLATFORM_WALLET && amount > 0) {
              const existing = await Deposit.findOne({ txHash })
              
              if (!existing) {
                const deposit = await Deposit.create({
                  txHash,
                  fromAddress,
                  toAddress,
                  amount,
                  blockNumber,
                  status: 'pending',
                  confirmed: true,
                })
                
                console.log(`New deposit detected: ${amount} USDT from ${fromAddress}`)
                newDeposits++
              }
            }
          }
        }
      }
    }
    
    lastCheckedTimestamp = now
    
    if (newDeposits > 0) {
      console.log(`Found ${newDeposits} new deposits`)
      await creditPendingDeposits()
    }
  } catch (error) {
    console.error('Error checking deposits:', error)
  }
}

async function creditPendingDeposits() {
  try {
    const pendingDeposits = await Deposit.find({
      status: 'pending',
      confirmed: true,
    })
    
    for (const deposit of pendingDeposits) {
      const user = await User.findOne({ walletAddress: deposit.fromAddress })
      
      if (user) {
        user.balance += deposit.amount
        await user.save()
        
        deposit.status = 'credited'
        deposit.userId = user._id
        deposit.creditedAt = new Date()
        await deposit.save()
        
        await Transaction.create({
          userId: user._id,
          type: 'deposit',
          amount: deposit.amount,
          status: 'completed',
          txHash: deposit.txHash,
          description: `Auto-deposit from TronGrid: ${deposit.amount} USDT`,
        })
        
        console.log(`Credited ${deposit.amount} USDT to user ${user.email}`)
      } else {
        console.log(`No user found for address ${deposit.fromAddress} - deposit requires manual linking`)
      }
    }
  } catch (error) {
    console.error('Error crediting deposits:', error)
  }
}

export async function getDepositAddress(email: string) {
  const wallet = await User.findOne({ email })
  
  if (!wallet) {
    return null
  }
  
  if (!wallet.walletAddress) {
    wallet.walletAddress = `T${generateTronAddress()}`
    await wallet.save()
  }
  
  return wallet.walletAddress
}

function generateTronAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 33; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function linkDepositToUser(txHash: string, email: string) {
  const deposit = await Deposit.findOne({ txHash })
  const user = await User.findOne({ email })
  
  if (!deposit || !user) {
    return false
  }
  
  if (deposit.status === 'credited') {
    return false
  }
  
  user.balance += deposit.amount
  await user.save()
  
  deposit.status = 'credited'
  deposit.userId = user._id
  deposit.creditedAt = new Date()
  await deposit.save()
  
  await Transaction.create({
    userId: user._id,
    type: 'deposit',
    amount: deposit.amount,
    status: 'completed',
    txHash: deposit.txHash,
    description: `Deposit linked manually: ${deposit.amount} USDT`,
  })
  
  return true
}