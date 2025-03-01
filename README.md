# Nuonu - Artist Grant Platform

Nuonu is a platform that connects artists with grant opportunities and simplifies the application process using AI and blockchain technology.

## Features

- **Smart Sign-On**: Secure authentication using zkSync Smart Sign-On
- **Grant Discovery**: Find relevant grant opportunities with AI-powered matching
- **Auto-Apply**: Automatically generate and submit grant applications with AI
- **Multi-Chain Wallet**: Manage funds across multiple blockchains (Base, Optimism, zkSync)
- **Grant Distribution**: Receive and manage grant funds through smart contracts

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Supabase
- **Blockchain**: Base, Optimism, zkSync Era
- **AI**: OpenAI, Coinbase AgentKit

## Deployment to Vercel

### Prerequisites

- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) account

### Steps to Deploy

1. **Push your code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/nuonu.git
git push -u origin main
```

2. **Import your GitHub repository to Vercel**

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New" > "Project"
- Select your GitHub repository
- Configure the project:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: npm run build
  - Output Directory: .next

3. **Configure Environment Variables**

Add the following environment variables in the Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=your_vercel_deployment_url
```

4. **Deploy**

Click "Deploy" and wait for the build to complete.

## Local Development

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/nuonu.git
cd nuonu
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the required environment variables.

4. **Run the development server**

```bash
npm run dev
```

5. **Open in browser**

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Simulations

The platform includes several simulation components to demonstrate key functionality:

- **SimulatedZkSyncSSO**: Demonstrates the zkSync Smart Sign-On process
- **SimulatedTokenTransfer**: Shows how to send tokens across different chains
- **SimulatedGrantDistribution**: Demonstrates the grant award distribution process
- **SimulatedZkSyncInteraction**: Shows interaction with zkSync smart contracts
- **SimulatedAutoApply**: Demonstrates the AI-powered auto-apply feature

## License

MIT