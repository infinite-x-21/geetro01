import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shuffle, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AudioStory {
  id: string;
  title: string;
  audio_url: string;
  cover_image_url: string | null;
  category: string;
  created_at: string;
  uploaded_by: string;
  artist_name?: string;
}

export default function ShufflePage() {
  const [allSongs, setAllSongs] = useState<AudioStory[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const navigate = useNavigate();

  // Fetch all songs and artist names
  useEffect(() => {
    async function fetchSongs() {
      setLoading(true);
      try {
        // Fetch all audio stories
        const { data: stories, error } = await supabase
          .from("audio_stories")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (stories) {
          // Get unique uploader IDs
          const uploaderIds = [...new Set(stories.map(story => story.uploaded_by))];
          
          // Fetch artist names
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", uploaderIds);

          // Create a map of user IDs to names
          const artistNames = new Map(profiles?.map(p => [p.id, p.name]) || []);

          // Add artist names to songs
          const songsWithArtists = stories.map(story => ({
            ...story,
            artist_name: artistNames.get(story.uploaded_by) || "Unknown Artist"
          }));

          // Shuffle the array
          const shuffledSongs = [...songsWithArtists].sort(() => Math.random() - 0.5);
          setAllSongs(shuffledSongs);
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();
  }, []);

  // Convert songs to track format and start playing
  useEffect(() => {
    if (allSongs.length > 0) {
      const tracks = allSongs.map(song => ({
        id: song.id,
        audioUrl: song.audio_url,
        coverUrl: song.cover_image_url || "",
        title: song.title,
        artist: song.artist_name || "Unknown Artist"
      }));
      // Always set the full playlist and start at the first song
      playTrack(tracks[0], tracks);
    }
  }, [allSongs, playTrack]);

  // When a user clicks a song in the Up Next list, play that song and set the playlist
  const handleSongSelect = (index: number) => {
    const tracks = allSongs.map(song => ({
      id: song.id,
      audioUrl: song.audio_url,
      coverUrl: song.cover_image_url || "",
      title: song.title,
      artist: song.artist_name || "Unknown Artist"
    }));
    playTrack(tracks[index], tracks);
  };

  // Reshuffle playlist
  const handleReshuffle = () => {
    const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
    setAllSongs(shuffledSongs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#FFB13C,transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#FFB13C,transparent_50%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="text-amber-400 hover:text-amber-300"
            >
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-2xl font-bold text-amber-400">Shuffle Play</h1>
          </div>
          <Button
            onClick={handleReshuffle}
            variant="outline"
            className="gap-2 border-amber-500/30 hover:bg-amber-500/20"
          >
            <Shuffle size={16} />
            Reshuffle
          </Button>
        </div>

        {/* Current playing section */}
        {currentTrack && (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-8 border border-amber-500/20">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  {currentTrack.coverUrl ? (
                    <img 
                      src={currentTrack.coverUrl} 
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                      <Play size={30} className="text-amber-400" />
                    </div>
                  )}
                </div>
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlayPause}
                  className="absolute inset-0 m-auto w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-amber-500 hover:bg-amber-600"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </Button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-100 mb-1">{currentTrack.title}</h2>
                <p className="text-amber-200/70">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        {/* Playlist */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-300 mb-4">Up Next</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {allSongs.map((song, index) => (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    currentTrack?.id === song.id
                      ? "bg-amber-500/20 border-amber-500/40"
                      : "bg-black/20 border-amber-500/10 hover:bg-black/40"
                  } transition-all duration-200 cursor-pointer`}
                  onClick={() => handleSongSelect(index)}
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {song.cover_image_url ? (
                      <img
                        src={song.cover_image_url}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                        <Play size={20} className="text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{song.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist_name || "Unknown Artist"}
                    </p>
                  </div>
                  {currentTrack?.id === song.id && isPlaying && (
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
