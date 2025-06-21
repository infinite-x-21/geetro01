import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Friend {
  friend_id: string;
  friend_name: string | null;
  friend_avatar_url: string | null;
}

interface FriendsListProps {
  currentUserId: string;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function FriendsList({ currentUserId }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFriends();
  }, [currentUserId]);

  const loadFriends = async () => {
    try {
      // Fetch all users that the current user is following (friends)
      const { data, error } = await supabase
        .from("followers")
        .select("following_id, profiles:following_id(id, name, avatar_url)")
        .eq("follower_id", currentUserId);

      if (error) throw error;
      // Map to Friend[]
      setFriends(
        (data || []).map((row: any) => ({
          friend_id: row.following_id,
          friend_name: row.profiles?.name ?? null,
          friend_avatar_url: row.profiles?.avatar_url ?? null,
        }))
      );
    } catch (error: any) {
      toast({
        title: "Failed to load friends",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startChat = (friendId: string) => {
    navigate(`/chat?user=${friendId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users size={48} className="mx-auto mb-4 opacity-50" />
        <p>No friends yet</p>
        <p className="text-xs mt-2 opacity-70">Send friend requests to start building your network!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <div
          key={friend.friend_id}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              {friend.friend_avatar_url ? (
                <AvatarImage
                  src={friend.friend_avatar_url}
                  alt={friend.friend_name || "User"}
                />
              ) : (
                <AvatarFallback>
                  {getInitials(friend.friend_name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <button
              onClick={() => navigate(`/profile/${friend.friend_id}`)}
              className="font-medium text-amber-200 hover:underline text-left truncate"
            >
              {friend.friend_name || "Anonymous User"}
            </button>
          </div>

          <Button
            onClick={() => startChat(friend.friend_id)}
            size="sm"
            className="ml-2"
          >
            <MessageCircle size={16} className="mr-1" />
            Chat
          </Button>
        </div>
      ))}
    </div>
  );
}
