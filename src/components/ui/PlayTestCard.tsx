import { useAudioStore } from "@/lib/audioStore";

const PlayTestCard = () => {
  const setCurrent = useAudioStore((s) => s.setCurrent);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <button
        onClick={() =>
          setCurrent({
            id: "demo1",
            title: "Demo Audio",
            artist: "Jay",
            image: "/lovable-uploads/demo.jpg",
            src: "/lovable-uploads/demo.mp3",
          })
        }
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
      >
        ▶️ Play Demo Audio
      </button>
    </div>
  );
};

export default PlayTestCard;
