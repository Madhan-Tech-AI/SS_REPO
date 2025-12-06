import { useState, useEffect } from 'react';
import { Calendar, Trophy, FileText, Loader2, Eye, TrendingUp, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Registration {
  id: string;
  story_title: string;
  category: string;
  created_at: string;
  event_id: string | null;
  overall_votes: number;
  overall_views: number;
  events?: { name: string } | null;
}

interface UserStats {
  totalSubmissions: number;
  totalVotes: number;
  totalViews: number;
  registeredEvents: number;
  rank: number;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    totalVotes: 0,
    totalViews: 0,
    registeredEvents: 0,
    rank: 0,
  });
  const [submissions, setSubmissions] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all registrations (since we don't have user authentication)
        // In a real implementation, you might want to filter by email/phone stored in localStorage
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('id, story_title, category, created_at, event_id, overall_votes, overall_views, events:events!registrations_event_id_fkey(name)')
          .order('created_at', { ascending: false })
          .limit(10);

        if (regError) {
          console.error('Error fetching registrations:', regError);
          return;
        }

        setSubmissions(registrations || []);

        // Count unique registered events
        const uniqueEventIds = new Set(
          (registrations || [])
            .map(r => r.event_id)
            .filter((id): id is string => id !== null)
        );

        // Calculate total votes and views
        const totalVotes = (registrations || []).reduce((sum, r) => sum + (r.overall_votes || 0), 0);
        const totalViews = (registrations || []).reduce((sum, r) => sum + (r.overall_views || 0), 0);

        // Calculate rank based on total votes (simplified since we don't have user auth)
        let rank = 0;
        if (totalVotes > 0) {
          const { data: allRegistrations } = await supabase
            .from('registrations')
            .select('overall_votes')
            .order('overall_votes', { ascending: false });
          
          if (allRegistrations) {
            const allVotes = allRegistrations.map(r => r.overall_votes || 0);
            const uniqueVotes = [...new Set(allVotes)].sort((a, b) => b - a);
            rank = uniqueVotes.findIndex(v => v <= totalVotes) + 1;
          }
        }

        setStats({
          totalSubmissions: registrations?.length || 0,
          totalVotes,
          totalViews,
          registeredEvents: uniqueEventIds.size,
          rank: rank || 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscriptions
    const registrationsChannel = supabase
      .channel('user-registrations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const votesChannel = supabase
      .channel('user-votes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(registrationsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  const fetchAllRegistrations = async () => {
    setIsLoadingRegistrations(true);
    try {
      const { data: regData, error } = await supabase
        .from('registrations')
        .select('id, story_title, category, overall_votes, overall_views, created_at, event_id, events:events!registrations_event_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (!error && regData) {
        setAllRegistrations(regData || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  const handleOpenRegistrations = () => {
    setIsRegistrationsModalOpen(true);
    fetchAllRegistrations();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome */}
      <div className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Welcome to Story Seed Studio! 👋
        </h1>
        <p className="text-primary-foreground/80">
          Ready to share your next story with the world?
        </p>
      </div>

      {/* Stats with Glass-morphism */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Registered Events</p>
              <p className="text-3xl font-bold text-foreground font-display">{stats.registeredEvents}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 shadow-md">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Submissions</p>
              <p className="text-3xl font-bold text-foreground font-display">{stats.totalSubmissions}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-md">
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </div>
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Total Votes</p>
              <p className="text-3xl font-bold text-foreground font-display">{stats.totalVotes.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/10 shadow-md">
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
        </div>
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Total Views</p>
              <p className="text-3xl font-bold text-foreground font-display">{stats.totalViews.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 shadow-md">
              <span className="text-2xl">👁️</span>
            </div>
          </div>
        </div>
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Rank</p>
              <p className="text-3xl font-bold text-foreground font-display">{stats.rank > 0 ? `#${stats.rank}` : '-'}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-md">
              <span className="text-2xl">🏅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
        <div className="relative">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/events" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <span className="text-xl mr-3">🏆</span>
                <div className="text-left">
                  <div className="font-semibold">Explore & Vote</div>
                  <div className="text-xs text-muted-foreground">Stories</div>
                </div>
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => navigate('/events')}
            >
              <span className="text-xl mr-3">📅</span>
              <div className="text-left">
                <div className="font-semibold">Browse</div>
                <div className="text-xs text-muted-foreground">Events</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={handleOpenRegistrations}
            >
              <span className="text-xl mr-3">📝</span>
              <div className="text-left">
                <div className="font-semibold">View My</div>
                <div className="text-xs text-muted-foreground">Registrations</div>
              </div>
            </Button>
            <Link to="/leaderboard" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <span className="text-xl mr-3">📊</span>
                <div className="text-left">
                  <div className="font-semibold">View</div>
                  <div className="text-xs text-muted-foreground">Leaderboard</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* My Registrations */}
      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              My Registrations
            </h2>
            <button
              onClick={handleOpenRegistrations}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View All
            </button>
          </div>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No registrations yet. Start by registering for an event!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Event Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Story Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Votes</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Views</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 5).map((sub, index) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border/30 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-foreground">
                        {sub.events?.name || 'Unknown Event'}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-foreground">
                        {sub.story_title}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {sub.overall_votes || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {sub.overall_views || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* My Registrations Modal */}
      <Dialog open={isRegistrationsModalOpen} onOpenChange={setIsRegistrationsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">My Registrations</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRegistrationsModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingRegistrations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allRegistrations.length === 0 ? (
              <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  No Registrations Yet
                </h3>
                <p className="text-muted-foreground">
                  You haven't registered for any events yet. Start participating!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Event Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Story Title</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Votes</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Views</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="border-b border-border/30 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-foreground">
                          {reg.events?.name || 'Unknown Event'}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-foreground">
                          {reg.story_title}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {reg.overall_votes || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {reg.overall_views || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(reg.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
