import React, { useState, useEffect, useRef } from 'react';
import { InterviewSession, InterviewState, GraphNode, AnalysisMetrics } from '../types';
import GlassCard from '../components/GlassCard';
import { Mic, Video, VideoOff, Power, MessageSquare, BrainCircuit, User, Activity } from 'lucide-react';
import Webcam from 'react-webcam';
import { analysisService } from '../services/analysisService';
import { InterviewGraph } from '../services/interviewGraph';

interface InterviewPageProps {
  session: InterviewSession;
  onEndInterview: (s: InterviewSession) => void;
}

const InterviewPage: React.FC<InterviewPageProps> = ({ session, onEndInterview }) => {
  // --- STATE ---
  const [graph, setGraph] = useState<InterviewGraph | null>(null);
  const [graphState, setGraphState] = useState<InterviewState | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // UI Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [userAnswerText, setUserAnswerText] = useState("");
  
  // Refs
  const webcamRef = useRef<Webcam>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // --- INIT GRAPH ---
  useEffect(() => {
    const newGraph = new InterviewGraph(session.config);
    const unsubscribe = newGraph.subscribe((state) => {
      setGraphState(state);
    });
    setGraph(newGraph);
    return () => unsubscribe();
  }, [session.config]);

  // --- LIVE METRICS ---
  const [liveMetrics, setLiveMetrics] = useState<AnalysisMetrics>({
    speechRate: 0, pauseRatio: 0, volumeStability: 10, eyeContact: 100, clarity: 8, confidence: 100
  });

  useEffect(() => {
    if (isStarted) {
      const interval = setInterval(() => {
        setLiveMetrics({ ...analysisService.currentMetrics });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isStarted]);

  // Scroll Transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [graphState?.transcript, userAnswerText]);


  // --- HANDLERS ---
  const handleStartInteraction = async () => {
    setIsStarted(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      analysisService.initAudio(stream);
      if (webcamRef.current && webcamRef.current.video) {
        analysisService.initVideo(webcamRef.current.video);
      }
    } catch (e) {
      console.error("Sensors failed", e);
    }

    graph?.start();
  };

  const startRecording = () => {
    setIsRecording(true);
    setUserAnswerText("");

    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) setUserAnswerText(prev => prev + final + " ");
      };

      recognition.start();
      (window as any).recognitionInstance = recognition;
    }
  };

  const finishRecording = () => {
    setIsRecording(false);
    if ((window as any).recognitionInstance) (window as any).recognitionInstance.stop();
    graph?.submitAnswer(userAnswerText || "(No verbal answer provided)");
    setUserAnswerText("");
  };

  if (!graphState) return <div className="p-10 text-white">Initializing Graph...</div>;

  const currentNode = graphState.currentNode;
  const isAnalyzing = currentNode === GraphNode.ANALYZE || currentNode === GraphNode.DECIDE;
  const isSpeaking = currentNode === GraphNode.ASK;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-screen px-2 py-2">
      

      {/* --- START OVERLAY --- */}
      {!isStarted && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md p-8 bg-black/50 border border-white/10 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white">Initialize AI Agent</h2>
            <p className="text-gray-300">Start the Interview Graph engine and biometric sensors.</p>
            <button 
              onClick={handleStartInteraction} 
              className="w-full py-4 bg-blue-600 rounded-xl text-white font-bold hover:scale-105 transition-all"
            >
              Start Session
            </button>
          </div>
        </div>
      )}


      {/* ============================
          LEFT MAIN COLUMN (2/3)
      ============================= */}
      <div className="flex-[2] flex flex-col gap-4 min-w-0">

        {/* Avatar / Intro Panel */}
        <div className="relative h-[300px] md:h-[360px] rounded-3xl overflow-hidden shadow-xl bg-black border border-white/10 flex-none">
          
          {/* Background blur gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 opacity-70" />

          {/* Centered avatar */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="relative mb-4">
              <div className={`w-32 h-32 rounded-full blur-[45px] ${isSpeaking ? 'bg-cyan-400/50 scale-125' : 'bg-blue-500/20'} transition-all duration-500`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-24 h-24 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl ${isSpeaking ? 'scale-105 border-cyan-300/40' : ''}`}>
                  <User className={`w-10 h-10 ${isSpeaking ? 'text-cyan-300' : 'text-blue-300'}`} />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white drop-shadow-md">Sarah - AI Interviewer</h2>

            <div className="px-3 py-1 mt-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-[10px] font-mono font-bold text-white">
              {isSpeaking ? "SPEAKING" : isAnalyzing ? "THINKING" : "LISTENING"}
            </div>
          </div>
        </div>


        {/* Current Question */}
        <GlassCard className="p-5 flex flex-col justify-center bg-blue-900/10 border-blue-500/20 shadow-lg">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Current Question
          </span>
          <h3 className="text-base md:text-base text-white">
            {graphState.currentQuestionText || "Waiting to start..."}
          </h3>
        </GlassCard>


        {/* Live Transcript (only user messages) */}
        <GlassCard className="h-[150px] bg-black/30 flex flex-col relative overflow-hidden">
          
          <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Live Transcription
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

            {graphState.transcript.filter(msg => msg.role === 'user').length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-60">
                <MessageSquare className="w-8 h-8 mb-2" />
                <span className="text-sm italic">Your speech will appear here...</span>
              </div>
            )}

            {graphState.transcript
              .filter(msg => msg.role === "user")
              .map((msg, idx) => (
                <div key={idx} className="flex flex-row-reverse gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    ME
                  </div>
                  <div className="p-3 rounded-2xl text-sm bg-emerald-500/10 text-emerald-100 border border-emerald-500/20">
                    {msg.text}
                  </div>
                </div>
              ))}

            {isRecording && (
              <div className="flex flex-row-reverse gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="p-3 rounded-2xl text-sm bg-white/5 text-gray-400 border border-white/20">
                  {userAnswerText || "Listening..."}
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </GlassCard>

      </div>



      {/* ============================
          RIGHT COLUMN — fixed width 350px
      ============================= */}
      <div className="w-full lg:w-[350px] flex flex-col gap-4 flex-shrink-0">

        {/* Webcam */}
        <GlassCard className="aspect-video p-0 overflow-hidden relative bg-black rounded-3xl border border-white/20 shadow-xl">
          {camOn ? (
            <Webcam ref={webcamRef} className="w-full h-full object-cover scale-x-[-1]" audio={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <VideoOff className="opacity-50" />
            </div>
          )}

          <div className="absolute top-3 right-3 px-2 py-1 bg-red-500/90 text-[10px] font-bold text-white rounded shadow">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block mr-1" />
            LIVE
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
            <div className="text-white text-sm font-bold">Your Feed</div>
          </div>
        </GlassCard>


        {/* Live AI Analysis */}
        <GlassCard className="p-6 space-y-4 text-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Activity className="w-3 h-3 text-blue-400" /> Live AI Analysis
          </div>

          {/* Confidence */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Confidence</span>
              <span>{liveMetrics.confidence}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${liveMetrics.confidence}%` }} />
            </div>
          </div>

          {/* Eye Contact */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Eye Contact</span>
              <span>{liveMetrics.eyeContact}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${liveMetrics.eyeContact > 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${liveMetrics.eyeContact}%` }} />
            </div>
          </div>

          {/* Speech Pace */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
              <span>Speech Pace</span>
              <span>{Math.min(100, Math.round((liveMetrics.speechRate / 160) * 100))}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (liveMetrics.speechRate / 160) * 100)}%` }} />
            </div>
          </div>
        </GlassCard>


        {/* Tips */}
        <GlassCard className="p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Tips</div>
          <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
            <li>Maintain eye contact with the camera</li>
            <li>Speak clearly and at a moderate pace</li>
            <li>Use specific examples in your answers</li>
          </ul>
        </GlassCard>

        {/* Bottom Controls */}
        <div className="mt-2 flex items-center gap-3">

          {/* Media Toggle Buttons */}
          <div className="flex gap-2">
            {/* Mic */}
            <button
              onClick={() => setMicOn(!micOn)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all 
                ${micOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
              <Mic size={20} />
            </button>

            {/* Camera */}
            <button
              onClick={() => setCamOn(!camOn)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all 
                ${camOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>

          {/* Main Action */}
          <div className="flex-1">
            {isRecording ? (
              <button
                onClick={finishRecording}
                className="w-full h-12 flex items-center justify-center gap-3 bg-red-600 text-white rounded-xl font-bold border border-red-400/20">
                Stop & Submit
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={currentNode !== GraphNode.LISTEN}
                className="w-full h-12 flex items-center justify-center gap-3 bg-blue-600 text-white rounded-xl font-bold border border-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {currentNode === GraphNode.INIT ? 'Initializing...' : 'Start Answering'}
              </button>
            )}
          </div>

          {/* End Interview */}
          <button
            onClick={() => onEndInterview(session)}
            className="px-6 h-12 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 font-bold text-gray-400 flex items-center gap-2">
            <Power size={18} />
            <span className="hidden sm:inline">End</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewPage;
