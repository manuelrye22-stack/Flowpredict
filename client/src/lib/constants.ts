// Exchange rates in Naira (NGN)
export const EXCHANGE_RATES = {
  USDT: 1550,    // USDT/NGN
  BTC: 155000000,  // BTC/NGN (rough estimate)
  LTC: 185000,    // LTC/NGN
}

// Convert crypto amount to Naira
export function toNaira(amount: number, crypto: 'USDT' | 'BTC' | 'LTC' = 'USDT'): number {
  return amount * EXCHANGE_RATES[crypto]
}

// Format Naira display
export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

// Crypto options for payment
export const CRYPTO_OPTIONS = [
  { id: 'USDT', name: 'USDT (TRC-20)', icon: '₮', rate: 1550 },
  { id: 'LTC', name: 'Litecoin (LTC)', icon: 'Ł', rate: 185000 },
]