import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = 1 * 60 * 1000; // 1 minute for leaderboard
  const maxRequests = 30; // 30 requests per minute

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

    console.log('Leaderboard function called')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users with their raw metrics
    console.log('Fetching users with metrics...')
    const { data: users, error } = await supabase
      .from('users')
      .select('username, avatar_url, dna_primary, dna_secondary, raw_metrics, analyzed_at')
      .not('raw_metrics', 'is', null)
      .order('analyzed_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }

    console.log(`Found ${users?.length || 0} users with metrics`)

    // Filter out invalid users (those with no activity)
    const validUsers = users?.filter(user => {
      const metrics = user.raw_metrics as any
      return metrics &&
             (metrics.totalRepos > 0 ||
              metrics.totalStars > 0 ||
              metrics.followers > 0 ||
              metrics.totalForks > 0)
    }) || []

    console.log(`Valid users after filtering: ${validUsers.length}`)

    // Calculate scores for each user
    const leaderboard = validUsers.map(user => {
      const metrics = user.raw_metrics as any
      const score = calculateScore(metrics, user.dna_primary)

      return {
        username: user.username,
        avatar_url: user.avatar_url,
        dna_primary: user.dna_primary,
        dna_secondary: user.dna_secondary,
        score: Math.round(score),
        metrics: {
          repos: metrics?.totalRepos || 0,
          stars: metrics?.totalStars || 0,
          followers: metrics?.followers || 0
        },
        analyzed_at: user.analyzed_at
      }
    }).sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 50) // Top 50 users
    || []

    console.log('Leaderboard calculated:', leaderboard.length, 'users')

    return new Response(JSON.stringify({ leaderboard }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in leaderboard:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function calculateScore(metrics: any, dnaType: string): number {
  if (!metrics) return 0

  // Base metrics with weights
  const repoScore = (metrics.totalRepos || 0) * 10          // 10 points per repo
  const starScore = (metrics.totalStars || 0) * 5           // 5 points per star
  const followerScore = (metrics.followers || 0) * 20       // 20 points per follower
  const forkScore = (metrics.totalForks || 0) * 3           // 3 points per fork

  // Activity bonus (recent commits/updates)
  const activityBonus = (metrics.recentActivity || 0) * 15   // 15 points per recent activity

  // Quality metrics
  const readmeBonus = (metrics.hasReadme || 0) * 25         // 25 points for having README
  const licenseBonus = (metrics.hasLicense || 0) * 25       // 25 points for having license
  const languageBonus = (Object.keys(metrics.languages || {}).length) * 10 // 10 points per language

  // Size bonus (balanced repo sizes preferred)
  const avgSize = metrics.averageRepoSize || 0
  const sizeBonus = avgSize > 0 && avgSize < 100000 ? 50 : 0 // Bonus for reasonable repo sizes

  // DNA type bonuses (different personalities get different advantages)
  const dnaBonuses: Record<string, number> = {
    'architect': 1.2,    // Strategic thinkers get bonus
    'fixer': 1.1,        // Reliable maintainers get bonus
    'builder': 1.15,     // Builders get bonus for creating
    'experimenter': 1.05,// Experimenters get small bonus
    'sprinter': 0.95,    // Sprinters penalized for rushing
    'lonewolf': 0.9,     // Lone wolves penalized for isolation
    'nightowl': 1.0      // Neutral
  }

  const dnaMultiplier = dnaBonuses[dnaType] || 1.0

  // Calculate base score
  const baseScore = repoScore + starScore + followerScore + forkScore +
                   activityBonus + readmeBonus + licenseBonus + languageBonus + sizeBonus

  // Apply DNA multiplier
  const finalScore = baseScore * dnaMultiplier

  return Math.max(0, finalScore) // Ensure non-negative score
}