import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, Play, Search, X, Check, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface Contestant {
  id: string;
  name: string;
  photo: string;
  videoUrl: string | null;
  storyTitle: string;
  category: string;
  votes: number;
}

const Voting = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [filteredContestants, setFilteredContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterMobile, setVoterMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [votedContestants, setVotedContestants] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [voteRestrictions, setVoteRestrictions] = useState<Map<string, { mobile: string; timestamp: number }>>(new Map());

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const fetchContestants = async () => {
      try {
        // Fetch registrations for this event
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select('id, first_name, last_name, story_title, category, yt_link, overall_votes')
          .eq('event_id', eventId);

        if (error) throw error;

        const contestantsData: Contestant[] = (registrations || []).map((reg) => ({
          id: reg.id,
          name: `${reg.first_name} ${reg.last_name}`,
          photo: `https://api.dicebear.com/8.x/initials/svg?seed=${reg.first_name}${reg.last_name}`,
          videoUrl: reg.yt_link || null,
          storyTitle: reg.story_title,
          category: reg.category,
          votes: reg.overall_votes || 0,
        }));

        // If we have less than 44, pad with placeholder contestants
        while (contestantsData.length < 44) {
          contestantsData.push({
            id: `placeholder-${contestantsData.length}`,
            name: `Contestant ${contestantsData.length + 1}`,
            photo: `https://api.dicebear.com/8.x/initials/svg?seed=Contestant${contestantsData.length + 1}`,
            videoUrl: null,
            storyTitle: 'Story Title',
            category: 'Fantasy',
            votes: 0,
          });
        }

        // Take only first 44
        const finalContestants = contestantsData.slice(0, 44);
        setContestants(finalContestants);
        setFilteredContestants(finalContestants);
      } catch (error) {
        console.error('Error fetching contestants:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contestants. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContestants();

    // Subscribe to vote changes
    const channel = supabase
      .channel('voting-contestants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${eventId}` },
        () => fetchContestants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, toast]);

  // Load vote restrictions from localStorage on mount
  useEffect(() => {
    const storedVotes = localStorage.getItem('public_votes');
    if (storedVotes) {
      try {
        const votes: Array<{ contestantId: string; mobile: string; timestamp: number }> = JSON.parse(storedVotes);
        const restrictions = new Map<string, { mobile: string; timestamp: number }>();
        
        votes.forEach((vote) => {
          const now = Date.now();
          const timeDiff = now - vote.timestamp;
          const hours24 = 24 * 60 * 60 * 1000;
          
          // Only keep restrictions that are still within 24 hours
          if (timeDiff < hours24) {
            restrictions.set(vote.contestantId, {
              mobile: vote.mobile,
              timestamp: vote.timestamp,
            });
          }
        });
        
        setVoteRestrictions(restrictions);
      } catch (e) {
        console.error('Error loading vote restrictions:', e);
      }
    }
  }, []);

  // Filter contestants based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContestants(contestants);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contestants.filter(
      (contestant) =>
        contestant.name.toLowerCase().includes(query) ||
        contestant.storyTitle.toLowerCase().includes(query) ||
        contestant.category.toLowerCase().includes(query)
    );
    setFilteredContestants(filtered);
  }, [searchQuery, contestants]);

  const handleContestantClick = (contestant: Contestant) => {
    setSelectedContestant(contestant);
    setIsModalOpen(true);
    setVoterName('');
    setVoterMobile('');
    setVoteSubmitted(false);
    
    // Check if this contestant was already voted for by this mobile number
    const restriction = voteRestrictions.get(contestant.id);
    if (restriction) {
      const now = Date.now();
      const timeDiff = now - restriction.timestamp;
      const hours24 = 24 * 60 * 60 * 1000;
      
      if (timeDiff < hours24) {
        setVoteSubmitted(true);
        // Load the mobile number that was used
        setVoterMobile(restriction.mobile);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContestant(null);
    setVoterName('');
    setVoterMobile('');
    setVoteSubmitted(false);
  };

  const checkVoteRestriction = async (contestantId: string, mobile: string): Promise<boolean> => {
    // Check localStorage first
    const storedVotes = localStorage.getItem('public_votes');
    if (storedVotes) {
      try {
        const votes: Array<{ contestantId: string; mobile: string; timestamp: number }> = JSON.parse(storedVotes);
        const recentVote = votes.find(
          (v) => v.contestantId === contestantId && v.mobile === mobile
        );
        
        if (recentVote) {
          const now = Date.now();
          const timeDiff = now - recentVote.timestamp;
          const hours24 = 24 * 60 * 60 * 1000;
          
          if (timeDiff < hours24) {
            return false; // Cannot vote, within 24 hours
          }
        }
      } catch (e) {
        console.error('Error parsing stored votes:', e);
      }
    }

    // Also check database for public votes (if we have a public_votes table)
    // For now, we'll use localStorage as primary source
    return true; // Can vote
  };

  const handleVote = async () => {
    if (!selectedContestant || !eventId || !voterName.trim() || !voterMobile.trim()) {
      toast({
        title: 'Please fill all fields',
        description: 'Name and mobile number are required.',
        variant: 'destructive',
      });
      return;
    }

    // Validate mobile number (should be 10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(voterMobile)) {
      toast({
        title: 'Invalid mobile number',
        description: 'Please enter a valid 10-digit mobile number.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check 24-hour restriction
      const canVote = await checkVoteRestriction(selectedContestant.id, voterMobile);
      
      if (!canVote) {
        toast({
          title: 'Vote Limit Reached',
          description: 'You can only vote once per contestant every 24 hours.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Store vote in localStorage
      const storedVotes = localStorage.getItem('public_votes');
      const votes: Array<{ contestantId: string; mobile: string; timestamp: number }> = storedVotes 
        ? JSON.parse(storedVotes) 
        : [];
      
      // Remove old votes for this contestant+mobile combination
      const filteredVotes = votes.filter(
        (v) => !(v.contestantId === selectedContestant.id && v.mobile === voterMobile)
      );
      
      // Add new vote
      filteredVotes.push({
        contestantId: selectedContestant.id,
        mobile: voterMobile,
        timestamp: Date.now(),
      });
      
      localStorage.setItem('public_votes', JSON.stringify(filteredVotes));

      // Store vote restriction in state
      setVoteRestrictions((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedContestant.id, {
          mobile: voterMobile,
          timestamp: Date.now(),
        });
        return newMap;
      });

      // Update contestant votes
      setContestants((prev) =>
        prev.map((c) =>
          c.id === selectedContestant.id ? { ...c, votes: c.votes + 1 } : c
        )
      );

      // Update filtered contestants too
      setFilteredContestants((prev) =>
        prev.map((c) =>
          c.id === selectedContestant.id ? { ...c, votes: c.votes + 1 } : c
        )
      );

      // Mark as voted
      setVotedContestants((prev) => new Set([...prev, selectedContestant.id]));

      // Show success
      setVoteSubmitted(true);

      toast({
        title: 'Vote Recorded! ✅',
        description: `Thank you for voting for ${selectedContestant.name}!`,
      });
    } catch (error) {
      console.error('Error recording vote:', error);
      toast({
        title: 'Vote Failed',
        description: 'Could not record your vote. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eventId) {
    return (
      <div className="pt-[104px] page-enter min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            No Event Selected
          </h1>
          <p className="text-muted-foreground mb-6">
            Please select an event to view contestants and vote.
          </p>
          <Button onClick={() => navigate('/events')} variant="hero">
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[104px] page-enter min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen bg-background">
      {/* Header */}
      <section className="pt-[104px] py-6 bg-gradient-warm relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        {/* Back Button - Left Corner */}
        <div className="container mx-auto px-4 relative z-10 mb-4">
          <button
            onClick={() => navigate('/events')}
            className="relative backdrop-blur-xl bg-[#DC143C] border border-[#DC143C]/30 rounded-xl p-3 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#DC143C]/90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-xl" />
            <ArrowLeft className="w-5 h-5 text-white relative z-10 group-hover:translate-x-[-2px] transition-transform" />
          </button>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Vote for Your <span className="text-gradient">Favorites</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            Click on any contestant to watch their story and cast your vote
          </p>
          {/* Search Box for Contestants */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contestants by name or story title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <span className="text-sm">✕</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contestants Grid - Bigg Boss Style */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredContestants.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No contestants found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
              {filteredContestants.map((contestant, index) => (
                <button
                  key={contestant.id}
                  data-contestant-id={contestant.id}
                  onClick={() => handleContestantClick(contestant)}
                  className={cn(
                    'group flex flex-col items-center space-y-3 cursor-pointer transition-all duration-300',
                    'hover:scale-105',
                    votedContestants.has(contestant.id) && 'ring-2 ring-primary rounded-2xl p-2'
                  )}
                >
                {/* Round Circle Profile */}
                <div className="relative">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={contestant.photo}
                      alt={contestant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Voted Badge */}
                  {votedContestants.has(contestant.id) && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md z-10">
                        <ThumbsUp className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                    <div className="w-10 h-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Name and Story Title Below */}
                <div className="text-center space-y-1 w-full">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {contestant.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {contestant.storyTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contestant.votes} votes
                  </p>
                </div>
              </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contestant Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          {selectedContestant && (
            <div className="space-y-6">
              {/* Header with Close Button */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {selectedContestant.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedContestant.storyTitle} • {selectedContestant.category}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Video Placeholder */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                {selectedContestant.videoUrl ? (
                  <iframe
                    src={selectedContestant.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Video Coming Soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Voter Details or Success Message */}
              {voteSubmitted ? (
                <div className="space-y-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  {/* Success Message */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Vote Submitted Successfully! ✅</h3>
                      <p className="text-sm text-muted-foreground">Your vote has been recorded.</p>
                    </div>
                  </div>
                  
                  {/* 24 Hour Wait Message */}
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">⏰ Wait 24 Hours</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You can vote for this contestant again after 24 hours from your last vote.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-6 bg-card rounded-xl border border-border">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                    Voter Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="voter-name">Name</Label>
                      <Input
                        id="voter-name"
                        type="text"
                        placeholder="Enter your name"
                        value={voterName}
                        onChange={(e) => setVoterName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="voter-mobile">Mobile Number</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
                          <span className="text-lg">🇮🇳</span>
                          <span className="text-sm font-medium">+91</span>
                        </div>
                        <Input
                          id="voter-mobile"
                          type="tel"
                          placeholder="Enter 10-digit mobile number"
                          value={voterMobile}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setVoterMobile(value);
                          }}
                          maxLength={10}
                          required
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="hero"
                      onClick={handleVote}
                      disabled={!voterName.trim() || !voterMobile.trim() || voterMobile.length !== 10 || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Vote
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Voting;
