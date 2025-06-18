import { useState, useEffect } from "react";
import AudioStoryFeed from "@/components/AudioStoryFeed";
import Navbar from "@/components/Navbar";
import ArtistProfilesList from "@/components/ArtistProfilesList";
import { supabase } from "@/integrations/supabase/client";
import { Play, Clock, Music, Headphones, Mic, Heart, Flame, ChevronRight } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useNavigate } from 'react-router-dom';
import UserSearch from "@/components/UserSearch";
import HeroSection from "@/components/HeroSection";
import AudioStoryUpload from "@/components/AudioStoryUpload";
import { Dialog } from "@/components/ui/dialog";
import HorizontalAudioScroll from "@/components/HorizontalAudioScroll";

// Enhanced SongCard component for better playlist-like appearance
function SongCard({ 
  title, 
  cover_image_url, 
  created_at,
  onClick 
}: { 
  title: string;
  cover_image_url?: string | null;
  created_at?: string;
  onClick?: () => void;
}) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg border bg-background shadow-sm hover:shadow-md cursor-pointer hover:bg-muted/50 transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Album Art */}
      <div className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
        {cover_image_url ? (
          <img 
            src={cover_image_url} 
            alt={title} 
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            <Clock size={20} />
          </div>
        )}
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Play size={20} className="text-white" />
        </div>
      </div>
      
      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        {created_at && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [active] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [artistSongs, setArtistSongs] = useState<any[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [selectedArtistName, setSelectedArtistName] = useState<string>("");
  const { playTrack } = useAudioPlayer();
  // Liked audios from localStorage
  const [likedAudios, setLikedAudios] = useState<any[]>([]);
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [trendingAudios, setTrendingAudios] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
const [showUserSearch, setShowUserSearch] = useState(false);
  // Get current user ID for personalized liked audios
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch liked audios for the current user only
  useEffect(() => {
    if (!userId) {
      setLikedAudios([]);
      return;
    }
    const likedKey = `likedAudios_${userId}`;
    const likedIds = JSON.parse(localStorage.getItem(likedKey) || '[]');
    if (likedIds.length === 0) {
      setLikedAudios([]);
      return;
    }
    supabase
      .from('audio_stories')
      .select('id, title, audio_url, cover_image_url, category, created_at, uploaded_by')
      .in('id', likedIds)
      .then(({ data, error }) => {
        if (!error && data) setLikedAudios(data);
        else setLikedAudios([]);
      });
  }, [userId]);

  // Fetch songs for the selected artist
  useEffect(() => {
    const fetchSongs = async () => {
      if (!selectedArtistId) {
        setArtistSongs([]);
        setSongsLoading(false);
        setSelectedArtistName("");
        return;
      }
      
      setSongsLoading(true);
      console.log("Fetching songs for artist:", selectedArtistId);
      
      // Fetch artist name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", selectedArtistId)
        .single();
      
      setSelectedArtistName(profile?.name || "Unknown Artist");
      
      // Fetch songs
      const { data: stories, error } = await supabase
        .from("audio_stories")
        .select("id, title, audio_url, cover_image_url, category, created_at")
        .eq("uploaded_by", selectedArtistId)
        .order("created_at", { ascending: false });
      
      console.log("Songs data:", stories);
      console.log("Songs error:", error);
      
      setArtistSongs(error || !stories ? [] : stories);
      setSongsLoading(false);
    };
    
    fetchSongs();
  }, [selectedArtistId]);

  // Fetch trending audios (most liked, fallback to all if likes column missing)
  useEffect(() => {
    supabase
      .from('audio_stories')
      .select('id, title, audio_url, cover_image_url, category, created_at, uploaded_by, likes')
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        // Fallback: if likes column missing, fetch without likes
        if (error && error.message.includes('likes')) {
          supabase
            .from('audio_stories')
            .select('id, title, audio_url, cover_image_url, category, created_at, uploaded_by')
            .order('created_at', { ascending: false })
            .then(({ data: fallbackData }) => {
              setTrendingAudios(fallbackData || []);
            });
        } else if (!error && data) {
          setTrendingAudios(data);
        } else {
          setTrendingAudios([]);
        }
      });
  }, []);

  const handleSongPlay = (song: any) => {
    console.log("Playing song:", song);
    const track = {
      id: song.id,
      audioUrl: song.audio_url || "",
      coverUrl: song.cover_image_url || "",
      title: song.title || "",
      artist: selectedArtistName,
    };
    
    // Create playlist from all artist songs
    const playlist = artistSongs.map(s => ({
      id: s.id,
      audioUrl: s.audio_url || "",
      coverUrl: s.cover_image_url || "",
      title: s.title || "",
      artist: selectedArtistName,
    }));
    
    playTrack(track, playlist);
  };

  const navigateToArtist = (artistId: string) => {
    navigate(`/profile/${artistId}`);
  };

  const handleAudioClick = (audio: any) => {
    const track = {
      id: audio.id,
      audioUrl: audio.audio_url || "",
      coverUrl: audio.cover_image_url || "",
      title: audio.title || "",
      artist: audio.artist_name || "Unknown Artist",
    };
    
    playTrack(track);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start w-full bg-background pb-20 relative">
      {/* Decorative background image */}
      <img
        src="/images/geetro-x.jpeg"
        alt="Decorative background"
        className="pointer-events-none select-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-20 blur-2xl w-[900px] max-w-none"
        style={{ objectFit: 'cover', filter: 'blur(32px) brightness(0.7)' }}
        aria-hidden="true"
      />
      {/* Decorative scattered icons left */}
      <div className="hidden md:block pointer-events-none select-none fixed left-0 top-1/4 z-5 w-48 h-[60vh] opacity-25">
        <svg width="100%" height="100%" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#blur1)">
            <circle cx="40" cy="60" r="18" fill="#FFB13C" fillOpacity="0.18" />
            <rect x="20" y="180" width="32" height="32" rx="8" fill="#FFB13C" fillOpacity="0.12" />
            <path d="M60 320 Q70 340 90 330" stroke="#FFB13C" strokeWidth="3" strokeLinecap="round" opacity="0.18" />
            <text x="10" y="120" fontSize="32" fill="#FFB13C" fillOpacity="0.18" fontFamily="Segoe UI, sans-serif">🎵</text>
            <text x="30" y="250" fontSize="28" fill="#FFB13C" fillOpacity="0.15" fontFamily="Segoe UI, sans-serif">🎙️</text>
            <text x="60" y="370" fontSize="30" fill="#FFB13C" fillOpacity="0.13" fontFamily="Segoe UI, sans-serif">📖</text>
          </g>
          <defs>
            <filter id="blur1" x="-20" y="0" width="240" height="400" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
        </svg>
      </div>
      {/* Decorative scattered icons right */}
      <div className="hidden md:block pointer-events-none select-none fixed right-0 top-1/3 z-5 w-48 h-[60vh] opacity-25">
        <svg width="100%" height="100%" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#blur2)">
            <circle cx="160" cy="80" r="14" fill="#FFB13C" fillOpacity="0.15" />
            <rect x="120" y="200" width="28" height="28" rx="7" fill="#FFB13C" fillOpacity="0.10" />
            <path d="M120 350 Q140 370 180 360" stroke="#FFB13C" strokeWidth="2.5" strokeLinecap="round" opacity="0.15" />
            <text x="120" y="140" fontSize="28" fill="#FFB13C" fillOpacity="0.15" fontFamily="Segoe UI, sans-serif">🎵</text>
            <text x="140" y="270" fontSize="24" fill="#FFB13C" fillOpacity="0.13" fontFamily="Segoe UI, sans-serif">🎙️</text>
            <text x="100" y="390" fontSize="26" fill="#FFB13C" fillOpacity="0.12" fontFamily="Segoe UI, sans-serif">📖</text>
          </g>
          <defs>
            <filter id="blur2" x="80" y="0" width="160" height="400" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
        </svg>
      </div>
      <Navbar />
      {/* New Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-12 pb-16 bg-background relative overflow-hidden" style={{backgroundImage: "url('/images/geetro-x.jpeg')", backgroundSize: "cover", backgroundPosition: "center"}}>
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 flex flex-col items-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-amber-300 text-center mb-4 drop-shadow-neon tracking-tight" style={{textShadow: '0 0 32px #ffb13c88, 0 2px 8px #0008'}}>
            GeetroX: Audio Stories, Music & Podcasts
          </h1>
          <p className="text-lg md:text-2xl text-amber-100 text-center mb-6 max-w-2xl drop-shadow-md">
            Discover, listen, and share amazing audio content. Enjoy music, podcasts, and stories from creators worldwide. Upload your own and join the community!
          </p>
          <button
            className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xl shadow-lg animate-pulse flex items-center gap-2 border-2 border-amber-400"
            onClick={() => navigate('/stories')}
          >
            <span>+</span> Upload Your Audio
          </button>
        </div>
        {/* Glowing elements */}
        <div className="absolute left-10 top-10 w-24 h-24 rounded-full bg-amber-400/20 blur-2xl animate-pulse"></div>
        <div className="absolute right-10 bottom-10 w-32 h-32 rounded-full bg-orange-400/20 blur-2xl animate-pulse"></div>
      </section>

    

    
      <div className="w-full" style={{ height: 48 }} />
      {/* Main content card */}
      <div className="w-full flex justify-center relative z-10">
        
        <div className="w-full max-w-4xl glass-card p-8 animate-fade-in shadow-neon relative z-10">
          
          {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowUserSearch(false)}
            className={`px-4 py-2 rounded-lg transition-all ${
              !showUserSearch
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                : "text-amber-100/70 hover:text-amber-200"
            }`}
          >
            Audio Content
          </button>
          <button
            onClick={() => setShowUserSearch(true)}
            className={`px-4 py-2 rounded-lg transition-all ${
              showUserSearch
                ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                : "text-amber-100/70 hover:text-amber-200"
            }`}
          >
            Find Artist's
          </button>
        </div>

        {showUserSearch ? (
          <UserSearch />
        ) : (
          <>
                    {/* Liked Audios Folder/Card */}
                    <div className="mb-12 flex justify-center">
                      <div
                        className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl shadow-lg p-8 w-64 h-56 cursor-pointer hover:scale-105 transition-all duration-200 group"
                        onClick={() => navigate('/liked')}
                        style={{ minHeight: 180 }}
                      >
                        <div className="mb-4">
                          <div className="rounded-full bg-amber-500/20 p-4 shadow-lg">
                            <Heart className="text-amber-400" size={40} />
                          </div>
                        </div>
                        <div className="text-xl font-bold text-amber-200 mb-1">Liked Audios</div>
                        <div className="text-sm text-muted-foreground text-center">Click to view all your liked songs, podcasts, and stories</div>
                        <div className="mt-4 flex gap-2">
                          {likedAudios.slice(0, 3).map(audio => (
                            <div key={audio.id} className="w-8 h-8 rounded bg-muted overflow-hidden flex items-center justify-center border border-amber-400/30">
                              {audio.cover_image_url ? (
                                <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-muted-foreground text-lg">🎵</span>
                              )}
                            </div>
                          ))}
                          {likedAudios.length > 3 && (
                            <span className="text-xs text-amber-400 font-bold">+{likedAudios.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>                            {/* Trending Audios Carousel */}
                  <div className="mb-12 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Flame className="text-orange-400 z-10 relative" size={28} />
                          <div className="absolute -inset-1 bg-orange-400/20 blur-lg rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-bold text-amber-200 leading-tight">Trending Audios</h2>
                          <p className="text-sm text-amber-200/60">Discover what's hot right now</p>
                        </div>
                      </div>
                      {/* Hide View All if /trending route is not present */}
                      {/* <button 
                        onClick={() => navigate('/trending')}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-medium transition-all duration-300 group"
                      >
                        View All 
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button> */}
                    </div>
                    <div className="relative">
                      {/* Gradient Overlays for scroll indication */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10"></div>
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10"></div>
                      
                      <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 scroll-smooth scrollbar-thin scrollbar-track-amber-900/20 scrollbar-thumb-amber-500/20 hover:scrollbar-thumb-amber-500/40">
                        {trendingAudios.length === 0 ? (
                          <div className="text-muted-foreground text-lg font-semibold px-8 py-12">No audios found.</div>
                        ) : (
                          trendingAudios.map(audio => (
                            <div 
                              key={audio.id} 
                              className="group relative flex-shrink-0 w-[280px] md:w-[320px] bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-amber-500/5 rounded-xl overflow-hidden border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300"
                            >
                              {/* Background Glow Effect */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-500/5 blur-xl"></div>
                              </div>
                              {/* Content Container */}
                              <div className="relative p-4 flex gap-4">
                                {/* Cover Art */}
                                <div className="relative flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden">
                                  {audio.cover_image_url ? (
                                    <img 
                                      src={audio.cover_image_url} 
                                      alt={audio.title} 
                                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                      <Music className="text-amber-400" size={32} />
                                    </div>
                                  )}
                                  {/* Play Button Overlay */}
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSongPlay(audio);
                                    }}
                                  >
                                    <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300">
                                      <Play size={20} className="text-white ml-1" />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Info Section */}
                                <div className="flex flex-col justify-between flex-grow min-w-0">
                                  <div>
                                    <h3 className="font-semibold text-lg md:text-xl text-amber-100 truncate mb-1" title={audio.title}>
                                      {audio.title}
                                    </h3>
                                    <p className="text-sm text-amber-200/60 truncate" title={audio.artist_name}>
                                      {audio.artist_name}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      <Heart 
                                        size={16} 
                                        className="text-amber-400/70 group-hover:text-amber-400 transition-colors" 
                                      />
                                      <span className="text-xs text-amber-300/70">
                                        {audio.likes || 0}
                                      </span>
                                    </div>
                                    <span className="text-xs text-amber-300/50">
                                      {new Date(audio.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                {/* All Audios Section (functional, modern) */}
                <div className="mb-12">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                      <input
                        type="text"
                        className="outline-none w-full max-w-xs shadow text-base px-4 py-2 rounded-full border border-amber-500/50 bg-black/60 text-amber-100"
                        placeholder="Search all audios..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                      <button
                        className="ml-2 px-4 py-2 rounded-full bg-amber-500/80 text-white font-semibold shadow hover:bg-amber-600 transition"
                        onClick={() => setSearch("")}
                        title="Clear search"
                      >Clear</button>
                    </div>                    <div className="flex gap-2 items-center">
                      <button
                        className="px-6 py-2.5 rounded-full bg-amber-500/80 text-white font-semibold shadow hover:bg-amber-600 transition flex items-center gap-2"
                        onClick={() => navigate("/shuffle")}
                        title="Shuffle Play"
                      >Shuffle Play</button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-neon p-6">
                    <AudioStoryFeed category={active === 'all' ? undefined : active} search={search} />
                  </div>
                </div>
                           {/* Artists section with enhanced design */}
                  {active === "all" && (
                    <div className="mt-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-amber-500/20 audio-glow">
                          <Headphones className="text-amber-400" size={24} />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-amber-200">Featured Artists</div>
                          <p className="text-sm text-amber-100/70">Discover talented creators and their audio stories</p>
                        </div>
                      </div>
                      
                      <div className="w-full min-h-[120px] rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-sm px-6 py-6 shadow-neon">
                        <ArtistProfilesList
                          selectedArtistId={selectedArtistId}
                          onSelectArtist={setSelectedArtistId}
                        />
                        
                        {/* Show songs by selected artist below */}
                        {selectedArtistId && (
                          <div className="mt-8">
                            <div className="mb-6 flex items-center gap-3">
                              <div className="p-2 rounded-full bg-amber-500/20 audio-glow">
                                <Mic className="text-amber-400" size={20} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-amber-200">
                                  Songs by {selectedArtistName}
                                </h3>
                                <p className="text-sm text-amber-100/70">
                                  {artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'}
                                </p>
                              </div>
                            </div>
                            
                            {songsLoading ? (
                              <div className="flex w-full justify-center py-8 text-amber-300">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                                  Loading songs...
                                </div>
                              </div>
                            ) : artistSongs.length === 0 ? (
                              <div className="flex w-full justify-center py-8 text-amber-300/70">
                                No songs uploaded yet.
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                {artistSongs.map(song => (
                                  <div key={song.id} className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
                                    <SongCard
                                      title={song.title}
                                      cover_image_url={song.cover_image_url}
                                      created_at={song.created_at}
                                      onClick={() => handleSongPlay(song)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional content sections for better design */}
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Music Card */}
                    <div
                      className="bg-transparent rounded-lg p-6 border border-amber-500/20 shadow-neon cursor-pointer group hover:scale-105 transition-all duration-200 relative"
                      onClick={() => navigate('/category/music')}
                    >
                      <Music className="text-amber-400 mb-3" size={32} />
                      {/* Decorative SVG inside card */}
                      <svg className="absolute right-4 bottom-4 opacity-20 group-hover:opacity-40 transition" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFB13C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                      <h3 className="text-lg font-semibold text-amber-200 mb-2">Music</h3>
                      <p className="text-sm text-amber-100/70">Discover amazing musical compositions from talented artists worldwide.</p>
                    </div>
                    {/* Podcasts Card */}
                    <div
                      className="bg-transparent rounded-lg p-6 border border-amber-500/20 shadow-neon cursor-pointer group hover:scale-105 transition-all duration-200 relative"
                      onClick={() => navigate('/category/podcast')}
                    >
                      <Headphones className="text-amber-400 mb-3" size={32} />
                      {/* Decorative SVG inside card */}
                      <svg className="absolute left-4 bottom-4 opacity-20 group-hover:opacity-40 transition" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFB13C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                      <h3 className="text-lg font-semibold text-amber-200 mb-2">Podcasts</h3>
                      <p className="text-sm text-amber-100/70">Listen to engaging conversations and educational content.</p>
                    </div>
                    {/* Stories Card */}
                    <div
                      className="bg-transparent rounded-lg p-6 border border-amber-500/20 shadow-neon cursor-pointer group hover:scale-105 transition-all duration-200 relative"
                      onClick={() => navigate('/category/stories')}
                    >
                      <Mic className="text-amber-400 mb-3" size={32} />
                      {/* Decorative SVG inside card */}
                      <svg className="absolute right-4 top-4 opacity-20 group-hover:opacity-40 transition" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFB13C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 18V14a3 3 0 0 1 6 0v4" /></svg>
                      <h3 className="text-lg font-semibold text-amber-200 mb-2">Stories</h3>
                      <p className="text-sm text-amber-100/70">Immerse yourself in captivating audio stories and narratives.</p>
                    </div>
                  </div>
              </>  
            )}


        </div>
      </div>
      {/* Upload Audio Modal */}
     {/* <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <AudioStoryUpload onUpload={() => setUploadOpen(false)} />
      </Dialog> */}
    </div>
  );
}
