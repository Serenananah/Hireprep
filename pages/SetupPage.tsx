
import React, { useState, useMemo } from 'react';
import { User, InterviewConfig, JobRole, Difficulty } from '../types';
import { INDUSTRIES, JOB_ROLES, MOCK_JD_TEXT, MOCK_RESUME_TEXT } from '../constants';
import GlassCard from '../components/GlassCard';
import { fileService, ParsedDocument } from '../services/fileService';
import { Upload, CheckCircle, Briefcase, Clock, Gauge, ArrowRight, ChevronDown, Loader2 } from 'lucide-react';

interface SetupPageProps {
  user: User | null;
  onStartInterview: (config: InterviewConfig) => void;
}

const SetupPage: React.FC<SetupPageProps> = ({ user, onStartInterview }) => {
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [duration, setDuration] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.STANDARD);
  
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Filter roles based on selected industry
  const filteredRoles = useMemo(() => {
    return JOB_ROLES.filter(role => role.industry === industry);
  }, [industry]);

  const handleStart = async () => {
    setIsProcessing(true);
    
    try {
      let jdText = MOCK_JD_TEXT;
      let resumeText = MOCK_RESUME_TEXT;
      let jdDoc: ParsedDocument | null = null;
      let resumeDoc: ParsedDocument | null = null;

      // 1. Process JD
      if (jdFile) {
        setLoadingStep("Parsing Job Description...");
        jdDoc = await fileService.processFile(jdFile);
        jdText = jdDoc.text;
      }

      // 2. Process Resume
      if (resumeFile) {
        setLoadingStep("Parsing Resume PDF...");
        resumeDoc = await fileService.processFile(resumeFile);
        resumeText = resumeDoc.text;
      }

      // 3. Simulate Backend Indexing (Embeddings -> DB)
      setLoadingStep("Generating Embeddings & Indexing...");
      await fileService.initializeRagSession(user?.id || 'guest', jdDoc, resumeDoc);

      // 4. Start Session
      onStartInterview({
        industry,
        role: selectedRole,
        duration,
        difficulty,
        jdText,     // Now contains REAL text from PDF
        resumeText  // Now contains REAL text from PDF
      });

    } catch (error) {
      console.error("Setup Error:", error);
      alert("Failed to process files. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
            Interview Setup
          </h2>
          <p className="text-gray-400 mt-3 text-lg">
            Configure your simulation environment
          </p>
        </div>
        <div className="text-right hidden md:block">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-mono">
              <span>SESSION ID:</span>
              <span className="font-bold text-white">{Date.now().toString().slice(-6)}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Role Selection (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          <GlassCard className="space-y-8 p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-900/20">
                 <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Target Position</h3>
                <p className="text-gray-400 text-sm">Select the industry and specific role you are applying for.</p>
              </div>
            </div>

            <div className="space-y-8">
               {/* Industry Dropdown */}
               <div className="relative z-20">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3 block ml-1">Select Industry</label>
                  <div className="relative group">
                    <select
                      value={industry}
                      onChange={(e) => {
                        setIndustry(e.target.value);
                        setSelectedRole(null);
                      }}
                      disabled={isProcessing}
                      className="w-full appearance-none bg-black/40 border border-white/10 text-white text-lg rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer hover:border-white/20 disabled:opacity-50"
                    >
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind} className="bg-slate-900 text-white py-2">
                          {ind}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-white transition-colors">
                      <ChevronDown className="w-6 h-6" />
                    </div>
                  </div>
               </div>

               {/* Roles Grid */}
               <div className="pt-8 border-t border-white/5">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-6 block ml-1">
                    Available Roles in {industry.split('&')[0]}
                  </label>
                  
                  {filteredRoles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredRoles.map(role => (
                        <GlassCard 
                          key={role.id} 
                          onClick={() => !isProcessing && setSelectedRole(role)}
                          selected={selectedRole?.id === role.id}
                          hoverEffect={!isProcessing}
                          className={`group p-5 relative overflow-hidden ${isProcessing ? 'cursor-default opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                              selectedRole?.id === role.id 
                                ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' 
                                : 'bg-white/5 border-white/10 text-gray-500'
                            }`}>
                               {role.level}
                            </span>
                            {role.tags?.includes('Popular') && (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Popular
                              </span>
                            )}
                          </div>
                          
                          <h4 className={`text-lg font-bold mb-4 transition-colors relative z-10 ${selectedRole?.id === role.id ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                            {role.title}
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 relative z-10">
                            {role.tags?.map(tag => tag !== 'Popular' && (
                              <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-gray-500 border border-white/10 bg-black/20 px-2 py-1 rounded group-hover:border-white/20 transition-colors">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Selection Indicator Background */}
                          {selectedRole?.id === role.id && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none" />
                          )}
                        </GlassCard>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-black/20">
                      <p>No specific roles configured for this industry in the demo.</p>
                    </div>
                  )}
               </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Configuration & Upload (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Settings Card */}
          <GlassCard className="space-y-8 p-8">
            <div className="flex items-center gap-4 mb-2">
               <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-900/20">
                  <Gauge className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white">Parameters</h3>
                  <p className="text-gray-400 text-sm">Session Difficulty & Time</p>
               </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2 ml-1">
                  <Clock className="w-3 h-3" /> Duration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 20, 30].map(m => (
                    <button
                      key={m}
                      disabled={isProcessing}
                      onClick={() => setDuration(m)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                        duration === m 
                        ? 'bg-blue-600/20 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'bg-black/20 border-transparent text-gray-500 hover:bg-white/5 hover:border-white/10'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3 block ml-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {[Difficulty.EASY, Difficulty.STANDARD, Difficulty.HARD].map(d => (
                    <button
                      key={d}
                      disabled={isProcessing}
                      onClick={() => setDifficulty(d)}
                      className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all group ${
                        difficulty === d 
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 text-white' 
                        : 'bg-black/20 border-transparent text-gray-500 hover:bg-white/5 hover:border-white/10'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-sm font-bold">{d}</span>
                      <div className={`w-3 h-3 rounded-full transition-all ${
                        d === Difficulty.EASY ? 'bg-emerald-400' :
                        d === Difficulty.STANDARD ? 'bg-amber-400' : 'bg-rose-500'
                      } ${difficulty === d ? 'shadow-[0_0_8px_currentColor] scale-110' : 'opacity-40 group-hover:opacity-70'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Upload Card */}
          <GlassCard className="p-8">
             <div className="flex items-center gap-4 mb-6">
               <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-900/20">
                  <Upload className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white">Context</h3>
                  <p className="text-gray-400 text-sm">Upload JD & Resume</p>
               </div>
            </div>

            <div className="space-y-4">
              <UploadBox 
                label="Job Description" 
                file={jdFile} 
                onUpload={setJdFile} 
                accept=".pdf,.txt"
                disabled={isProcessing}
              />
              <UploadBox 
                label="Resume / CV" 
                file={resumeFile} 
                onUpload={setResumeFile} 
                accept=".pdf"
                disabled={isProcessing}
              />
            </div>
            {isProcessing && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-blue-300 font-mono animate-pulse">{loadingStep}</span>
              </div>
            )}
          </GlassCard>

          <button
            onClick={handleStart}
            disabled={!selectedRole || isProcessing}
            className="w-full group relative py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xl shadow-xl shadow-blue-900/40 transition-all hover:shadow-blue-900/60 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center justify-center gap-3">
              {isProcessing ? 'Initializing Environment...' : 'Start Simulation'} 
              {!isProcessing && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
};

const UploadBox = ({ label, file, onUpload, accept, disabled }: { label: string, file: File | null, onUpload: (f: File) => void, accept: string, disabled: boolean }) => (
  <div className={`relative group h-20 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <input 
      type="file" 
      accept={accept}
      onChange={(e) => e.target.files && onUpload(e.target.files[0])}
      disabled={disabled}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    />
    <div className={`
      absolute inset-0 border border-dashed rounded-xl flex items-center px-5 gap-4 transition-all duration-300
      ${file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-black/20 group-hover:border-blue-400/30 group-hover:bg-blue-900/5'}
    `}>
      <div className={`p-2 rounded-lg transition-colors flex-shrink-0 ${file ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500 group-hover:text-blue-400'}`}>
        {file ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{file ? file.name : label}</p>
        <p className="text-[10px] uppercase tracking-wider text-gray-600 group-hover:text-gray-500 mt-0.5">{file ? 'Ready to analyze' : 'PDF / TXT support'}</p>
      </div>
    </div>
  </div>
);

export default SetupPage;
