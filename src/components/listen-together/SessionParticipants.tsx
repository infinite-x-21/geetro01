import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Crown } from 'lucide-react';

interface SessionParticipantsProps {
  sessionId: string;
  currentUserId: string;
}

interface Participant {
  id: string;
  user_id: string;
  profiles: {
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SessionInfo {
  host_id: string;
}

export const SessionParticipants: React.FC<SessionParticipantsProps> = ({ 
  sessionId, 
  currentUserId 
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadParticipants();
    loadSessionInfo();
    
    // Set up real-time subscription for participant changes
    const channel = supabase
      .channel('session-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadSessionInfo = async () => {
    try {
      const { data, error } = (await supabase
        .from("listening_sessions" as any)
        .select('host_id')
        .eq('id', sessionId)
        .single()) as any;

      if (error) throw error;
      if (!data || typeof data.host_id === 'undefined') throw new Error('No session info');
      setSessionInfo({ host_id: data.host_id });
    } catch (error: any) {
      toast({
        title: 'Error loading session info',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadParticipants = async () => {
    try {
      // First get session participants
      const { data: participantsData, error: participantsError } = (await supabase
        .from("session_participants" as any)
        .select('id, user_id')
        .eq('session_id', sessionId)) as any;

      if (participantsError) throw participantsError;
      if (!Array.isArray(participantsData) || participantsData.length === 0) {
        setParticipants([]);
        return;
      }

      // Get user IDs to fetch profiles
      const userIds = participantsData.map((p: any) => p.user_id);

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = (await supabase
        .from("profiles" as any)
        .select('id, name, avatar_url')
        .in('id', userIds)) as any;

      if (profilesError) throw profilesError;

      // Combine the data
      const participantsWithProfiles: Participant[] = participantsData.map((participant: any) => ({
        id: participant.id,
        user_id: participant.user_id,
        profiles: profilesData?.find((profile: any) => profile.id === participant.user_id) || null
      }));

      setParticipants(participantsWithProfiles);
    } catch (error: any) {
      toast({
        title: 'Error loading participants',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Users size={20} />
          Participants
        </h3>
        <p className="text-muted-foreground text-sm">
          {participants.length} {participants.length === 1 ? 'person' : 'people'} listening
        </p>
      </div>

      <div className="flex-1 space-y-3">
        {participants.map((participant) => (
          <div 
            key={participant.id} 
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-muted/30"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={participant.profiles?.avatar_url || ''} 
                alt={participant.profiles?.name || 'User'} 
              />
              <AvatarFallback>
                {(participant.profiles?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white truncate">
                  {participant.profiles?.name || 'Anonymous User'}
                </p>
                {sessionInfo?.host_id === participant.user_id && (
                  <Crown size={16} className="text-amber-500 flex-shrink-0" />
                )}
              </div>
              {participant.user_id === currentUserId && (
                <p className="text-xs text-muted-foreground">You</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
          <div>
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No participants yet</p>
            <p className="text-sm mt-1">Share the session link to invite others</p>
          </div>
        </div>
      )}
    </div>
  );
};
