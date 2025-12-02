import { AnalysisMetrics } from "../types";

// Types for Global Libraries (loaded via CDN in index.html)
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

/**
 * Real-time Analysis Service
 * Handles Web Audio API & MediaPipe Face Mesh
 */
class AnalysisService {
  // Audio
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // Rolling History for Fluctuating Metrics (Last 5 seconds)
  private speechHistory: { time: number; isSpeech: boolean }[] = [];
  private rmsValues: number[] = [];

  // Video (MediaPipe)
  private faceMesh: any | null = null;
  private camera: any | null = null;
  private gazeHistory: boolean[] = []; // true = looking at camera
  private lastVideoTimestamp: number = 0;

  // State
  private isRunning: boolean = false;
  
  // Current Real-time Metrics
  public currentMetrics: AnalysisMetrics = {
    speechRate: 0,
    pauseRatio: 0,
    volumeStability: 10,
    eyeContact: 100,
    confidence: 100,
    clarity: 8
  };

  /**
   * Initialize Audio Analysis
   */
  async initAudio(stream: MediaStream) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.isRunning = true;
    this.processAudioLoop();
  }

  /**
   * Initialize Video Analysis (FaceMesh)
   */
  async initVideo(videoElement: HTMLVideoElement) {
    if (!window.FaceMesh) {
      console.error("MediaPipe FaceMesh not loaded");
      return;
    }

    this.faceMesh = new window.FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(this.onFaceResults.bind(this));

    if (this.camera) {
       await this.camera.stop();
    }

    // Use MediaPipe Camera Utils to abstract rAF loop
    this.camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (this.faceMesh && videoElement) {
          await this.faceMesh.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480,
    });

    this.camera.start();
  }

  /**
   * Stop all sensors
   */
  stop() {
    this.isRunning = false;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.camera) {
      this.camera.stop();
    }
    this.rmsValues = [];
    this.gazeHistory = [];
    this.speechHistory = [];
  }

  // --- AUDIO PROCESSING LOGIC ---
  private processAudioLoop() {
    if (!this.isRunning || !this.analyser || !this.dataArray) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate RMS (Volume)
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    
    // Store RMS for stability calculation
    if (rms > 5) { // Lower threshold to capture quiet speech
        this.rmsValues.push(rms);
        if (this.rmsValues.length > 50) this.rmsValues.shift();
    }

    // Update Rolling Speech History
    const now = Date.now();
    const SILENCE_THRESHOLD = 15;
    const isSpeech = rms > SILENCE_THRESHOLD;
    
    this.speechHistory.push({ time: now, isSpeech });

    // Prune history older than 5 seconds for Real-Time Fluctuation
    const WINDOW_MS = 5000;
    if (this.speechHistory.length > 0) {
        // Simple optimization: only shift if oldest is expired
        if (now - this.speechHistory[0].time > WINDOW_MS) {
            this.speechHistory.shift();
        }
    }

    // Update Metrics
    this.calculateAudioMetrics();

    requestAnimationFrame(() => this.processAudioLoop());
  }

  private calculateAudioMetrics() {
    // 1. Volume Stability (Variance of RMS)
    let stability = 10;
    if (this.rmsValues.length > 10) {
      const mean = this.rmsValues.reduce((a, b) => a + b, 0) / this.rmsValues.length;
      const variance = this.rmsValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.rmsValues.length;
      // Map variance to 0-10 score (High variance = Low score)
      stability = Math.max(0, 10 - Math.sqrt(variance) / 5);
    }

    // 2. Pause Ratio & Speech Rate (Rolling Window)
    let speechFrames = 0;
    let totalFrames = this.speechHistory.length;

    if (totalFrames > 0) {
        for (const frame of this.speechHistory) {
            if (frame.isSpeech) speechFrames++;
        }
    }

    const speechRatio = totalFrames > 0 ? speechFrames / totalFrames : 0;
    const pauseRatio = (1 - speechRatio) * 100;

    // Estimate WPM: 
    // Avg speaking rate is ~150 wpm = ~2.5 words/sec.
    // We assume if speech is detected, they are speaking at avg rate.
    // Then we scale by intensity/density.
    // We project the current window to a minute.
    const activeSeconds = (speechFrames / 60); // approx 60fps rAF
    const windowSeconds = (totalFrames / 60);
    
    // WPM = (Words in Window) * (60 / WindowSeconds)
    // Words in Window ~= ActiveSeconds * 3 (approx 3 words per sec of continuous speech)
    const wpm = windowSeconds > 0 ? (activeSeconds * 3) * (60 / windowSeconds) : 0;

    this.currentMetrics.volumeStability = Number(stability.toFixed(1));
    this.currentMetrics.pauseRatio = Number(pauseRatio.toFixed(1));
    this.currentMetrics.speechRate = Math.round(wpm);
  }

  // --- VIDEO PROCESSING LOGIC ---
  private onFaceResults(results: any) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Gaze Estimation Logic (Simplified for 2D)
      // We assume user is looking at camera if Iris is roughly centered within the eye socket horizontally
      
      const isLooking = this.checkGaze(landmarks);
      this.gazeHistory.push(isLooking);
      if (this.gazeHistory.length > 30) this.gazeHistory.shift();

      // Calculate Score
      const eyeContactScore = (this.gazeHistory.filter(Boolean).length / this.gazeHistory.length) * 100;
      
      this.currentMetrics.eyeContact = Math.round(eyeContactScore);
      
      // Update Confidence (Composite Score)
      // Confidence = 0.6 * EyeContact + 0.4 * VolumeStability(mapped)
      this.currentMetrics.confidence = Math.round((this.currentMetrics.eyeContact * 0.6) + (this.currentMetrics.volumeStability * 10 * 0.4));
    } else {
      // No face detected
      this.currentMetrics.eyeContact = 0;
      this.currentMetrics.confidence = Math.max(0, this.currentMetrics.confidence - 5); // Decay if no face
    }
  }

  private checkGaze(landmarks: any[]): boolean {
    // Simplified heuristic: Check if nose tip (1) is horizontally centered
    // and eyes are open.
    const nose = landmarks[1];
    
    // Check if nose is pointing straight (x should be near 0.5 in normalized coords)
    const isCentered = nose.x > 0.4 && nose.x < 0.6;
    
    return isCentered;
  }
}

export const analysisService = new AnalysisService();