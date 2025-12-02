import { GoogleGenAI, Modality } from "@google/genai";
import { InterviewConfig, Message, AnalysisMetrics, QuestionPlanItem, CoTLog, QuestionAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Singleton
let audioContext: AudioContext | null = null;
export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// --- 1. PLANNER AGENT (State: INIT) ---
// Generates the interview roadmap based on JD/Resume
export const generateInterviewPlan = async (config: InterviewConfig): Promise<QuestionPlanItem[]> => {
  const prompt = `
    You are an Expert Interviewer. Create a structured interview plan.
    Role: ${config.role?.title} (${config.industry})
    Difficulty: ${config.difficulty}
    Duration: ${config.duration} minutes (Approx 5-8 questions).
    
    JD Context: ${config.jdText.substring(0, 500)}...
    Resume Context: ${config.resumeText.substring(0, 500)}...

    Return a JSON array of questions to cover specific competencies.
    Format:
    [
      { "id": "q1", "competency": "Introduction", "topic": "Ice breaker & Resume walk-through" },
      { "id": "q2", "competency": "Technical/Hard Skill", "topic": "Specific skill from JD" },
      ...
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Plan Gen Error", e);
    return [
      { id: "q1", competency: "Intro", topic: "Tell me about yourself", status: 'PENDING' },
      { id: "q2", competency: "Experience", topic: "Past Projects", status: 'PENDING' }
    ];
  }
};

// --- 2. REASONING AGENT (State: ANALYZE -> DECIDE) ---
// The core CoT Logic
interface CoTResponse {
  stepA_Goal: string;
  stepC_Analysis: {
    contentReasoning: string;
    deliveryReasoning: string;
    scores: { content: number; delivery: number };
    strengths: string[];
    weaknesses: string[];
  };
  stepD_Decision: {
    action: 'FOLLOW_UP' | 'NEXT_QUESTION' | 'WRAP_UP';
    reason: string;
  };
  nextMessage: string; // The actual text to speak
}

export const runCoTLoop = async (
  config: InterviewConfig,
  history: Message[],
  currentQuestion: string,
  userAnswer: string,
  metrics: AnalysisMetrics,
  currentCompetency: string
): Promise<CoTResponse> => {

  const perceptionSummary = `
  - Speech Rate: ${metrics.speechRate} WPM (Ideal: 120-160)
  - Pause Ratio: ${metrics.pauseRatio}%
  - Volume Stability: ${metrics.volumeStability}/10
  - Eye Contact: ${metrics.eyeContact}%
  - Confidence Score: ${metrics.confidence}/100
  `;

  const systemPrompt = `
  You are an AI Interview Orchestrator using Chain-of-Thought reasoning.
  Role: ${config.role?.title}. Target Competency: ${currentCompetency}.

  Follow this 4-Step Reasoning Process strictly:

  1. **Step A: Goal**
     Define what you are looking for in this specific answer (e.g., STAR method, technical depth).

  2. **Step B: Perception Summary** (Provided below)
     Analyze the biometric data provided.

  3. **Step C: Analysis (The Reasoning)**
     - Evaluate CONTENT: Did they answer the question? Is it specific?
     - Evaluate DELIVERY: Are they confident (Eye Contact > 60, Steady Volume)?
     - Assign scores (0-10).

  4. **Step D: Decision**
     - If Content Score < 6 OR Answer is too short: Action = FOLLOW_UP.
     - If Scores >= 6: Action = NEXT_QUESTION.
     - If Time is up: Action = WRAP_UP.

  Generate the response in JSON format matching the interface.
  "nextMessage" should be the natural language response to the candidate.
  `;

  const userPrompt = `
  [HISTORY]
  ${history.slice(-3).map(m => `${m.role}: ${m.text}`).join('\n')}

  [CURRENT INTERACTION]
  Interviewer: "${currentQuestion}"
  Candidate: "${userAnswer}"

  [PERCEPTION DATA]
  ${perceptionSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json' 
      }
    });

    let parsed: any = {};
    try {
        parsed = JSON.parse(response.text || "{}");
    } catch {
        parsed = {};
    }

    // --- DEFENSIVE PARSING ---
    // Ensure root is an object
    const root = (parsed && typeof parsed === 'object') ? parsed : {};

    // Ensure stepC_Analysis exists and is an object
    const stepC = (root.stepC_Analysis && typeof root.stepC_Analysis === 'object') 
      ? root.stepC_Analysis 
      : {};

    // Ensure scores exists and is an object (CRITICAL FIX for undefined 'scores')
    const scores = (stepC.scores && typeof stepC.scores === 'object') 
      ? stepC.scores 
      : { content: 5, delivery: 5 };
      
    const stepD = (root.stepD_Decision && typeof root.stepD_Decision === 'object') 
      ? root.stepD_Decision 
      : {};

    // Sanitize response to ensure complete CoTResponse structure
    const safeResponse: CoTResponse = {
      stepA_Goal: root.stepA_Goal || "Evaluate answer",
      stepC_Analysis: {
        contentReasoning: stepC.contentReasoning || "Analysis unavailable",
        deliveryReasoning: stepC.deliveryReasoning || "Analysis unavailable",
        scores: {
          content: typeof scores.content === 'number' ? scores.content : 5,
          delivery: typeof scores.delivery === 'number' ? scores.delivery : 5
        },
        strengths: Array.isArray(stepC.strengths) ? stepC.strengths : [],
        weaknesses: Array.isArray(stepC.weaknesses) ? stepC.weaknesses : []
      },
      stepD_Decision: {
        action: stepD.action || 'NEXT_QUESTION',
        reason: stepD.reason || 'Proceeding'
      },
      nextMessage: root.nextMessage || "Thank you. Let's move on."
    };

    return safeResponse;

  } catch (error) {
    console.error("CoT Error", error);
    return {
      stepA_Goal: "Evaluate answer",
      stepC_Analysis: {
        contentReasoning: "Error parsing response",
        deliveryReasoning: "Error parsing response",
        scores: { content: 5, delivery: 5 },
        strengths: [], weaknesses: []
      },
      stepD_Decision: { action: 'NEXT_QUESTION', reason: 'Fallback' },
      nextMessage: "Thank you. Let's move on."
    };
  }
};

// --- TTS SERVICE ---
export const synthesizeSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Manual PCM 16-bit Decoding
    // Gemini TTS typically returns raw PCM at 24kHz
    const ctx = getAudioContext();
    const audioBuffer = decodePCM16(bytes, ctx, 24000, 1);
    
    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
     ctx.resume().catch(console.error);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  return source;
};

// Helper: Decode raw PCM-16 (Signed 16-bit Little Endian)
function decodePCM16(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): AudioBuffer {
  // Create an AudioBuffer
  // Note: Float32Array length = data length / 2 (since 16-bit = 2 bytes)
  const frameCount = data.length / (numChannels * 2);
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  // Parse byte buffer as Int16 (Platform Endian, typically Little Endian for web)
  // Ensure we are reading from the correct offset if 'data' is a view
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    // If mono (1 channel), just copy. If stereo, data is interleaved (L, R, L, R...)
    // Gemini output is usually mono.
    if (numChannels === 1) {
      for (let i = 0; i < frameCount; i++) {
        // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
        channelData[i] = dataInt16[i] / 32768.0;
      }
    } else {
      // Interleaved logic (Future proofing)
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
  }

  return buffer;
}