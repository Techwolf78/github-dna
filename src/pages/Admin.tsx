import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Eye, 
  Share2, 
  BarChart3,
  Loader2,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsData {
  totalUsers: number;
  totalVisits: number;
  dnaDistribution: Record<string, number>;
  dailyAnalytics: Array<{
    date: string;
    users_analyzed_count: number;
    visits_count: number;
  }>;
  recentUsers: Array<{
    username: string;
    avatar_url: string;
    dna_primary: string;
    analyzed_at: string;
  }>;
}

const DNA_LABELS: Record<string, { name: string; icon: string }> = {
  architect: { name: 'Architect', icon: '🧠' },
  fixer: { name: 'Fixer', icon: '🔧' },
  sprinter: { name: 'Sprinter', icon: '⚡' },
  nightowl: { name: 'Night Owl', icon: '🌙' },
  experimenter: { name: 'Experimenter', icon: '🧪' },
  lonewolf: { name: 'Lone Wolf', icon: '🐺' },
  builder: { name: 'Builder', icon: '🚀' }
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  console.log('🏗️ Admin component rendered')
  console.log('Initial state - user:', user, 'isAdmin:', isAdmin, 'authLoading:', authLoading, 'loading:', loading)

  useEffect(() => {
    console.log('🔐 Auth effect triggered')
    console.log('authLoading:', authLoading)
    console.log('user:', user)
    if (!authLoading && !user) {
      console.log('🚪 No user, redirecting to auth')
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    console.log('📊 Data effect triggered')
    console.log('user:', user)
    console.log('isAdmin:', isAdmin)
    if (user && isAdmin) {
      console.log('👑 User is admin, fetching analytics')
      fetchAnalytics();
    } else {
      console.log('❌ User not admin or no user')
    }
  }, [user, isAdmin]);

  const fetchAnalytics = async () => {
    console.log('🔄 Starting fetchAnalytics...')
    setLoading(true);
    try {
      console.log('📋 Getting session...')
      const { data: session } = await supabase.auth.getSession();
      console.log('Session data:', session)

      if (!session?.session?.access_token) {
        console.error('❌ No session or access token')
        throw new Error('No session');
      }

      console.log('✅ Got access token, making request to admin-analytics...')
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics`,
        {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          }
        }
      );

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error('❌ Response not ok')
        const error = await response.json();
        console.error('Error response:', error)
        throw new Error(error.error || 'Failed to fetch analytics');
      }

      console.log('✅ Response ok, parsing JSON...')
      const analyticsData = await response.json();
      console.log('📊 Analytics data received:', analyticsData)
      setData(analyticsData);
      console.log('✅ Data set successfully')
    } catch (err) {
      console.error('💥 Error in fetchAnalytics:', err);
      toast.error('Failed to load analytics');
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin access. Contact the administrator to get access.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back Home
          </Button>
        </div>
      </div>
    );
  }

  const distributionData = data 
    ? Object.entries(data.dnaDistribution).map(([key, value]) => ({
        name: DNA_LABELS[key]?.icon || key,
        fullName: DNA_LABELS[key]?.name || key,
        count: value
      }))
    : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users Analyzed
                  </CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.totalUsers}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Page Views
                  </CardTitle>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.totalVisits}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    DNA Types
                  </CardTitle>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Object.keys(data.dnaDistribution).length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* DNA Distribution */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>DNA Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                          formatter={(value, name, props) => [value, props.payload.fullName]}
                        />
                        <Bar dataKey="count" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Analytics */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Daily Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.dailyAnalytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.dailyAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#888"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="users_analyzed_count" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          name="Users Analyzed"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Users */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentUsers.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentUsers.map((user, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <img 
                          src={user.avatar_url} 
                          alt={user.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">@{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.analyzed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {DNA_LABELS[user.dna_primary]?.icon}
                          </span>
                          <span className="text-sm font-medium">
                            {DNA_LABELS[user.dna_primary]?.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No users analyzed yet
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            Failed to load data
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
