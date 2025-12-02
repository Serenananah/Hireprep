
export enum Page {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  SETUP = 'SETUP',
  INTERVIEW = 'INTERVIEW',
  FEEDBACK = 'FEEDBACK'
}

export enum Difficulty {
  EASY = 'Easy',
  STANDARD = 'Standard',
  HARD = 'Hard'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  createdAt?: number;
}

export interface JobRole {
  id: string;
  industry: string;
  title: string;
  level: string;
  tags?: string[];
}

// --- PERCEPTION & METRICS ---
export interface AnalysisMetrics {
  speechRate: number;      // WPM (Words Per Minute)
  pauseRatio: number;      // % of silence
  volumeStability: number; // 0-10 Score (based on RMS Variance)
  eyeContact: number;      // % of time looking at camera
  confidence: number;      // 0-100 Score
  clarity: number;         // 0-10 Score
}

// --- COT (CHAIN OF THOUGHT) STRUCTURES ---
export interface CoTLog {
  stepId: string;
  timestamp: number;
  goal: string;          // Step A: Goal
  perception: string;    // Step B: Perception Summary
  analysis: string;      // Step C: Analysis (Reasoning)
  decision: string;      // Step D: Decision
}

// --- INTERVIEW PLAN ---
export interface QuestionPlanItem {
  id: string;
  competency: string;    // e.g., "Communication", "Leadership"
  topic: string;         // e.g., "Conflict Resolution"
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED';
}

// --- LANGGRAPH STATE ---
export enum GraphNode {
  INIT = 'INIT',
  ASK = 'ASK',
  LISTEN = 'LISTEN',
  ANALYZE = 'ANALYZE',
  DECIDE = 'DECIDE',
  WRAP_UP = 'WRAP_UP',
  END = 'END'
}

export interface InterviewState {
  // Static Config
  config: InterviewConfig;
  
  // Dynamic Flow
  currentNode: GraphNode;
  plan: QuestionPlanItem[];
  currentQuestionIndex: number;
  
  // Data Accumulation
  transcript: Message[];
  metricsHistory: AnalysisMetrics[];
  cotHistory: CoTLog[]; // The "Brain" logs
  
  // Current Turn Data
  currentQuestionText: string;
  currentAnswerText: string;
  lastAnalysis?: QuestionAnalysis;
}

export interface InterviewConfig {
  industry: string;
  role: JobRole | null;
  duration: number; // minutes
  difficulty: Difficulty;
  jdText: string;
  resumeText: string;
}

export interface Message {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export interface QuestionAnalysis {
  questionId: number;
  questionText: string;
  userAnswer: string;
  metrics: AnalysisMetrics;
  contentScore: number; 
  deliveryScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  transcript: Message[];
  analyses: QuestionAnalysis[];
  startTime: number;
  endTime?: number;
}
