import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";

export function useFriendshipStatus(currentUserId: string | null, targetUserId: string) {
  const [status, setStatus] = useState<FriendshipStatus>("none");
  const [loading, setLoading] = useState(true);

  const checkFriendshipStatus = async () => {
    if (!currentUserId || currentUserId === targetUserId) {
      setLoading(false);
      return;
    }

    try {
      // Check if they are already friends
      const { data: friendship } = await supabase
        .from("friendships" as any)
        .select("id")
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`)
        .maybeSingle();

      if (friendship) {
        setStatus("friends");
        setLoading(false);
        return;
      }

      // Check friend request status
      const { data: request } = await supabase
        .from("friend_requests" as any)
        .select("sender_id, receiver_id, status")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
        .eq("status", "pending")
        .maybeSingle();

      if ((request as any) && typeof request === 'object' && 'sender_id' in (request as any)) {
        if ((request as any).sender_id === currentUserId) {
          setStatus("pending_sent");
        } else {
          setStatus("pending_received");
        }
      } else {
        setStatus("none");
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
      setStatus("none");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFriendshipStatus();
  }, [currentUserId, targetUserId]);

  const refreshStatus = () => {
    setLoading(true);
    checkFriendshipStatus();
  };

  return { status, loading, refreshStatus };
}
