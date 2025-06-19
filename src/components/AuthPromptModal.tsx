import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
          {/* Music Note Character */}
          <div className="absolute -right-4 -top-4 w-32 h-32 z-10">
            <div className="relative w-full h-full">
              {/* Music Note */}
              <div className="absolute bottom-0 right-0 w-20 h-20">
                <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-400 animate-bounce">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              {/* Decorative Music Lines */}
              <div className="absolute top-0 right-12 w-8 h-8">
                <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-400/60 animate-pulse">
                  <path d="M8 8h2v8H8z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="relative z-20">
            <h2 className="text-2xl font-bold mb-2 text-amber-400">Time to Join the Music! 🎵</h2>
            <p className="text-lg text-zinc-300 mb-6">
              Get ready for an amazing musical journey! Sign up to unlock unlimited access to your favorite tunes.
            </p>
            
            <div className="grid gap-4">
              <Button 
                onClick={() => navigate('/auth?mode=signup')}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 text-lg rounded-xl relative overflow-hidden group"
              >
                <span className="relative z-10">Create Account</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/auth?mode=signin')}
                className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10 py-6 text-lg rounded-xl"
              >
                Sign In
              </Button>
              
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-300 text-sm mt-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
