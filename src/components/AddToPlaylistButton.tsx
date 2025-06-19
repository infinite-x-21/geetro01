import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, ListPlus, Check } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
}

interface AddToPlaylistButtonProps {
  audioStoryId: string;
  variant?: 'default' | 'icon';
  size?: 'default' | 'sm' | 'lg';
}

export const AddToPlaylistButton: React.FC<AddToPlaylistButtonProps> = ({
  audioStoryId,
  variant = 'default',
  size = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setPlaylists(data || []);

      // Check which playlists already contain this track
      const { data: existingItems, error: existingError } = await supabase
        .from('playlist_items')
        .select('playlist_id')
        .eq('audio_story_id', audioStoryId);

      if (!existingError && existingItems) {
        setAddedToPlaylists(new Set(existingItems.map(item => item.playlist_id)));
      }
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

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name: newPlaylistName,
          user_id: user.id,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      setPlaylists(prev => [...prev, data]);
      setNewPlaylistName('');
      
      // Automatically add the track to the new playlist
      await addToPlaylist(data.id);
      
      toast({
        title: 'Playlist created',
        description: `"${newPlaylistName}" has been created and the track added.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error creating playlist',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    try {
      // Get the current max position for this playlist
      const { data: maxPositionData } = await supabase
        .from('playlist_items')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = maxPositionData?.[0]?.position ? maxPositionData[0].position + 1 : 0;

      const { error } = await supabase
        .from('playlist_items')
        .insert({
          playlist_id: playlistId,
          audio_story_id: audioStoryId,
          position: newPosition,
        });

      if (error) throw error;

      setAddedToPlaylists(prev => new Set([...prev, playlistId]));
      
      const playlist = playlists.find(p => p.id === playlistId);
      toast({
        title: 'Added to playlist',
        description: `Track added to "${playlist?.name}".`,
      });
    } catch (error: any) {
      toast({
        title: 'Error adding to playlist',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeFromPlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('audio_story_id', audioStoryId);

      if (error) throw error;

      setAddedToPlaylists(prev => {
        const newSet = new Set(prev);
        newSet.delete(playlistId);
        return newSet;
      });
      
      const playlist = playlists.find(p => p.id === playlistId);
      toast({
        title: 'Removed from playlist',
        description: `Track removed from "${playlist?.name}".`,
      });
    } catch (error: any) {
      toast({
        title: 'Error removing from playlist',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePlaylistItem = (playlistId: string) => {
    if (addedToPlaylists.has(playlistId)) {
      removeFromPlaylist(playlistId);
    } else {
      addToPlaylist(playlistId);
    }
  };

  return (
    <>
      <Button
        variant={variant === 'icon' ? 'ghost' : 'outline'}
        size={size}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <ListPlus size={variant === 'icon' ? 16 : 14} />
        {variant !== 'icon' && 'Add to Playlist'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Create new playlist */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Create new playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                />
                <Button 
                  onClick={createPlaylist} 
                  disabled={!newPlaylistName.trim()}
                  size="sm"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            {/* Existing playlists */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : playlists.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No playlists found. Create one above!
                </p>
              ) : (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm">{playlist.name}</span>
                    <Button
                      variant={addedToPlaylists.has(playlist.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlaylistItem(playlist.id)}
                      className="flex items-center gap-1"
                    >
                      {addedToPlaylists.has(playlist.id) ? (
                        <>
                          <Check size={12} />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
