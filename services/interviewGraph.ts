import { InterviewState, GraphNode, InterviewConfig, Message, AnalysisMetrics, CoTLog, QuestionAnalysis, QuestionPlanItem } from "../types";
import { generateInterviewPlan, runCoTLoop, synthesizeSpeech, playAudioBuffer } from "./geminiService";
import { analysisService } from "./analysisService";

// --- THE LANGGRAPH ORCHESTRATOR ---
// This class mimics the behavior of a LangGraph StateGraph (Nodes, Edges, State)

export class InterviewGraph {
  private state: InterviewState;
  private listeners: ((state: InterviewState) => void)[] = [];
  
  constructor(config: InterviewConfig) {
    this.state = {
      config,
      currentNode: GraphNode.INIT,
      plan: [],
      currentQuestionIndex: 0,
      transcript: [],
      metricsHistory: [],
      cotHistory: [],
      currentQuestionText: "",
      currentAnswerText: "",
    };
  }

  // Subscribe UI to State Changes
  public subscribe(callback: (state: InterviewState) => void) {
    this.listeners.push(callback);
    callback(this.state); // Initial emission
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private updateState(partial: Partial<InterviewState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(l => l(this.state));
  }

  // --- TRANSITIONS (EDGES) ---

  public async start() {
    this.updateState({ currentNode: GraphNode.INIT });
    await this.node_Init();
  }

  // NODE 1: INIT
  private async node_Init() {
    console.log("[Graph] State: INIT");
    const plan = await generateInterviewPlan(this.state.config);
    
    // Set first question active
    if (plan.length > 0) plan[0].status = 'ACTIVE';

    this.updateState({ 
      plan, 
      currentNode: GraphNode.ASK,
      currentQuestionText: `Welcome to the interview for the ${this.state.config.role?.title} role. Let's start with: ${plan[0].topic}?`
    });

    // Auto-transition to Ask
    await this.node_Ask();
  }

  // NODE 2: ASK (Execute Action)
  private async node_Ask() {
    console.log("[Graph] State: ASK");
    
    // 1. Synthesize Speech
    const textToSpeak = this.state.currentQuestionText;
    
    // Update transcript
    const newHistory = [
      ...this.state.transcript,
      { role: 'ai', text: textToSpeak, timestamp: Date.now() } as Message
    ];
    this.updateState({ transcript: newHistory });

    // Play Audio
    const buffer = await synthesizeSpeech(textToSpeak);
    if (buffer) {
       const source = playAudioBuffer(buffer);
       // Ensure smooth flow: Wait for audio to finish before transitioning state
       source.onended = () => {
         // Small delay for natural turn-taking
         setTimeout(() => {
            this.updateState({ currentNode: GraphNode.LISTEN });
         }, 300);
       };
    } else {
       // Fallback
       this.updateState({ currentNode: GraphNode.LISTEN });
    }
  }

  // NODE 3: LISTEN (Wait for User Input - Handled by UI Trigger)
  // This is a "Human-in-the-loop" node. The graph pauses here until user finishes speaking.
  public async submitAnswer(answerText: string) {
    if (this.state.currentNode !== GraphNode.LISTEN) return;

    console.log("[Graph] State: LISTEN -> Received Answer");
    
    // Capture Snapshot of Metrics immediately
    const metricsSnapshot = { ...analysisService.currentMetrics };
    
    const newHistory = [
      ...this.state.transcript,
      { role: 'user', text: answerText, timestamp: Date.now() } as Message
    ];

    this.updateState({ 
      transcript: newHistory,
      currentAnswerText: answerText,
      metricsHistory: [...this.state.metricsHistory, metricsSnapshot],
      currentNode: GraphNode.ANALYZE 
    });

    await this.node_Analyze(metricsSnapshot);
  }

  // NODE 4: ANALYZE (Reasoning CoT)
  private async node_Analyze(metrics: AnalysisMetrics) {
    console.log("[Graph] State: ANALYZE");

    const currentPlanItem = this.state.plan[this.state.currentQuestionIndex] || { competency: 'General' };

    // CALL THE REASONING AGENT
    const cotResult = await runCoTLoop(
      this.state.config,
      this.state.transcript,
      this.state.currentQuestionText,
      this.state.currentAnswerText,
      metrics,
      currentPlanItem.competency
    );

    // LOG THE THOUGHT PROCESS
    const newCoTLog: CoTLog = {
      stepId: Date.now().toString(),
      timestamp: Date.now(),
      goal: cotResult.stepA_Goal,
      perception: `Speech: ${metrics.speechRate}wpm, Eye: ${metrics.eyeContact}%`,
      analysis: JSON.stringify(cotResult.stepC_Analysis.scores),
      decision: `${cotResult.stepD_Decision.action} because ${cotResult.stepD_Decision.reason}`
    };

    // SAVE ANALYSIS
    const analysis: QuestionAnalysis = {
      questionId: this.state.currentQuestionIndex,
      questionText: this.state.currentQuestionText,
      userAnswer: this.state.currentAnswerText,
      metrics: metrics,
      contentScore: cotResult.stepC_Analysis.scores.content,
      deliveryScore: cotResult.stepC_Analysis.scores.delivery,
      feedback: cotResult.stepC_Analysis.contentReasoning,
      strengths: cotResult.stepC_Analysis.strengths,
      weaknesses: cotResult.stepC_Analysis.weaknesses
    };

    this.updateState({ 
      cotHistory: [...this.state.cotHistory, newCoTLog],
      lastAnalysis: analysis,
      currentNode: GraphNode.DECIDE
    });

    await this.node_Decide(cotResult, analysis);
  }

  // NODE 5: DECIDE (Routing)
  private async node_Decide(cotResult: any, analysis: QuestionAnalysis) {
    console.log("[Graph] State: DECIDE", cotResult.stepD_Decision.action);

    const action = cotResult.stepD_Decision.action;
    const nextMessage = cotResult.nextMessage;

    if (action === 'WRAP_UP' || this.state.currentQuestionIndex >= this.state.plan.length - 1) {
       this.updateState({ currentNode: GraphNode.WRAP_UP });
       // End Session Logic would be triggered by UI observing this state
    } else if (action === 'FOLLOW_UP') {
       // Stay on current question index, but update text
       this.updateState({
         currentQuestionText: nextMessage,
         currentNode: GraphNode.ASK
       });
       await this.node_Ask();
    } else {
       // NEXT_QUESTION
       const nextIndex = this.state.currentQuestionIndex + 1;
       const nextPlanItem = this.state.plan[nextIndex];
       
       // Update Plan Status
       const newPlan = [...this.state.plan];
       newPlan[this.state.currentQuestionIndex].status = 'COMPLETED';
       newPlan[nextIndex].status = 'ACTIVE';

       // If the AI didn't provide a specific question text for the *new* topic in the CoT,
       // we might need to generate it. But for simplicity, we use the CoT's `nextMessage` 
       // which usually bridges to the next topic naturally.
       
       this.updateState({
         plan: newPlan,
         currentQuestionIndex: nextIndex,
         currentQuestionText: nextMessage,
         currentNode: GraphNode.ASK
       });
       await this.node_Ask();
    }
  }
}