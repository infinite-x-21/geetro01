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
import ProfilePage from "./pages/Profile";
import Footer from "@/components/ui/Footer";
import AudioPlayer from "@/components/ui/AudioPlayer";
import LikedAudiosPage from "./pages/LikedAudiosPage";
import CategoryAudiosPage from "./pages/CategoryAudiosPage";
const queryClient = new QueryClient();

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
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/liked" element={<LikedAudiosPage />} />
              <Route path="/category/music" element={<CategoryAudiosPage category="music" />} />
              <Route path="/category/podcast" element={<CategoryAudiosPage category="podcast" />} />
              <Route path="/category/stories" element={<CategoryAudiosPage category="stories" />} />
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
