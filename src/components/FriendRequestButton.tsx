import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FriendRequestButtonProps {
  targetUserId: string;
  currentUserId: string;
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "friends";
  onStatusChange?: () => void;
}

export default function FriendRequestButton({
  targetUserId,
  currentUserId,
  friendshipStatus,
  onStatusChange
}: FriendRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendFriendRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("friend_requests" as any)
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          status: "pending"
        });

      if (error) throw error;

      toast({ title: "Friend request sent!" });
      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("friend_requests" as any)
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("sender_id", targetUserId)
        .eq("receiver_id", currentUserId);

      if (error) throw error;

      toast({ title: "Friend request accepted!" });
      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: "Failed to accept friend request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("friend_requests" as any)
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("sender_id", targetUserId)
        .eq("receiver_id", currentUserId);

      if (error) throw error;

      toast({ title: "Friend request rejected" });
      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: "Failed to reject friend request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (friendshipStatus === "friends") {
    return (
      <Button variant="secondary" disabled>
        <UserCheck size={16} className="mr-2" />
        Friends
      </Button>
    );
  }

  if (friendshipStatus === "pending_sent") {
    return (
      <Button variant="outline" disabled>
        <Clock size={16} className="mr-2" />
        Request Sent
      </Button>
    );
  }

  if (friendshipStatus === "pending_received") {
    return (
      <div className="flex gap-2">
        <Button
          onClick={acceptFriendRequest}
          disabled={loading}
          size="sm"
        >
          <UserCheck size={16} className="mr-1" />
          Accept
        </Button>
        <Button
          onClick={rejectFriendRequest}
          disabled={loading}
          variant="destructive"
          size="sm"
        >
          <UserX size={16} className="mr-1" />
          Reject
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={sendFriendRequest}
      disabled={loading}
    >
      <UserPlus size={16} className="mr-2" />
      {loading ? "Sending..." : "Add Friend"}
    </Button>
  );
}
