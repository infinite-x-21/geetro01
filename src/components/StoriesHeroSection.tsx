import React from "react";
import { FileAudio, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function StoriesHeroSection() {
  return (
    <section
      className="w-full flex flex-col items-center justify-center pt-[86px] pb-8 px-3 bg-background border-b border-primary/20 shadow-lg animate-fade-in relative"
      style={{ 
        minHeight: 120,
        backgroundImage: "url('/lovable-uploads/100c870b-a737-49cb-a975-1ec080560c2a.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Vintage gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background"></div>
      
      {/* Content with relative positioning */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="max-w-2xl w-full flex flex-col items-center text-center mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-full bg-primary/20 audio-glow border border-primary/30">
              <FileAudio size={32} className="text-primary" />
            </div>
            <span className="font-neon text-3xl tracking-tight font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent">Audio Stories</span>
          </div>
          <p className="text-foreground/90 text-lg mb-6 max-w-xl mx-auto leading-relaxed drop-shadow-lg">
            Listen, discover and share short audio stories, music, and podcasts from creators.<br />
            Use the upload button to submit your own story!
          </p>
          <Button
            asChild
            variant="default"
            className="font-neon px-8 py-6 text-lg h-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 audio-glow transition-all duration-300 ease-out hover:scale-105"
          >
            <Link to="/stories">
              <Plus className="mr-2" size={20} />
              Upload Story
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}






// import React from "react";
// import { FileAudio, Plus } from "lucide-react";
// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { useAudioStore } from "@/lib/audioStore";

// export default function StoriesHeroSection() {
//   return (
//     <section
//       className="w-full flex flex-col items-center justify-center pt-[86px] pb-5 px-3 bg-background border-b border-primary/30 shadow-sm animate-fade-in"
//       style={{ minHeight: 110 }}
//     >
//       <div className="max-w-2xl w-full flex flex-col items-center text-center mb-3">
//         <div className="flex items-center gap-2 mb-2 text-primary">
//           <FileAudio size={28} />
//           <span className="font-neon text-2xl tracking-tight font-bold">Audio Stories</span>
//         </div>
//         <p className="text-muted-foreground text-base mb-3">
//           Listen, discover and share short audio stories, music, and podcasts from creators.<br />
//           Use the upload button to submit your own story!
//         </p>
//         <Button
//           asChild
//           variant="default"
//           className="font-neon px-5 py-2 text-base flex items-center gap-2"
//         >
//           <Link to="/stories">
//             <Plus className="mr-1" size={18} />
//             Upload Story
//           </Link>
//         </Button>
//       </div>
//     </section>
//   );
// }
