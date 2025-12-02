// pages/FeedbackPages.tsx
import React, { useMemo } from 'react';
import { InterviewSession } from '../types';
import GlassCard from '../components/GlassCard';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts';
import { Download, Home, FileText, CheckCircle2, TrendingUp, Clock, Target, Award, Share2 } from 'lucide-react';

interface FeedbackPageProps {
  session: InterviewSession;
  onHome: () => void;
}

export default function FeedbackPage({ session, onHome }: FeedbackPageProps) {
  // --- 1. AGGREGATE CALCULATIONS ---
  const totalQuestions = Math.max(1, session.analyses.length);

  // Basic Averages
  const avgContent =
    Math.round(
      session.analyses.reduce((acc, curr) => acc + curr.contentScore, 0) /
        totalQuestions
    ) || 0;
  const avgDelivery =
    Math.round(
      session.analyses.reduce((acc, curr) => acc + curr.deliveryScore, 0) /
        totalQuestions
    ) || 0;

  // Sensor Averages
  const avgEyeContact =
    Math.round(
      session.analyses.reduce(
        (acc, curr) => acc + curr.metrics.eyeContact,
        0
      ) / totalQuestions
    ) || 0;
  const avgVolumeStab =
    session.analyses.reduce(
      (acc, curr) => acc + curr.metrics.volumeStability,
      0
    ) / totalQuestions || 0; // 0–10
  const avgSpeechRate =
    session.analyses.reduce(
      (acc, curr) => acc + curr.metrics.speechRate,
      0
    ) / totalQuestions || 0; // WPM
  const avgPauseRatio =
    session.analyses.reduce(
      (acc, curr) => acc + curr.metrics.pauseRatio,
      0
    ) / totalQuestions || 0; // %

  // --- 2. ADVANCED FORMULAS ---
  const speechRateNorm = Math.min(100, (avgSpeechRate / 150) * 100);
  const pauseRatioNorm = Math.max(0, 100 - avgPauseRatio * 2.5);
  const fluencyScore = Math.round(
    0.6 * speechRateNorm + 0.4 * pauseRatioNorm
  );
  const volStabNorm = avgVolumeStab * 10;
  const confidenceProxy = Math.round(
    0.45 * avgEyeContact + 0.35 * volStabNorm + 0.2 * fluencyScore
  );
  const overallScore = Math.round(((avgContent + avgDelivery) / 2) * 10);

  // --- 3. DATA PREP ---
  const radarData = [
    { subject: 'Content', A: avgContent * 10, fullMark: 100 },
    { subject: 'Vocal', A: volStabNorm, fullMark: 100 },
    { subject: 'ECI', A: avgEyeContact, fullMark: 100 },
    { subject: 'Confidence', A: confidenceProxy, fullMark: 100 },
    { subject: 'Fluency', A: fluencyScore, fullMark: 100 },
  ];

  const questionLineData = session.analyses.map((a, i) => ({
    name: `Q${i + 1}`,
    content_score: a.contentScore,
    delivery_score: a.deliveryScore,
  }));

  const historyData = useMemo(() => {
    const data = [
      { session: '1', score: 55, content: 5, delivery: 5 },
      { session: '2', score: 62, content: 6, delivery: 6 },
      { session: '3', score: 58, content: 6, delivery: 5 },
      { session: '4', score: 68, content: 7, delivery: 6 },
    ];
    const currentTotal = Math.round(
      (avgContent * 10 + avgDelivery * 10) / 2
    );
    data.push({
      session: 'Current',
      score: currentTotal,
      content: avgContent,
      delivery: avgDelivery,
    });
    return data;
  }, [avgContent, avgDelivery]);

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 animate-fade-in pb-12">

      {/* HEADER */}
      <div className="flex flex-col gap-6 pb-6 border-b border-white/5">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                Performance Report
              </h2>
              <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
                <span>Session ID: #{session.id.slice(-8)}</span>
                <span>•</span>
                <span>{new Date(session.startTime).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-all border border-white/5 font-medium">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-all border border-white/5 font-medium">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button 
                onClick={onHome}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all font-bold"
              >
                <Home className="w-4 h-4" /> New Session
              </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT STACK */}
            <div className="lg:col-span-8 space-y-4">
               {/* Job Metadata Bar */}
               <GlassCard className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-blue-900/5 border-blue-500/10">
                  {[
                  {
                     icon: <Target className="w-5 h-5" />,
                     bg: 'bg-blue-500/20 text-blue-400',
                     label: 'Target Role',
                     value: session.config.role?.title || 'Custom Role',
                  },
                  {
                     icon: <Award className="w-5 h-5" />,
                     bg: 'bg-purple-500/20 text-purple-400',
                     label: 'Industry',
                     value: session.config.industry.split('&')[0],
                  },
                  {
                     icon: <Clock className="w-5 h-5" />,
                     bg: 'bg-amber-500/20 text-amber-400',
                     label: 'Duration',
                     value: `${session.config.duration}m`,
                  },
                  {
                     icon: <TrendingUp className="w-5 h-5" />,
                     bg: 'bg-emerald-500/20 text-emerald-400',
                     label: 'Difficulty',
                     value: session.config.difficulty,
                  },
                  ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 flex-1">
                     <div className={`p-2 rounded-lg ${item.bg}`}>{item.icon}</div>
                     <div>
                        <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        {item.label}
                        </div>
                        <div className="font-bold text-white capitalize">
                        {item.value}
                        </div>
                     </div>
                  </div>
                  ))}
               </GlassCard>

               {/* Overall Score */}
               <GlassCard className="p-4 bg-gradient-to-b from-blue-900/10 to-transparent border-blue-500/20">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="flex flex-col items-center justify-center">
                     <div className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">
                        Overall Score
                     </div>
                     <div className="relative flex items-center justify-center w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90">
                        <circle
                           cx="48"
                           cy="48"
                           r="38"
                           fill="transparent"
                           stroke="#1e293b"
                           strokeWidth="8"
                        />
                        <circle
                           cx="48"
                           cy="48"
                           r="38"
                           fill="transparent"
                           stroke="#3b82f6"
                           strokeWidth="8"
                           strokeDasharray={238}
                           strokeDashoffset={238 - 238 * (overallScore / 100)}
                           strokeLinecap="round"
                        />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-white">
                           {overallScore}
                        </span>
                        <span className="text-[9px] text-gray-400">/ 100</span>
                        </div>
                     </div>
                  </div>

                  <div className="md:col-span-3 grid grid-cols-3 gap-4">
                     <GlassCard className="flex flex-col items-center justify-center p-3 bg-black/30 border-white/5">
                        <span className="text-lg font-bold text-white mb-0.5">
                        {session.analyses.length} / 10
                        </span>
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider text-center">
                        Questions Answered
                        </span>
                     </GlassCard>

                     <GlassCard className="flex flex-col items-center justify-center p-3 bg-black/30 border-white/5">
                        <span className="text-lg font-bold text-white mb-0.5">
                        {avgContent}/10
                        </span>
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider text-center">
                        Avg Content
                        </span>
                     </GlassCard>

                     <GlassCard className="flex flex-col items-center justify-center p-3 bg-black/30 border-white/5">
                        <span className="text-lg font-bold text-white mb-0.5">
                        {avgDelivery}/10
                        </span>
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider text-center">
                        Avg Delivery
                        </span>
                     </GlassCard>
                  </div>
                  </div>
               </GlassCard>
            </div>

            {/* RIGHT: Radar */}
            <GlassCard className="lg:col-span-4 flex flex-col h-full min-h-[260px]">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  Competency Radar
                  </h3>
               </div>
               <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                     cx="50%"
                     cy="55%"
                     outerRadius="75%"
                     data={radarData}
                  >
                     <PolarGrid stroke="rgba(255,255,255,0.08)" />
                     <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                     />
                     <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                     />
                     <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.4}
                     />
                     <Tooltip
                        contentStyle={{
                        backgroundColor: 'rgba(15,23,42,0.95)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#fff',
                        }}
                     />
                  </RadarChart>
                  </ResponsiveContainer>
               </div>
            </GlassCard>
         </div>

         {/* SESSION TIMELINE */}
         <GlassCard className="flex flex-col h-[260px]">
            <div className="mb-3 flex justify-between items-start">
            <div>
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" /> Session Timeline
               </h3>
               <p className="text-xs text-gray-400 mt-1">Delivery vs Content Score</p>
            </div>
            </div>

            <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={questionLineData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 11}} />
                  <YAxis stroke="#64748b" domain={[0, 10]} tick={{fontSize: 11}} />
                  <Line type="monotone" dataKey="content_score" stroke="#3b82f6" strokeWidth={3} />
                  <Line type="monotone" dataKey="delivery_score" stroke="#a855f7" strokeWidth={3} />
               </LineChart>
            </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* HISTORY TREND */}
         <GlassCard className="h-[220px] flex flex-col">
            <div className="mb-2 flex justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Clock className="w-5 h-5 text-emerald-400" /> History & Progress
            </h3>
            </div>

            <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={historyData}>
                  <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fill="#10b98155" 
                  />
               </AreaChart>
            </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* DETAILED ASSESSMENT */}
         <div className="pt-8 border-t border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
               <FileText className="w-6 h-6 text-gray-400" />
               AI Assessment
            </h3>

            <div className="grid gap-6">
               {session.analyses.map((analysis, idx) => (
                  <GlassCard 
                  key={idx} 
                  className="group hover:bg-white/10 transition-colors"
                  >
                  <div className="flex flex-col gap-5">
                     <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                           <div className="flex-none w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/30">
                              {idx + 1}
                           </div>
                           <div>
                              <h4 className="text-lg font-bold text-white mb-1">
                                 {analysis.questionText}
                              </h4>
                              <div className="flex gap-3 text-xs">
                                 <span className="text-gray-400">
                                 Competency:{" "}
                                 <span className="text-gray-200 font-semibold">
                                    {session.config.role?.title} Fit
                                 </span>
                                 </span>
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <div className="flex flex-col items-center px-3 py-1 rounded bg-black/40 border border-white/5">
                              <span className="text-[10px] text-gray-500 uppercase font-bold">Content</span>
                              <span 
                                 className={`text-lg font-bold ${
                                 analysis.contentScore >= 7 ? "text-green-400" : "text-amber-400"
                                 }`}
                              >
                                 {analysis.contentScore}
                              </span>
                           </div>
                           <div className="flex flex-col items-center px-3 py-1 rounded bg-black/40 border border-white/5">
                              <span className="text-[10px] text-gray-500 uppercase font-bold">Delivery</span>
                              <span 
                                 className={`text-lg font-bold ${
                                 analysis.deliveryScore >= 7 ? "text-green-400" : "text-amber-400"
                                 }`}
                              >
                                 {analysis.deliveryScore}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-black/30 p-4 rounded-xl text-gray-300 text-sm italic border-l-2 border-blue-500/30 relative">
                        <span className="absolute top-2 left-2 text-blue-500/20 text-4xl font-serif">"</span>
                        <p className="pl-4 relative z-10">{analysis.userAnswer}</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div>
                           <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" /> Strengths
                           </h5>
                           <ul className="space-y-2">
                              {analysis.strengths.map((s, i) => (
                                 <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                 <span className="w-1 h-1 rounded-full bg-green-500 mt-2 flex-none" />
                                 {s}
                                 </li>
                              ))}
                           </ul>
                        </div>
                        <div>
                           <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Target className="w-3 h-3" /> Areas to Improve
                           </h5>
                           <ul className="space-y-2">
                              {analysis.weaknesses.map((w, i) => (
                                 <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                 <span className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-none" />
                                 {w}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                  </div>
                  </GlassCard>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
