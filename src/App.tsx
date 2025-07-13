import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomAudioPlayer } from "@/components/BottomAudioPlayer";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import Index from "./pages/Index";
import StoriesPage from "./pages/Stories";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Home";
import StoryPlayer from "./pages/StoryPlayer";
import VideoPlayer from "./pages/VideoPlayer";
import VideosPage from "./pages/Videos";

import ProfilePage from "./pages/Profile";
import Footer from "@/components/ui/Footer";
import AudioPlayer from "@/components/ui/AudioPlayer";
import LikedAudiosPage from "./pages/LikedAudiosPage";
import CategoryAudiosPage from "./pages/CategoryAudiosPage";
import UserProfilePage from "./pages/UserProfile";
import ShufflePage from "./pages/ShufflePage";
import PlaylistsPage from "./pages/Playlists";
import ChatPage from "./pages/Chat";
const queryClient = new QueryClient();
import FriendsPage from "./pages/Friends";
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioPlayerProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/stories/:id" element={<StoryPlayer />} />
                <Route path="/videos" element={<VideosPage />} />
    
              <Route path="/videos/:id" element={<VideoPlayer />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<UserProfilePage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/friends" element={<FriendsPage />} />

              <Route path="/liked" element={<LikedAudiosPage />} />
              <Route path="/category/music" element={<CategoryAudiosPage category="music" />} />
              <Route path="/category/podcast" element={<CategoryAudiosPage category="podcast" />} />              <Route path="/category/stories" element={<CategoryAudiosPage category="stories" />} />
              <Route path="/shuffle" element={<ShufflePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomAudioPlayer />

             <AudioPlayer />
          </div>
          <Footer /> {/* <<-- Added here */}
        </div>
      </BrowserRouter>
      </AudioPlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;
