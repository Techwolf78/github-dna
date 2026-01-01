# GitHub DNA 🧬

Discover your Developer Personality through GitHub Analysis

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/techwolf78/github-dna)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 What is GitHub DNA?

GitHub DNA analyzes your GitHub profile to reveal your developer personality! By examining your commit patterns, language preferences, repository activity, and coding style, we determine which developer archetype you belong to.

### 🏆 Developer Archetypes

- **🏗️ The Architect** - Strategic planners who design robust systems
- **🛠️ The Fixer** - Problem solvers who excel at debugging and maintenance
- **🏃‍♂️ The Sprinter** - Fast-paced developers who deliver quickly
- **🦉 The Night Owl** - Late-night coders who work best after dark
- **🔬 The Experimenter** - Innovative developers who love trying new things
- **🐺 The Lone Wolf** - Independent developers who prefer solo work
- **🚀 The Builder** - Ambitious developers who create large-scale projects

## 🚀 Features

- **🔍 Deep GitHub Analysis** - Comprehensive profile scanning
- **📊 Personality Scoring** - Multi-factor assessment algorithm
- **🏆 Public Leaderboard** - Compete with other developers
- **📱 Responsive Design** - Works on all devices
- **🎨 Beautiful UI** - Modern design with dark mode
- **⚡ Fast Performance** - Optimized for speed
- **🛡️ Rate Limiting** - Protected against abuse
- **📤 Social Sharing** - Share your results

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

---

## 🎨 Assets & Icons

### Required Favicon Files

Place these files in the `public/` directory:

- `github-dna-favicon.ico` (16x16, 32x32, 48x48)
- `github-dna-icon-16x16.png` (16x16px)
- `github-dna-icon-32x32.png` (32x32px)
- `github-dna-apple-touch-icon.png` (180x180px)
- `github-dna-android-chrome-192x192.png` (192x192px)
- `github-dna-android-chrome-512x512.png` (512x512px)
- `og-image.png` (1200x630px for social sharing)

### Icon Design Suggestions

- **Primary Color**: GitHub-inspired colors (#24292e, #0366d6)
- **DNA Theme**: Use DNA helix, GitHub logo, or developer symbols
- **Style**: Modern, clean, recognizable at small sizes

### Generate Icons Online

Use tools like:
- [Favicon.io](https://favicon.io/) - Convert images to favicons
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Professional favicon generator
- [Canva](https://www.canva.com/) - Design custom icons

Example command to generate from SVG:
```bash
# Using ImageMagick (if installed)
convert github-dna-logo.svg -resize 32x32 github-dna-icon-32x32.png
```
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
