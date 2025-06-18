import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string | null;
  avatar_url: string | null;
  isFollowing?: boolean;
}

interface FollowersListProps {
  userId: string;
  currentUserId: string | null;
  type: "followers" | "following";
  count: number;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function FollowersList({ userId, currentUserId, type, count }: FollowersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load current user's following list
  useEffect(() => {
    const loadCurrentUserFollowing = async () => {
      if (!currentUserId) return;
      
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId);
      
      if (error) {
        console.error('Error loading following:', error);
        return;
      }
      
      if (data) {
        setFollowingUsers(new Set(data.map(f => f.following_id)));
      }
    };
    loadCurrentUserFollowing();
  }, [currentUserId]);

  const loadUsers = async () => {
    if (!showList || users.length > 0) return;
    
    setLoading(true);
    try {
      if (type === "followers") {
        // First get the follower IDs
        const { data: followerData, error: followerError } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', userId);
          
        if (followerError) throw followerError;
        
        // Then get the profiles
        const followerIds = followerData.map(f => f.follower_id);
        if (followerIds.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', followerIds);
          
        if (profilesError) throw profilesError;
        
        const usersList = profilesData?.map(profile => ({
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          isFollowing: followingUsers.has(profile.id)
        })).filter(user => user.id !== currentUserId) || [];
        
        setUsers(usersList);
      } else {
        // First get the following IDs
        const { data: followingData, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId);
          
        if (followingError) throw followingError;
        
        // Then get the profiles
        const followingIds = followingData.map(f => f.following_id);
        if (followingIds.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', followingIds);
          
        if (profilesError) throw profilesError;
        
        const usersList = profilesData?.map(profile => ({
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          isFollowing: followingUsers.has(profile.id)
        })).filter(user => user.id !== currentUserId) || [];
        
        setUsers(usersList);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const isFollowing = followingUsers.has(targetUserId);
      
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: targetUserId
          });

        if (error) throw error;

        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });

        setUsers(prev => 
          prev.map(user => 
            user.id === targetUserId 
              ? { ...user, isFollowing: false }
              : user
          )
        );

        toast({ title: "Successfully unfollowed user!" });
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          });

        if (error) throw error;

        setFollowingUsers(prev => new Set([...prev, targetUserId]));

        setUsers(prev => 
          prev.map(user => 
            user.id === targetUserId 
              ? { ...user, isFollowing: true }
              : user
          )
        );

        toast({ title: "Successfully followed user!" });
      }
    } catch (error: any) {
      toast({
        title: "Failed to follow/unfollow user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleList = () => {
    setShowList(!showList);
    if (!showList) {
      loadUsers();
    }
  };

  const handleViewProfile = (targetUserId: string) => {
    navigate(`/profile/${targetUserId}`);
  };

  if (count === 0) {
    return (
      <div className="text-center py-4">
        <Users size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No {type === "followers" ? "followers" : "following"} yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={handleToggleList}
        className="w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Users size={16} />
          {count} {type === "followers" ? "Followers" : "Following"}
        </span>
        <span className="text-xs">
          {showList ? "Hide" : "Show"}
        </span>
      </Button>

      {showList && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No {type === "followers" ? "followers" : "following"} found
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/30 transition-all"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleViewProfile(user.id)}
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.name || "User"} />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium text-sm truncate">
                    {user.name || "Anonymous User"}
                  </span>
                </div>

                {currentUserId && user.id !== currentUserId && (
                  <Button
                    variant={user.isFollowing ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleFollow(user.id)}
                    className="text-xs px-2 py-1"
                  >
                    {user.isFollowing ? (
                      <>
                        <UserMinus size={10} className="mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus size={10} className="mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}