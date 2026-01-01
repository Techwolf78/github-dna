// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Database-based rate limiting (production-ready)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(supabase: any, userId: string | null, ip: string): Promise<{ allowed: boolean; remaining: number; resetIn: number; tier: string }> {
  const now = Date.now();
  const identifier = userId || ip; // Use user ID if authenticated, otherwise IP

  // Define rate limits by user tier
  const RATE_LIMITS = {
    ANONYMOUS: { requests: 3, window: 60 * 60 * 1000 },     // 3/hour for anonymous
    FREE: { requests: 10, window: 60 * 60 * 1000 },         // 10/hour for free users
    PREMIUM: { requests: 50, window: 60 * 60 * 1000 },      // 50/hour for premium
    ADMIN: { requests: 1000, window: 60 * 60 * 1000 }       // 1000/hour for admins
  };

  try {
    // Get user tier from database
    let userTier = 'ANONYMOUS';
    if (userId) {
      try {
        const { data: userData, error } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('user_id', userId)
          .single();

        if (!error && userData) {
          userTier = userData.tier || 'FREE';
        } else {
          // If user_profiles table doesn't exist or user not found, default to FREE
          userTier = 'FREE';
        }
      } catch (profileError) {
        // If table doesn't exist or any other error, default to FREE
        userTier = 'FREE';
      }
    }

    const limit = RATE_LIMITS[userTier as keyof typeof RATE_LIMITS] || RATE_LIMITS.FREE;

    // Check database for rate limit record
    const { data: rateLimitData, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', 'github_analysis')
      .single();

    let currentCount = 0;
    let resetTime = now + limit.window;

    if (rateLimitData && !error) {
      // Existing record found
      if (now > rateLimitData.reset_time) {
        // Reset window has passed, reset counter
        currentCount = 1;
        resetTime = now + limit.window;

        // Update database
        await supabase
          .from('rate_limits')
          .update({
            count: currentCount,
            reset_time: resetTime,
            updated_at: new Date().toISOString()
          })
          .eq('identifier', identifier)
          .eq('action', 'github_analysis');
      } else {
        // Still in current window
        currentCount = rateLimitData.count + 1;
        resetTime = rateLimitData.reset_time;

        if (currentCount > limit.requests) {
          return {
            allowed: false,
            remaining: 0,
            resetIn: resetTime - now,
            tier: userTier
          };
        }

        // Update count
        await supabase
          .from('rate_limits')
          .update({
            count: currentCount,
            updated_at: new Date().toISOString()
          })
          .eq('identifier', identifier)
          .eq('action', 'github_analysis');
      }
    } else {
      // No existing record, create new one
      currentCount = 1;

      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          action: 'github_analysis',
          count: currentCount,
          reset_time: resetTime,
          tier: userTier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit.requests - currentCount),
      resetIn: resetTime - now,
      tier: userTier
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fallback to basic in-memory rate limiting
    return fallbackRateLimit(identifier);
  }
}

// Fallback rate limiting for errors
function fallbackRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number; tier: string } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // Conservative fallback

  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs, tier: 'FALLBACK' };
  }

  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: userLimit.resetTime - now, tier: 'FALLBACK' };
  }

  userLimit.count++;
  return { allowed: true, remaining: maxRequests - userLimit.count, resetIn: userLimit.resetTime - now, tier: 'FALLBACK' };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for auth validation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header (if authenticated)
    const authHeader = req.headers.get('authorization');
    let userId = null;

    console.log('🔐 Auth header present:', !!authHeader);
    console.log('🔐 Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('🔐 Token length:', token.length);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
          console.error('🔐 Auth error:', error);
          return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        userId = user?.id || null;
        console.log('🔐 Authenticated user ID:', userId);
      } catch (error) {
        console.error('🔐 Auth token validation failed:', error);
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log('🔐 No auth header or not Bearer token');
    }

    // Rate limiting check with user context
    const clientIP = req.headers.get('x-forwarded-for') ||
                    req.headers.get('x-real-ip') ||
                    'unknown';

    const rateLimit = await checkRateLimit(supabase, userId, clientIP);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: `Rate limit exceeded for ${rateLimit.tier} tier. Please try again later.`,
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
        tier: rateLimit.tier
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
          'X-RateLimit-Tier': rateLimit.tier,
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

    // Validate username format
    if (typeof username !== 'string' || username.length === 0 || username.length > 39) {
      return new Response(JSON.stringify({ error: 'Invalid username format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Analyzing ${username}`)

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
    console.log(`Fetching GitHub data for ${username}`)
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'User-Agent': 'GitHub-DNA-Analyzer/1.0'
      }
    })
    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        throw new Error('GitHub user not found. Please check the username and ensure the profile is public.')
      } else if (userResponse.status === 403) {
        // Capture rate limit reset time from GitHub headers
        const resetTime = userResponse.headers.get('x-ratelimit-reset');
        const resetTimestamp = resetTime ? parseInt(resetTime) * 1000 : null; // Convert to milliseconds
        const errorMessage = resetTimestamp 
          ? `RATE_LIMIT:${resetTimestamp}:Server is currently overloaded due to high traffic. GitHub API rate limit exceeded. Please wait until the timer expires and try again.`
          : 'Server is currently overloaded due to high traffic. GitHub API rate limit exceeded. Please wait a few minutes and try again.';
        throw new Error(errorMessage);
      } else {
        throw new Error(`GitHub API error: ${userResponse.status}`)
      }
    }
    const userData = await userResponse.json()

    // Validate user has basic profile data
    if (!userData.login || !userData.id || userData.type !== 'User') {
      throw new Error('Invalid GitHub user profile')
    }

    console.log(`GitHub user data for ${username}:`, {
      followers: userData.followers,
      public_repos: userData.public_repos,
      login: userData.login,
      id: userData.id
    })

    // Fetch user repositories
    console.log(`Fetching repositories for ${username}`)
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
      headers: {
        'User-Agent': 'GitHub-DNA-Analyzer/1.0'
      }
    })
    if (!reposResponse.ok) {
      if (reposResponse.status === 403) {
        // Capture rate limit reset time from GitHub headers
        const resetTime = reposResponse.headers.get('x-ratelimit-reset');
        const resetTimestamp = resetTime ? parseInt(resetTime) * 1000 : null; // Convert to milliseconds
        const errorMessage = resetTimestamp 
          ? `RATE_LIMIT:${resetTimestamp}:Server is currently overloaded due to high traffic. GitHub API rate limit exceeded. Please wait until the timer expires and try again.`
          : 'Server is currently overloaded due to high traffic. GitHub API rate limit exceeded. Please wait a few minutes and try again.';
        throw new Error(errorMessage);
      } else {
        throw new Error(`Failed to fetch repositories: ${reposResponse.status}`)
      }
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
    console.log(`Inserting user ${userData.login} into database with metrics:`, analysis.metrics)
    const { data, error } = await supabase
      .from('users')
      .insert({
        github_id: userData.id,
        username: userData.login,
        avatar_url: userData.avatar_url,
        dna_primary: analysis.primary,
        dna_secondary: analysis.secondary,
        score_breakdown: analysis.scores,
        raw_metrics: analysis.metrics,
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database insertion error:', error)
      throw error
    }

    console.log(`Successfully inserted user ${userData.login} with ID:`, data?.id)

    if (error) {
      console.error('Database insertion error:', error)
      // Check if it's a duplicate key error (user already exists)
      if (error.code === '23505') {
        // Try to fetch existing user instead
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('github_id', userData.id)
          .single()

        if (fetchError) {
          console.error('Error fetching existing user:', fetchError)
          throw new Error('Database error occurred')
        }

        return new Response(JSON.stringify({
          dna_primary: existingUser.dna_primary,
          dna_secondary: existingUser.dna_secondary,
          score_breakdown: existingUser.score_breakdown
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
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

  console.log(`Calculated metrics for ${userData.login}:`, {
    totalRepos: metrics.totalRepos,
    totalStars: metrics.totalStars,
    followers: metrics.followers,
    totalForks: metrics.totalForks
  })

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