import dotenv from 'dotenv'
dotenv.config()

const { TronWeb } = require('tronweb')
import Withdrawal from '../models/Withdrawal.js'
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || ''
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || ''
const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY || ''

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
  headers: { 'TRON-PRO-API-KEY': TRONGRID_API_KEY },
})

let isProcessing = false

export async function startWithdrawalProcessor() {
  console.log('Starting auto-withdrawal processor...')
  
  if (!PLATFORM_WALLET) {
    console.log('PLATFORM_WALLET not configured - withdrawal processor disabled')
    return
  }

  if (!PRIVATE_KEY) {
    console.log('WALLET_PRIVATE_KEY not configured - withdrawal processor disabled')
    console.log('Add WALLET_PRIVATE_KEY to .env to enable auto-withdrawals')
    return
  }

  processWithdrawals()

  setInterval(async () => {
    try {
      await processWithdrawals()
    } catch (error) {
      console.error('Withdrawal processing error:', error)
    }
  }, 60000)
}

async function processWithdrawals() {
  if (isProcessing) {
    console.log('Withdrawal processing already in progress...')
    return
  }

  isProcessing = true

  try {
    const pendingWithdrawals = await Withdrawal.find({ status: 'pending' })

    if (pendingWithdrawals.length === 0) {
      return
    }

    console.log(`Found ${pendingWithdrawals.length} pending withdrawals`)

    for (const withdrawal of pendingWithdrawals) {
      await processWithdrawal(withdrawal)
    }
  } finally {
    isProcessing = false
  }
}

async function processWithdrawal(withdrawal: any) {
  try {
    if (withdrawal.address === PLATFORM_WALLET) {
      console.log(`Cannot transfer to platform wallet address`)
      withdrawal.status = 'failed'
      withdrawal.notes = 'Cannot transfer to platform address'
      await withdrawal.save()
      return
    }

    console.log(`Processing withdrawal: ${withdrawal.amount} USDT to ${withdrawal.address}`)

    const user = await User.findById(withdrawal.userId)
    if (!user) {
      console.log(`User not found for withdrawal ${withdrawal._id}`)
      withdrawal.status = 'failed'
      withdrawal.notes = 'User not found'
      await withdrawal.save()
      return
    }

    if (user.balance < withdrawal.amount) {
      console.log(`Insufficient balance for user ${user.email}`)
      withdrawal.status = 'failed'
      withdrawal.notes = 'Insufficient balance'
      await withdrawal.save()
      return
    }

    const toAddress = withdrawal.address
    const amount = Math.floor(withdrawal.amount * 1e6)

    const unsignedTxn = await tronWeb.transactionBuilder.sendToken(
      toAddress,
      amount,
      USDT_CONTRACT,
      PLATFORM_WALLET
    )

    const signedTxn = await tronWeb.trx.sign(unsignedTxn, PRIVATE_KEY)
    const result = await tronWeb.trx.send(signedTxn)

    if (result.result) {
      const txHash = result.txid

      user.balance -= withdrawal.amount
      await user.save()

      withdrawal.status = 'approved'
      withdrawal.txHash = txHash
      withdrawal.processedAt = new Date()
      await withdrawal.save()

      await Transaction.findOneAndUpdate(
        { userId: withdrawal.userId, type: 'withdraw', status: 'pending' },
        { status: 'completed', txHash: txHash }
      )

      console.log(`Withdrawal approved! TX: ${txHash}`)
    } else {
      console.log(`Withdrawal failed: ${result.code || 'Unknown error'}`)
      withdrawal.status = 'failed'
      withdrawal.notes = result.code || 'Transaction failed'
      await withdrawal.save()
    }
  } catch (error: any) {
    console.error(`Error processing withdrawal ${withdrawal._id}:`, error.message)
    withdrawal.status = 'failed'
    withdrawal.notes = error.message || 'Processing error'
    await withdrawal.save()
  }
}

export async function getWalletBalance(): Promise<number> {
  try {
    const balance = await tronWeb.trx.getBalance(PLATFORM_WALLET)
    const sunBalance = balance || 0
    return sunBalance / 1e6
  } catch (error) {
    console.error('Error getting wallet balance:', error)
    return 0
  }
}

export async function getUSDTBalance(): Promise<number> {
  try {
    const contract = await tronWeb.contract().at(USDT_CONTRACT)
    const balance = await contract.methods.balanceOf(PLATFORM_WALLET).call()
    return parseFloat(balance.toString()) / 1e6
  } catch (error) {
    console.error('Error getting USDT balance:', error)
    return 0
  }
}