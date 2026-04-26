# FlowPredict - P2P Crypto Prediction Market

A peer-to-peer crypto prediction market platform where users create and accept bets on sports, crypto, and custom topics.

## Features

- ✅ Create custom predictions/bets
- ✅ Browse and accept open bets
- ✅ USDT wallet system with auto-deposit detection
- ✅ Pro subscription for high-stakes bets (> ₦30,000)
- ✅ Nigerian-focused design (Naira display, local UX)
- ✅ No platform cut from bets - subscription only

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

### Backend
- Node.js + Express
- MongoDB
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
cd C:\Websitebet
```

2. Install frontend dependencies
```bash
cd client
npm install
```

3. Install backend dependencies
```bash
cd ../server
npm install
```

4. Configure environment
```bash
cd ../server
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

### Running Locally

1. Start MongoDB (if local)
```bash
mongod
```

2. Start backend (in server folder)
```bash
npm run dev
```

3. Start frontend (in client folder)
```bash
npm run dev
```

4. Open http://localhost:3000

## API Endpoints

### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- GET /api/auth/me - Get current user

### Wallet
- GET /api/wallet - Get balance
- POST /api/wallet/deposit - Deposit USDT
- POST /api/wallet/withdraw - Withdraw USDT

### Bets
- GET /api/bets - List open bets
- POST /api/bets - Create new bet
- GET /api/bets/:id - Get bet details
- POST /api/bets/:id/accept - Accept a bet
- POST /api/bets/:id/resolve - Resolve bet (admin)
- POST /api/bets/:id/dispute - Raise dispute

### Users
- GET /api/users/profile - Get profile
- POST /api/subscription - Subscribe to Pro

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | ₦0/mo | Bets under ₦30,000 |
| Pro | ₦2,000/mo | Unlimited stakes + analytics |

## Configuration

### Environment Variables (Server)
```
MONGODB_URI=mongodb://localhost:27017/flowpredict
JWT_SECRET=your_secret_key
PORT=3001
CLIENT_URL=http://localhost:3000
WALLET_ADDRESS=your_usdt_trc20_address
```

### Environment Variables (Client)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Database (MongoDB Atlas)
1. Create free cluster
2. Get connection string
3. Add to environment variables

## License

MIT

## Disclaimer

This platform is for educational purposes. Users are responsible for complying with their local laws regarding online predictions and gambling.