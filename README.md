# 2025 Coding DNA 🧬

Unlock Your Future Developer Personality for the AI Era

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/techwolf78/github-dna)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 What is 2025 Coding DNA?

2025 Coding DNA analyzes your GitHub profile to reveal the developer you'll become in the AI era! By examining your commit patterns, language preferences, repository activity, and coding style, we decode your 2025 developer personality and show how you'll evolve for the future of coding.

### 🏆 2025 Developer Personalities

### 🏆 2025 Developer Personalities

- **🏗️ The Architect** - Strategic planners designing AI-integrated systems
- **🛠️ The Fixer** - Problem solvers adapting to automated debugging
- **🏃‍♂️ The Sprinter** - Fast-paced developers leveraging AI tools
- **🦉 The Night Owl** - Late-night coders thriving in the 24/7 AI economy
- **🔬 The Experimenter** - Innovative developers pioneering AI-assisted coding
- **🐺 The Lone Wolf** - Independent developers mastering human-AI collaboration
- **🚀 The Builder** - Ambitious developers creating AI-powered applications

## 🚀 Features

- **🔍 AI-Powered Analysis** - Future-focused GitHub scanning
- **📊 2025 Personality Scoring** - Multi-factor assessment for the AI era
- **🏆 Top 2025 Personalities** - Compete with future-ready developers
- **📱 Responsive Design** - Works on all devices
- **🎨 Beautiful UI** - Modern design with dark mode
- **⚡ Fast Performance** - Optimized for speed
- **🛡️ Rate Limiting** - Protected against abuse
- **📤 Social Sharing** - Share your 2025 developer evolution

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase Edge Functions
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- GitHub account (optional, for higher API limits)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/techwolf78/github-dna.git
cd github-dna
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 4. Start development server
```bash
npm run dev
```

Visit `http://localhost:8080` to see your app!

## 🏗️ Supabase Setup

### 1. Create a new Supabase project
```bash
npx supabase init
```

### 2. Link your project
```bash
npx supabase link --project-ref your-project-ref
```

### 3. Deploy database schema
```bash
npx supabase db push
```

### 4. Deploy Edge Functions
```bash
npx supabase functions deploy analyze-github
npx supabase functions deploy get-leaderboard
npx supabase functions deploy generate-share-card
```

## 📦 Build & Deployment

### Local Build
```bash
npm run build
npm run preview
```

### Deploy to Vercel

1. **Connect Repository**
   - Push your code to GitHub
   - Connect your repo to Vercel

2. **Environment Variables**
   Add these in Vercel project settings:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```

3. **Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: dist

4. **Deploy**
   ```bash
   git push origin main
   ```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── data/            # Static data and types
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
└── integrations/    # External service integrations

supabase/
├── functions/       # Edge Functions
└── migrations/      # Database migrations

public/              # Static assets
```

## 🛡️ Security & Rate Limiting

- **Frontend**: Progressive cooldowns (30s → 60s → 120s)
- **Backend**: IP-based rate limiting per endpoint
- **Validation**: Comprehensive input sanitization
- **Spam Protection**: Pattern-based username filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the amazing backend platform
- [Vercel](https://vercel.com/) for seamless deployment
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
