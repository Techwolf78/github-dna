// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    req.headers.get('x-real-ip') ||
                    req.headers.get('cf-connecting-ip') ||
                    'unknown';

    // Hash the IP for privacy
    const ipHash = await hashIP(clientIP);

    // Get request body for additional data
    const { path = '/', userAgent, referrer } = await req.json().catch(() => ({}));

    // Check if this IP has visited in the last hour (to prevent spam)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentVisits, error: checkError } = await supabase
      .from('visits')
      .select('id')
      .eq('ip_hash', ipHash)
      .eq('path', path)
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (checkError) {
      console.error('Error checking recent visits:', checkError);
    }

    // If no recent visit from this IP, insert new visit
    if (!recentVisits || recentVisits.length === 0) {
      const { error: insertError } = await supabase
        .from('visits')
        .insert({
          path,
          ip_hash: ipHash,
          user_agent: userAgent || req.headers.get('user-agent'),
          referrer: referrer || req.headers.get('referer'),
        });

      if (insertError) {
        console.error('Error inserting visit:', insertError);
        // Continue anyway to return count
      }
    }

    // Get total visit count
    const { count, error: countError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('path', '/');

    if (countError) {
      console.error('Error getting visit count:', countError);
      return new Response(JSON.stringify({ error: 'Failed to get visit count' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ visitCount: count || 0 }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in track-visit function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
});