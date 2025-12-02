import React from 'react';
import '../styles/global.css';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden text-gray-100 font-sans ${className}`}>
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        
        {/* 1. The Fluid Art Image (bg.png) */}
        {/* CRITICAL FIX: Use '/bg.png' (absolute path) instead of 'bg.png' so it loads from public root on all subpages. */}
        {/* Added a fallback color/gradient in case the image is missing or loading */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat 
                    transform scale-[1.15] animate-fluid animate-hue"
          style={{ backgroundImage: "url('/bg.png')" }} 
        />

        {/* 2. Dark Overlay (The "Dimmer") */}
        {/* This creates the 'Glass' effect. It darkens the image so white text pops. 
            Adjust opacity-70 up or down if you want the background brighter/darker. 
            We use a slate-950/blue-950 mix to keep the deep blue vibe. */}
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />

        {/* 3. Noise Texture (Kept from previous design for texture) */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        
        {/* 4. Vignette to focus center */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Layout;