// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const dnaTypes = {
  architect: { name: 'THE ARCHITECT', icon: '🏗️', color: '#8B5CF6' },
  fixer: { name: 'THE FIXER', icon: '🛠️', color: '#06B6D4' },
  sprinter: { name: 'THE SPRINTER', icon: '💨', color: '#F59E0B' },
  nightowl: { name: 'THE NIGHT OWL', icon: '🦉', color: '#3B82F6' },
  experimenter: { name: 'THE EXPERIMENTER', icon: '🔬', color: '#EC4899' },
  lonewolf: { name: 'THE LONE WOLF', icon: '🐺', color: '#8B5CF6' },
  builder: { name: 'THE BUILDER', icon: '🚀', color: '#06B6D4' }
}

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes for share cards
  const maxRequests = 10; // 10 share cards per 5 minutes

  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: userLimit.resetTime - now };
  }

  userLimit.count++;
  return { allowed: true, remaining: maxRequests - userLimit.count, resetIn: userLimit.resetTime - now };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') ||
                    req.headers.get('x-real-ip') ||
                    'unknown';

    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString()
        }
      });
    }

    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const primary = url.searchParams.get('primary')
    const secondary = url.searchParams.get('secondary')
    const baseUrl = url.searchParams.get('url') || 'https://github-dna.dev'

    if (!username || !primary || !secondary) {
      return new Response('Missing parameters', { status: 400, headers: corsHeaders })
    }

    const primaryDNA = dnaTypes[primary as keyof typeof dnaTypes]
    const secondaryDNA = dnaTypes[secondary as keyof typeof dnaTypes]

    if (!primaryDNA || !secondaryDNA) {
      return new Response('Invalid DNA types', { status: 400, headers: corsHeaders })
    }

    // Generate SVG
    const svg = generateShareCardSVG(username, primaryDNA, secondaryDNA, baseUrl)

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${username}-dna-card.svg"`
      }
    })
  } catch (error) {
    console.error('Error:', error.message)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})

function generateShareCardSVG(username: string, primary: any, secondary: any, baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dark background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F0F0F;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1A1A1A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0F0F0F;stop-opacity:1" />
    </linearGradient>

    <!-- Subtle accent gradient -->
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0.3" />
    </linearGradient>

    <!-- Card background -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.05" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.02" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="400" fill="url(#bg)" rx="12" />

  <!-- Subtle accent overlay -->
  <rect width="800" height="400" fill="url(#accent)" opacity="0.1" rx="12" />

  <!-- Decorative elements -->
  <circle cx="100" cy="80" r="40" fill="#8B5CF6" opacity="0.1" />
  <circle cx="700" cy="320" r="60" fill="#06B6D4" opacity="0.08" />

  <!-- Title -->
  <text x="400" y="50" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="28" font-weight="700" fill="white">
    GitHub DNA Analysis
  </text>

  <!-- Username -->
  <text x="400" y="85" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="20" font-weight="500" fill="#E5E5E5">
    @${username}
  </text>

  <!-- Primary DNA Card -->
  <g transform="translate(80, 120)">
    <rect width="300" height="200" rx="12" fill="url(#cardBg)" stroke="${primary.color}" stroke-width="1" opacity="0.8" />
    <circle cx="150" cy="60" r="30" fill="${primary.color}" opacity="0.15" />
    <text x="150" y="75" text-anchor="middle" font-size="36">${primary.icon}</text>
    <text x="150" y="105" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="12" font-weight="600" fill="#A3A3A3" letter-spacing="0.5px">
      PRIMARY DNA
    </text>
    <text x="150" y="135" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="18" font-weight="700" fill="white">
      ${primary.name}
    </text>
    <line x1="50" y1="155" x2="250" y2="155" stroke="${primary.color}" stroke-width="1" opacity="0.4" />
  </g>

  <!-- Secondary DNA Card -->
  <g transform="translate(420, 120)">
    <rect width="300" height="200" rx="12" fill="url(#cardBg)" stroke="${secondary.color}" stroke-width="1" opacity="0.8" />
    <circle cx="150" cy="60" r="30" fill="${secondary.color}" opacity="0.15" />
    <text x="150" y="75" text-anchor="middle" font-size="36">${secondary.icon}</text>
    <text x="150" y="105" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="12" font-weight="600" fill="#A3A3A3" letter-spacing="0.5px">
      SECONDARY DNA
    </text>
    <text x="150" y="135" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="18" font-weight="700" fill="white">
      ${secondary.name}
    </text>
    <line x1="50" y1="155" x2="250" y2="155" stroke="${secondary.color}" stroke-width="1" opacity="0.4" />
  </g>

  <!-- Footer -->
  <text x="400" y="360" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-size="14" fill="#737373">
    ${baseUrl.replace('https://', '')}
  </text>
  <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#525252">
    Discover your developer personality
  </text>
</svg>`
}