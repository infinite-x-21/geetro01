import React from "react";

export default function WelcomeSection() {
  return (
    <section className="w-full flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-28 h-28 animate-astronaut-swing mb-4">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Helmet */}
          <circle cx="32" cy="24" r="16" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          {/* Visor */}
          <ellipse cx="32" cy="24" rx="10" ry="8" fill="#b3d0f7" opacity="0.7" />
          {/* Body */}
          <rect x="24" y="36" width="16" height="18" rx="6" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          {/* Left Arm (waving) */}
          <rect x="8" y="36" width="14" height="6" rx="3" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" transform="rotate(-25 15 38)" />
          {/* Right Arm (up, waving) */}
          <rect x="44" y="28" width="8" height="16" rx="4" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          {/* Legs */}
          <rect x="26" y="54" width="4" height="8" rx="2" fill="#bfc9d9" />
          <rect x="34" y="54" width="4" height="8" rx="2" fill="#bfc9d9" />
        </svg>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-amber-500 mb-2">Welcome to GeetroX!</h1>
      <p className="text-zinc-700 text-lg md:text-xl max-w-xl text-center mb-4">Our little astronaut is happy to see you 🎉<br/>Enjoy your musical journey and explore trending music, podcasts, and stories!</p>
    </section>
  );
}
