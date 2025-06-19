import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Music, Play, Trash2, Edit2 } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface Playlist {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PlaylistWithItems extends Playlist {
  items: Array<{
    id: string;
    position: number;
    audio_stories: {
      id: string;
      title: string;
      artist: string;
      audio_url: string;
      cover_image_url: string | null;
    };
  }>;
}

// Add this type for the raw Supabase response
interface PlaylistRaw extends Playlist {
  playlist_items?: Array<{
    id: string;
    position: number;
    audio_stories: {
      id: string;
      title: string;
      audio_url: string;
      cover_image_url: string | null;
      uploaded_by: string;
    };
  }>;
}

export const PlaylistManager: React.FC = () => {
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_items (
            id,
            position,
            audio_stories (
              id,
              title,
              audio_url,
              cover_image_url,
              uploaded_by
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs from the audio stories
      const userIds = new Set<string>();
      (data as any[] | undefined)?.forEach(playlist => {
        if (Array.isArray(playlist.playlist_items)) {
          playlist.playlist_items.forEach(item => {
            if (item.audio_stories?.uploaded_by) {
              userIds.add(item.audio_stories.uploaded_by);
            }
          });
        }
      });

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Create a map of user ID to name
      const userNameMap = new Map<string, string>();
      profiles?.forEach(profile => {
        userNameMap.set(profile.id, profile.name || 'Unknown Artist');
      });

      // Transform data to include artist name from profiles
      const transformedData = (data as any[] | undefined)?.map(playlist => ({
        ...playlist,
        items: (Array.isArray(playlist.playlist_items) ? playlist.playlist_items : [])
          .sort((a, b) => a.position - b.position)
          .map(item => ({
            ...item,
            audio_stories: {
              ...item.audio_stories,
              artist: userNameMap.get(item.audio_stories.uploaded_by) || 'Unknown Artist'
            }
          }))
      })) || [];

      setPlaylists(transformedData);
    } catch (error: any) {
      toast({
        title: 'Error loading playlists',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('playlists')
        .insert({
          name: newPlaylistName,
          user_id: user.id,
        });

      if (error) throw error;

      setNewPlaylistName('');
      setIsCreateDialogOpen(false);
      loadPlaylists();
      
      toast({
        title: 'Playlist created',
        description: `"${newPlaylistName}" has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error creating playlist',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deletePlaylist = async (playlistId: string, playlistName: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      loadPlaylists();
      toast({
        title: 'Playlist deleted',
        description: `"${playlistName}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting playlist',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const playPlaylist = (playlist: PlaylistWithItems) => {
    if (playlist.items.length === 0) {
      toast({
        title: 'Empty playlist',
        description: 'This playlist has no tracks to play.',
        variant: 'destructive',
      });
      return;
    }

    const tracks = playlist.items.map(item => ({
      id: item.audio_stories.id,
      audioUrl: item.audio_stories.audio_url,
      coverUrl: item.audio_stories.cover_image_url || '',
      title: item.audio_stories.title,
      artist: item.audio_stories.artist,
    }));

    playTrack(tracks[0], tracks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Playlists</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createPlaylist} disabled={!newPlaylistName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <Music size={48} className="mx-auto mb-4 opacity-50" />
          <p>No playlists created yet.</p>
          <p className="text-sm">Create your first playlist to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-card rounded-lg p-4 border border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white truncate" title={playlist.name}>
                  {playlist.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePlaylist(playlist.id, playlist.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {playlist.items.length} track{playlist.items.length !== 1 ? 's' : ''}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => playPlaylist(playlist)}
                  disabled={playlist.items.length === 0}
                  className="flex items-center gap-1 flex-1"
                >
                  <Play size={14} />
                  Play
                </Button>
              </div>

              {playlist.items.length > 0 && (
                <div className="mt-3 space-y-1">
                  {playlist.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="text-xs text-muted-foreground truncate"
                    >
                      {item.audio_stories.title} - {item.audio_stories.artist}
                    </div>
                  ))}
                  {playlist.items.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{playlist.items.length - 3} more tracks
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
