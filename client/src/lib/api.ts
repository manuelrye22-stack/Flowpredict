import axios from 'axios'

// Railway server URL (fallback if env var not set)
const SERVER_URL = 'https://flowpredict-production.up.railway.app'

// Use env var if set, otherwise use server URL
let API_URL = process.env.NEXT_PUBLIC_API_URL || `${SERVER_URL}/api`

// Clean up API_URL: ensure it ends with /api
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1)
}
if (!API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`
}

console.log('API URL configured to:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})
  register: (data: { email: string; password: string; walletAddress: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const walletAPI = {
  getBalance: () => api.get('/wallet'),
  getDepositAddress: () => api.get('/wallet/deposit-address'),
  deposit: (data: { amount: number }) =>
    api.post('/wallet/deposit', data),
  linkDeposit: (data: { txHash: string }) =>
    api.post('/wallet/deposit/link', data),
  withdraw: (data: { amount: number; address: string }) =>
    api.post('/wallet/withdraw', data),
  faucet: () => api.post('/wallet/faucet'),
  getTransactions: () => api.get('/wallet/transactions'),
  getPendingWithdrawals: () => api.get('/wallet/withdrawals/pending'),
  processWithdrawal: (id: string, data: { action: string; txHash?: string; notes?: string }) =>
    api.post(`/wallet/withdrawals/${id}/process`, data),
  getAdminBalance: () => api.get('/wallet/admin/balance'),
}

export const betsAPI = {
  getAll: (params?: { category?: string; status?: string }) =>
    api.get('/bets', { params }),
  getById: (id: string) => api.get(`/bets/${id}`),
  create: (data: {
    topic: string
    category: string
    odds: number
    stake: number
    direction: 'YES' | 'NO'
    expiresAt?: string
  }) => api.post('/bets', data),
  accept: (id: string) => api.post(`/bets/${id}/accept`),
  leave: (id: string) => api.post(`/bets/${id}/leave`),
  resolve: (id: string, data: { winnerId: string; resolution: string }) =>
    api.post(`/bets/${id}/resolve`, data),
  dispute: (id: string, data: { reason: string }) =>
    api.post(`/bets/${id}/dispute`, data),
  getMyBets: () => api.get('/bets/my'),
}

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  subscribe: (data: { plan: string }) => api.post('/subscription', data),
}

export const ratingsAPI = {
  rate: (data: { betId: string; ratedId: string; rating: number; comment?: string }) =>
    api.post('/ratings', data),
  getReceived: () => api.get('/ratings/received'),
  getGiven: () => api.get('/ratings/given'),
}

export const verificationAPI = {
  setVerification: (betId: string, data: { sourceType: string; sourceUrl?: string; sourceValue?: string }) =>
    api.post(`/verification/bet/${betId}`, data),
  verify: (betId: string, data: { actualValue: string; winnerId: string }) =>
    api.post(`/verification/bet/${betId}/verify`, data),
  getStatus: (betId: string) => api.get(`/verification/bet/${betId}`),
  autoVerify: (betId: string) => api.post(`/verification/bet/${betId}/auto-verify`),
  consensusVote: (betId: string, outcome: string) =>
    api.post(`/verification/bet/${betId}/consensus-vote`, { outcome }),
}

export const commentsAPI = {
  getComments: (betId: string) => api.get(`/comments/${betId}`),
  addComment: (betId: string, data: { content: string }) =>
    api.post(`/comments/${betId}`, data),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
}

export default api