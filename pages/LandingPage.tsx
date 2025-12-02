import React from 'react';
import GlassCard from '../components/GlassCard';
import { Play, Brain, Mic, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-sm font-medium mb-4 backdrop-blur-sm">
          Next-Gen AI Interview Coach
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-blue-200 drop-shadow-sm">
          Master Your Next <br/> Interview
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Experience hyper-realistic mock interviews driven by multimodal AI. 
          Get real-time feedback on your speech, body language, and content structure.
        </p>

        <div className="pt-8">
          <button 
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
          >
            <span>Start Practicing Now</span>
            <Play className="w-5 h-5 ml-2 fill-current group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 w-full">
        <FeatureCard 
          icon={<Brain className="w-6 h-6 text-purple-400" />}
          title="Reasoning Agent"
          description="AI that thinks before it asks. Adaptive questioning based on your responses."
        />
        <FeatureCard 
          icon={<Mic className="w-6 h-6 text-cyan-400" />}
          title="Multimodal Analysis"
          description="Real-time tracking of speech pace, filler words, and eye contact."
        />
        <FeatureCard 
          icon={<div className="w-6 h-6 flex items-center justify-center font-bold text-yellow-400 border border-yellow-400 rounded">JD</div>}
          title="Resume & JD Aware"
          description="Customized scenarios generated from your uploaded documents."
        />
        <FeatureCard 
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          title="Deep Analytics"
          description="Comprehensive feedback reports with actionable improvement tips."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <GlassCard className="flex flex-col items-start text-left h-full border-t-4 border-t-transparent hover:border-t-blue-400/50">
    <div className="p-3 rounded-xl bg-white/5 mb-4 border border-white/10">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </GlassCard>
);

export default LandingPage;
