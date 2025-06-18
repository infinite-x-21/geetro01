
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

export const createPlayerTrack = (audioUrl: string, coverUrl: string, title: string, artist: string, index: number = 0) => ({
  id: audioUrl + index,
  audioUrl,
  coverUrl,
  title,
  artist,
});