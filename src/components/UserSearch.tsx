import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import FriendRequestButton from "@/components/FriendRequestButton";
import { useFriendshipStatus } from "@/hooks/useFriendshipStatus";

interface UserStats {
  followers_count: number;
  following_count: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  isFollowing?: boolean;
  followers_count: number;
  following_count: number;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}
function UserCard({ user, currentUserId }: { user: UserProfile; currentUserId: string }) {
  const { status, refreshStatus } = useFriendshipStatus(currentUserId, user.id);
  const navigate = useNavigate();

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-12 w-12">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.name || "User"} />
          ) : (
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <button
            onClick={() => handleViewProfile(user.id)}
            className="text-left hover:underline"
          >
            <h3 className="font-medium text-amber-200 truncate">
              {user.name || "Anonymous User"}
            </h3>
          </button>
          <div className="flex items-center gap-4 text-xs text-amber-100/70 mt-1">
            <span className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded">
              <Users size={12} />
              {user.followers_count || 0} followers
            </span>
            <span className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded">
              {user.following_count || 0} following
            </span>
          </div>
        </div>
      </div>

      <FriendRequestButton
        targetUserId={user.id}
        currentUserId={currentUserId}
        friendshipStatus={status}
        onStatusChange={refreshStatus}
      />
    </div>
  );
}

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load current user's following list
  useEffect(() => {
    if (!currentUserId) return;
    const loadFollowing = async () => {
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId);
      if (data) setFollowingUsers(new Set(data.map(f => f.following_id)));
    };
    loadFollowing();
  }, [currentUserId]);

  const fetchUserStats = async (userId: string): Promise<UserStats> => {
    const { data, error } = await supabase.rpc('get_user_stats', { user_id: userId });
    return {
      followers_count: data?.[0]?.followers_count ?? 0,
      following_count: data?.[0]?.following_count ?? 0
    };
  };

  // Auto-search function with debouncing
  const performAutoSearch = useCallback(
    debounce(async (query: string) => {
       if (!query.trim() || !currentUserId) {
        setSearchResults([]);
        setShowSuggestions(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .neq("id", currentUserId)
          .ilike("name", `%${query}%`)
          .limit(5);

        if (error) throw error;

        const usersWithStats = await Promise.all(
          (profiles || []).map(async (profile) => {
            const stats = await fetchUserStats(profile.id);
            return {
              ...profile,
              isFollowing: followingUsers.has(profile.id),
              ...stats
            };
          })
        );

        setSearchResults(usersWithStats);
        setShowSuggestions(true);
      } catch (error: any) {
        console.error("Auto-search error:", error.message);
        setSearchResults([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300),
    [currentUserId]
  );

  // Handle search input change with auto-detection
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      performAutoSearch(value);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !currentUserId) return;
    
    setLoading(true);
    setShowSuggestions(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .neq("id", currentUserId)
        .ilike("name", `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const stats = await fetchUserStats(profile.id);
          return {
            ...profile,
            isFollowing: followingUsers.has(profile.id),
            ...stats
          };
        })
      );

      setSearchResults(usersWithStats);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

 
  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowSuggestions(true);
    }
  };

  if (!currentUserId) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Please log in to search for users</p>
      </div>
    );
  }
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 relative">
      <div className="flex items-center gap-3 mb-4">
        <Search className="text-amber-400" size={24} />
        <h2 className="text-xl font-bold text-amber-200">Find Users</h2>
      </div>
      
      {/* Enhanced search input with auto-detection */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            placeholder="Start typing to find Artists..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchUsers()}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            className="flex-1"
          />
          <Button onClick={searchUsers} disabled={loading || !searchQuery.trim()}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Auto-suggestions dropdown */}
        {showSuggestions && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-amber-500/20 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-amber-300/70 mb-2 px-2">
                {loading ? "Searching..." : `${searchResults.length} users found`}
              </div>
              <div className="space-y-2">
                {searchResults.map((user) => (
                                   <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full search results */}
      {!showSuggestions && searchQuery && searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-amber-300/70 mb-3">
            Found {searchResults.length} users matching "{searchQuery}"
          </div>
          {searchResults.map((user) => (
                      <UserCard
              key={user.id}
              user={user}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* No results message */}
      {!showSuggestions && searchQuery && searchResults.length === 0 && !loading && (
        <div className="text-center py-8 text-amber-300/70">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No users found matching "{searchQuery}"</p>
          <p className="text-xs mt-2 opacity-70">Try searching with a different name</p>
        </div>
      )}
    </div>
  );
}
