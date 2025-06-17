import { useNavigate } from "react-router-dom";
import AudioStoryFeed from "@/components/AudioStoryFeed";
import { ArrowLeft, Music, Headphones, Mic } from "lucide-react";

interface CategoryAudiosPageProps {
  category: "music" | "podcast" | "stories";
}

const categoryDetails = {
  music: {
    icon: <Music className="text-amber-400" size={36} />, title: "Music", desc: "All music uploaded by creators."
  },
  podcast: {
    icon: <Headphones className="text-amber-400" size={36} />, title: "Podcasts", desc: "All podcasts uploaded by creators."
  },
  stories: {
    icon: <Mic className="text-amber-400" size={36} />, title: "Stories", desc: "All stories uploaded by creators."
  }
};

export default function CategoryAudiosPage({ category }: CategoryAudiosPageProps) {
  const navigate = useNavigate();
  const details = categoryDetails[category];
  return (
    <div className="min-h-screen flex flex-col items-center justify-start w-full bg-background pb-20 pt-8 animate-fade-in relative">
      {/* Decorative SVGs left */}
      <div className="absolute left-0 top-0 h-full w-24 flex flex-col items-center justify-around opacity-20 pointer-events-none">
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
      </div>
      {/* Decorative SVGs right */}
      <div className="absolute right-0 top-0 h-full w-24 flex flex-col items-center justify-around opacity-20 pointer-events-none">
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 18V14a3 3 0 0 1 6 0v4" /></svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
      </div>
      <div className="w-full max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/home')}
          className="mb-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-amber-400/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-500 font-semibold shadow transition"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
        <div className="flex items-center gap-4 mb-8">
          {details.icon}
          <h1 className="text-2xl font-bold text-amber-200">{details.title}</h1>
        </div>
        <div className="text-amber-100/80 mb-6">{details.desc}</div>
        <AudioStoryFeed category={category} />
      </div>
    </div>
  );
} 