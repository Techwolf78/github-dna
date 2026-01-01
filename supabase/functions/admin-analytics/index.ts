// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get total users analyzed
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total visits
    const { count: totalVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })

    // Get DNA distribution
    const { data: dnaData } = await supabase
      .from('users')
      .select('dna_primary')

    const dnaDistribution: Record<string, number> = {}
    dnaData?.forEach(user => {
      dnaDistribution[user.dna_primary] = (dnaDistribution[user.dna_primary] || 0) + 1
    })

    // Get daily analytics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyData } = await supabase
      .from('analytics_daily')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    // Get recent users (last 10)
    const { data: recentUsers } = await supabase
      .from('users')
      .select('username, avatar_url, dna_primary, analyzed_at')
      .order('analyzed_at', { ascending: false })
      .limit(10)

    const analytics = {
      totalUsers: totalUsers || 0,
      totalVisits: totalVisits || 0,
      dnaDistribution,
      dailyAnalytics: dailyData || [],
      recentUsers: recentUsers || []
    }

    return new Response(JSON.stringify(analytics), {
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