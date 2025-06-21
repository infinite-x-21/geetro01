import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface FriendRequest {
  id: string;
  sender_id: string;
  status: string;
  created_at: string;
  sender_profile: {
    name: string | null;
    avatar_url: string | null;
  };
}

interface FriendRequestsListProps {
  currentUserId: string;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function FriendRequestsList({ currentUserId }: FriendRequestsListProps) {
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingRequests();
  }, [currentUserId]);

  const loadPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("friend_requests" as any)
        .select(`
          id,
          sender_id,
          status,
          created_at,
          sender_profile:profiles!friend_requests_sender_id_fkey(name, avatar_url)
        `)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;
      setPendingRequests((data || []) as FriendRequest[]);
    } catch (error: any) {
      toast({
        title: "Failed to load friend requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests" as any)
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      toast({ title: "Friend request accepted!" });
      loadPendingRequests();
    } catch (error: any) {
      toast({
        title: "Failed to accept friend request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests" as any)
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      toast({ title: "Friend request rejected" });
      loadPendingRequests();
    } catch (error: any) {
      toast({
        title: "Failed to reject friend request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users size={48} className="mx-auto mb-4 opacity-50" />
        <p>No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {request.sender_profile?.avatar_url ? (
                <AvatarImage
                  src={request.sender_profile.avatar_url}
                  alt={request.sender_profile.name || "User"}
                />
              ) : (
                <AvatarFallback>
                  {getInitials(request.sender_profile?.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <button
                onClick={() => navigate(`/profile/${request.sender_id}`)}
                className="font-medium text-amber-200 hover:underline text-left"
              >
                {request.sender_profile?.name || "Anonymous User"}
              </button>
              <p className="text-xs text-amber-100/70">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleAccept(request.id, request.sender_id)}
              size="sm"
            >
              <UserCheck size={16} className="mr-1" />
              Accept
            </Button>
            <Button
              onClick={() => handleReject(request.id)}
              variant="destructive"
              size="sm"
            >
              <UserX size={16} className="mr-1" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
