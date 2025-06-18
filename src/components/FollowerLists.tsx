import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, UserMinus, Users2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";

interface User {
  id: string;
  name: string | null;
  avatar_url: string | null;
  isFollowing?: boolean;
  followers_count?: number;
  following_count?: number;
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
    if (!showList) return;
    
    setLoading(true);
    try {
      if (type === "followers") {
        // First get the follower IDs
        const { data: followerData, error: followerError } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', userId);
          
        if (followerError) throw followerError;
        
        // Then get the profiles and their stats
        const followerIds = followerData.map(f => f.follower_id);
        if (followerIds.length === 0) {
          setUsers([]);
          return;
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', followerIds);
          
        if (profilesError) throw profilesError;

        // Set the users with their following status
        const usersList = profilesData.map(profile => ({
          ...profile,
          isFollowing: followingUsers.has(profile.id),
          followers_count: 0,
          following_count: 0
        }));
        
        setUsers(usersList.filter(user => user.id !== currentUserId));

        // Then get their stats asynchronously
        const usersWithStats = await Promise.all(
          usersList.map(async (user) => {
            const { data: stats } = await supabase
              .rpc('get_user_stats', { user_id: user.id });
            return {
              ...user,
              followers_count: stats?.[0]?.followers_count ?? 0,
              following_count: stats?.[0]?.following_count ?? 0
            };
          })
        );
        
        setUsers(usersWithStats.filter(user => user.id !== currentUserId));
      } else {
        // First get the following IDs
        const { data: followingData, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId);
          
        if (followingError) throw followingError;
        
        // Then get the profiles and their stats
        const followingIds = followingData.map(f => f.following_id);
        if (followingIds.length === 0) {
          setUsers([]);
          return;
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', followingIds);
          
        if (profilesError) throw profilesError;

        // Set the users with their following status
        const usersList = profilesData.map(profile => ({
          ...profile,
          isFollowing: followingUsers.has(profile.id),
          followers_count: 0,
          following_count: 0
        }));
        
        setUsers(usersList.filter(user => user.id !== currentUserId));

        // Then get their stats asynchronously
        const usersWithStats = await Promise.all(
          usersList.map(async (user) => {
            const { data: stats } = await supabase
              .rpc('get_user_stats', { user_id: user.id });
            return {
              ...user,
              followers_count: stats?.[0]?.followers_count ?? 0,
              following_count: stats?.[0]?.following_count ?? 0
            };
          })
        );
        
        setUsers(usersWithStats.filter(user => user.id !== currentUserId));
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

  useEffect(() => {
    if (showList) {
      loadUsers();
    }
  }, [showList]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

      if (error) throw error;

      setFollowingUsers(prev => new Set([...prev, targetUserId]));
      setUsers(prev => 
        prev.map(user => 
          user.id === targetUserId 
            ? { ...user, isFollowing: true, followers_count: (user.followers_count || 0) + 1 }
            : user
        )
      );

      toast({ title: "Successfully followed user!" });
    } catch (error: any) {
      toast({
        title: "Failed to follow user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
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
            ? { ...user, isFollowing: false, followers_count: Math.max((user.followers_count || 1) - 1, 0) }
            : user
        )
      );

      toast({ title: "Successfully unfollowed user!" });
    } catch (error: any) {
      toast({
        title: "Failed to unfollow user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (targetUserId: string) => {
    navigate(`/profile/${targetUserId}`);
    setShowList(false);
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setShowList(true)}
        className="w-full flex items-center justify-between bg-muted/30 hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          {type === "followers" ? <Users size={16} /> : <Users2 size={16} />}
          {count} {type === "followers" ? "Followers" : "Following"}
        </span>
      </Button>

      <Sheet open={showList} onOpenChange={setShowList}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                {type === "followers" ? (
                  <>
                    <Users className="h-5 w-5" />
                    Followers
                  </>
                ) : (
                  <>
                    <Users2 className="h-5 w-5" />
                    Following
                  </>
                )}
              </SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="mt-8 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">
                  {type === "followers"
                    ? "No followers yet"
                    : "Not following anyone yet"}
                </p>
                <p className="text-sm mt-1">
                  {type === "followers"
                    ? "Share your content to get followers!"
                    : "Find and follow other users to see their content!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-primary/10 hover:border-primary/30 transition-all duration-200"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleViewProfile(user.id)}
                    >
                      <Avatar className="h-10 w-10 border-2 border-background">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.name || "User"} />
                        ) : (
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {user.name || "Anonymous User"}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{user.followers_count} followers</span>
                          <span>{user.following_count} following</span>
                        </div>
                      </div>
                    </div>

                    {currentUserId && user.id !== currentUserId && (
                      <Button
                        variant={user.isFollowing ? "destructive" : "default"}
                        size="sm"
                        onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                        className="ml-4"
                      >
                        {user.isFollowing ? (
                          <>
                            <UserMinus size={14} className="mr-1" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} className="mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}