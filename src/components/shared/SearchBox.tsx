import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Calendar, User, Trophy, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: 'event' | 'user' | 'contestant';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  eventId?: string;
}

interface SearchBoxProps {
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  placeholder?: string;
}

export const SearchBox = ({ onResultClick, className, placeholder = "Search events, users..." }: SearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const isVotingPage = location.pathname.startsWith('/voting');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const search = async () => {
      setLoading(true);
      setIsOpen(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search Events
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, name, description, banner_image')
          .eq('is_active', true)
          .ilike('name', `%${query}%`)
          .limit(5);

        if (!eventsError && events) {
          events.forEach((event) => {
            searchResults.push({
              type: 'event',
              id: event.id,
              title: event.name,
              subtitle: event.description || undefined,
              image: event.banner_image || undefined,
            });
          });
        }

        // Search Users/Contestants from Registrations
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('id, first_name, last_name, story_title, event_id, events(name)')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,story_title.ilike.%${query}%`)
          .limit(10);

        if (!regError && registrations) {
          registrations.forEach((reg) => {
            const fullName = `${reg.first_name} ${reg.last_name}`;
            const eventName = reg.events && typeof reg.events === 'object' && 'name' in reg.events 
              ? (reg.events as { name: string }).name 
              : undefined;

            searchResults.push({
              type: 'contestant',
              id: reg.id,
              title: fullName,
              subtitle: reg.story_title || eventName,
              eventId: reg.event_id,
            });
          });
        }

        // If on voting page, also filter by current event
        if (isVotingPage) {
          const eventId = location.pathname.split('/voting/')[1];
          if (eventId) {
            const { data: votingRegistrations, error: votingError } = await supabase
              .from('registrations')
              .select('id, first_name, last_name, story_title, event_id')
              .eq('event_id', eventId)
              .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,story_title.ilike.%${query}%`)
              .limit(10);

            if (!votingError && votingRegistrations) {
              // Add voting-specific results
              votingRegistrations.forEach((reg) => {
                const fullName = `${reg.first_name} ${reg.last_name}`;
                if (!searchResults.find(r => r.id === reg.id && r.type === 'contestant')) {
                  searchResults.push({
                    type: 'contestant',
                    id: reg.id,
                    title: fullName,
                    subtitle: reg.story_title,
                    eventId: reg.event_id,
                  });
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
        setResults(searchResults);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isVotingPage, location.pathname]);

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      if (result.type === 'event') {
        navigate(`/events`);
        // Scroll to event or navigate to event details
        setTimeout(() => {
          const eventElement = document.querySelector(`[data-event-id="${result.id}"]`);
          if (eventElement) {
            eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (result.type === 'contestant' || result.type === 'user') {
        if (isVotingPage && result.eventId) {
          // On voting page, scroll to contestant
          const contestantElement = document.querySelector(`[data-contestant-id="${result.id}"]`);
          if (contestantElement) {
            contestantElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the contestant
            contestantElement.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
              contestantElement.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
            }, 2000);
          }
        } else if (result.eventId) {
          // Navigate to voting page for that event
          navigate(`/voting/${result.eventId}`);
        }
      }
    }
    setQuery('');
    setIsOpen(false);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'contestant':
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-8 h-9"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 capitalize">{result.type}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

