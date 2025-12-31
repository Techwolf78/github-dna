import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 20; // 20 requests per 15 minutes

  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
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

    const { username } = await req.json()

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Analyzing ${username}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already analyzed
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (existingUser) {
      console.log(`User ${username} already analyzed`)
      return new Response(JSON.stringify({
        dna_primary: existingUser.dna_primary,
        dna_secondary: existingUser.dna_secondary,
        score_breakdown: existingUser.score_breakdown
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch GitHub user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`)
    if (!userResponse.ok) {
      throw new Error('GitHub user not found or has no public profile')
    }
    const userData = await userResponse.json()

    // Validate user has basic profile data
    if (!userData.login || !userData.id || userData.type !== 'User') {
      throw new Error('Invalid GitHub user profile')
    }

    // Fetch user repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories')
    }
    const repos = await reposResponse.json()

    // Validate that repos is an array and user has at least some activity
    if (!Array.isArray(repos)) {
      throw new Error('Invalid repository data from GitHub')
    }

    console.log(`Analyzing ${repos.length} public repositories for ${username}`)

    // Additional validation: user should have some minimum activity
    if (repos.length === 0 && userData.followers === 0 && userData.public_repos === 0) {
      throw new Error('User has no public repositories or activity. Please ensure the profile is public and has content.')
    }

    // Analyze repositories
    const analysis = analyzeRepositories(repos, userData)

    // Insert into database
    const { data, error } = await supabase
      .from('users')
      .insert({
        github_id: userData.id,
        username: userData.login,
        avatar_url: userData.avatar_url,
        dna_primary: analysis.primary,
        dna_secondary: analysis.secondary,
        score_breakdown: analysis.scores,
        raw_metrics: analysis.metrics
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(JSON.stringify({
      dna_primary: data.dna_primary,
      dna_secondary: data.dna_secondary,
      score_breakdown: data.score_breakdown
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function analyzeRepositories(repos: any[], userData: any) {
  // Calculate metrics
  const metrics = {
    totalRepos: repos.length,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
    followers: userData.followers || 0,
    languages: {} as Record<string, number>,
    recentActivity: 0,
    averageRepoSize: 0,
    hasReadme: 0,
    hasLicense: 0,
    isFork: 0,
    createdRecently: 0
  }

  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)

  repos.forEach(repo => {
    // Languages
    if (repo.language) {
      metrics.languages[repo.language] = (metrics.languages[repo.language] || 0) + 1
    }

    // Recent activity
    const updatedAt = new Date(repo.updated_at)
    if (updatedAt > sixMonthsAgo) {
      metrics.recentActivity++
    }

    // Repo size
    metrics.averageRepoSize += repo.size

    // Has readme
    if (repo.has_readme) metrics.hasReadme++

    // Has license
    if (repo.license) metrics.hasLicense++

    // Is fork
    if (repo.fork) metrics.isFork++

    // Created recently
    const createdAt = new Date(repo.created_at)
    if (createdAt > sixMonthsAgo) metrics.createdRecently++
  })

  metrics.averageRepoSize /= repos.length || 1

  // Calculate DNA scores
  const scores = {
    architect: 0,
    fixer: 0,
    sprinter: 0,
    nightowl: 0,
    experimenter: 0,
    lonewolf: 0,
    builder: 0
  }

  // Architect: High stars, many repos, diverse languages
  scores.architect = (metrics.totalStars * 0.3) + (metrics.totalRepos * 0.2) + (Object.keys(metrics.languages).length * 0.5)

  // Fixer: High forks, recent activity
  scores.fixer = (metrics.totalForks * 0.4) + (metrics.recentActivity * 0.6)

  // Sprinter: Many repos created recently, small repos
  scores.sprinter = (metrics.createdRecently * 0.5) + ((10000 - metrics.averageRepoSize) * 0.0001) + (metrics.totalRepos * 0.3)

  // Nightowl: Consistent activity patterns (simplified)
  scores.nightowl = metrics.recentActivity * 0.5

  // Experimenter: Diverse languages, many repos
  scores.experimenter = (Object.keys(metrics.languages).length * 0.6) + (metrics.totalRepos * 0.4)

  // Lonewolf: Few repos, high quality (stars per repo)
  const avgStars = metrics.totalStars / (metrics.totalRepos || 1)
  scores.lonewolf = (avgStars * 0.7) + ((10 - metrics.totalRepos) * 0.3)

  // Builder: Large repos, has license/readme
  scores.builder = (metrics.averageRepoSize * 0.0001) + (metrics.hasReadme * 0.3) + (metrics.hasLicense * 0.3)

  // Normalize scores
  const maxScore = Math.max(...Object.values(scores))
  Object.keys(scores).forEach(key => {
    scores[key as keyof typeof scores] = Math.round((scores[key as keyof typeof scores] / maxScore) * 100)
  })

  // Determine primary and secondary
  const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a)
  const primary = sorted[0][0] as keyof typeof scores
  const secondary = sorted[1][0] as keyof typeof scores

  return {
    primary,
    secondary,
    scores,
    metrics
  }
}