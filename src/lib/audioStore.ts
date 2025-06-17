
import { create } from 'zustand';

type Audio = {
  id: string;
  title: string;
  artist: string;
  image: string;
  src: string;
};

type State = {
  current: Audio | null;
  isPlaying: boolean;
  setCurrent: (audio: Audio) => void;
  togglePlay: () => void;
  setPlaying: (play: boolean) => void;
};

export const useAudioStore = create<State>((set) => ({
  current: null,
  isPlaying: false,
  setCurrent: (audio) => set({ current: audio }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (play) => set({ isPlaying: play }),
}));
