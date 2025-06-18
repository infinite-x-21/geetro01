import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface AudioItem {
  id: string;
  title: string;
  cover_image_url?: string | null;
  created_at?: string;
  artist_name?: string;
  likes?: number;
}

interface HorizontalAudioScrollProps {
  title: string;
  items: AudioItem[];
  onItemClick: (item: AudioItem) => void;
  showAll?: () => void;
}

export default function HorizontalAudioScroll({
  title,
  items,
  onItemClick,
  showAll
}: HorizontalAudioScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft = direction === "left" 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth"
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  return (
    <div className="w-full px-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {showAll && (
          <button 
            onClick={showAll}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Show all
          </button>
        )}
      </div>
      
      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full shadow-lg border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="flex-shrink-0 w-[200px] group/card cursor-pointer"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                {item.cover_image_url ? (
                  <img
                    src={item.cover_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                    <span className="text-amber-500/60 text-lg">♪</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center transform scale-90 group-hover/card:scale-100 transition-transform duration-200">
                    <svg
                      className="w-6 h-6 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3l14 9-14 9V3z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-1">
                <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
                {item.artist_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.artist_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full shadow-lg border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
