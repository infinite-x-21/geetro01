import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';

interface SyncedPlayerProps {
  sessionId: string;
  userId: string;
}

interface SessionState {
  current_track_id: string | null;
  is_playing: boolean;
  position: number;
  last_updated: string;
}

export const SyncedPlayer: React.FC<SyncedPlayerProps> = ({ sessionId, userId }) => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const { playTrack, togglePlayPause, currentTrack, isPlaying } = useAudioPlayer();
  const { toast } = useToast();

  useEffect(() => {
    checkIfHost();
    loadSessionState();
    
    // Set up real-time subscription for session state changes
    const channel = supabase
      .channel('listening-session')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listening_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          const newState = payload.new as any;
          setSessionState({
            current_track_id: newState.current_track_id,
            is_playing: newState.is_playing,
            position: newState.position,
            last_updated: newState.last_updated
          });
          
          // Sync playback if not the host
          if (!isHost) {
            syncPlayback(newState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, isHost]);

  const checkIfHost = async () => {
    try {
      const { data, error } = (await supabase
        .from("listening_sessions" as any)
        .select('host_id')
        .eq('id', sessionId)
        .single()) as any;

      if (error) throw error;
      setIsHost(data.host_id === userId);
    } catch (error: any) {
      toast({
        title: 'Error checking session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadSessionState = async () => {
    try {
      // For now, we'll create a basic session state since the columns don't exist yet
      // In a real implementation, you'd add these columns to the listening_sessions table
      setSessionState({
        current_track_id: null,
        is_playing: false,
        position: 0,
        last_updated: new Date().toISOString()
      });
    } catch (error: any) {
      toast({
        title: 'Error loading session state',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSessionState = async (updates: Partial<SessionState>) => {
    if (!isHost) return;

    try {
      // For now, this is a placeholder since the columns don't exist yet
      // In a real implementation, you'd update the listening_sessions table
      console.log('Would update session state:', updates);
    } catch (error: any) {
      toast({
        title: 'Error updating session',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const syncPlayback = async (state: any) => {
    if (state.current_track_id && state.current_track_id !== currentTrack?.id) {
      // Load and play the new track
      try {
        const { data: track, error } = await supabase
          .from('audio_stories')
          .select('*')
          .eq('id', state.current_track_id)
          .single();

        if (error) throw error;

        const trackData = {
          id: track.id,
          audioUrl: track.audio_url,
          coverUrl: track.cover_image_url || '',
          title: track.title,
          artist: 'Unknown Artist' // You might want to fetch this from profiles
        };

        playTrack(trackData, [trackData]);
      } catch (error: any) {
        console.error('Error loading track:', error);
      }
    }

    // Sync play/pause state
    if (state.is_playing && !isPlaying) {
      // Resume playback
      togglePlayPause();
    } else if (!state.is_playing && isPlaying) {
      togglePlayPause();
    }
  };

  const handlePlay = () => {
    if (isHost && currentTrack) {
      updateSessionState({
        current_track_id: currentTrack.id,
        is_playing: true,
        position: 0
      });
    }
  };

  const handlePause = () => {
    if (isHost) {
      updateSessionState({
        is_playing: false,
        position: 0 // You might want to track actual position
      });
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
        <h2 className="text-2xl font-bold text-white mb-2">Listen Together</h2>
        <p className="text-muted-foreground">
          {isHost ? 'You are hosting this session' : 'You are a participant in this session'}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {currentTrack ? (
          <div className="text-center">
            <div className="w-48 h-48 bg-muted rounded-lg mb-6 flex items-center justify-center mx-auto">
              {currentTrack.coverUrl ? (
                <img 
                  src={currentTrack.coverUrl} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Music size={64} className="text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{currentTrack.title}</h3>
            <p className="text-muted-foreground mb-6">{currentTrack.artist}</p>
            
            {isHost && (
              <div className="flex items-center justify-center gap-4">
                <Button size="sm" variant="outline">
                  <SkipBack size={16} />
                </Button>
                <Button 
                  size="lg" 
                  onClick={isPlaying ? handlePause : handlePlay}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                <Button size="sm" variant="outline">
                  <SkipForward size={16} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Music size={64} className="mx-auto mb-4 opacity-50" />
            <p>No track selected</p>
            {isHost && <p className="text-sm mt-2">Select a track from your library to start listening together</p>}
          </div>
        )}
      </div>
    </div>
  );
};
