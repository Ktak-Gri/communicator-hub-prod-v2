
import React from 'react';

export type ActivePage = 'login' | 'home' | 'roleplay' | 'learning' | 'history' | 'center-summary' | 'center-registration' | 'admin' | 'preflight_error' | 'one-on-one' | 'learning-test' | 'learning-trainer' | null;

export interface Settings {
  selectedCenter: string | null;
  selectedScenario: Scenario | null;
}

export type Center = string;

export interface MasterDataItem {
  name: string;
}

export interface MasterSetting {
  name: string;
  abbreviation: string;
  displayFlag: boolean;
  sortOrder: number;
  showInSummary?: boolean;
}

export interface Scenario {
  id: string;
  internalId: string; // 内部管理用
  name: string;
  center: string;
  smartphonePlan: string;
  lightPlan: string;
  initialInquiry: string;
  difficulty: number;
  personality: string;
}

export interface TestQuestion {
  id: string;
  internalId: string; // 内部管理用
  name: string;
  center: string;
  questionText: string;
  answerText: string;
  difficulty: number;
  smartphonePlan?: string;
  lightPlan?: string;
}

export interface TranscriptItem {
  speaker: string;
  text: string;
}

export interface Persona {
  ageGroup: string;
  personality: string;
  knowledgeLevel: string;
  gender?: string;
}

export interface FeedbackData {
  scores: Record<string, number>;
  summary: string;
  keigoFeedback?: string;
  totalScore: number;
  traineeName: string;
  center: string;
  scenarioName: string;
  fullTranscript: TranscriptItem[];
  startTime?: string;
  scenarioInitialInquiry?: string;
  persona?: Persona;
  callDuration?: number;
  holdCount?: number;
  totalHoldTime?: number;
  fillerCount?: number;
  ngWordCount?: number;
}

export type DetailedComments = Record<string, string>;

export interface Trainee {
  traineeName: string;
  center: string;
  endDate?: string;
}

export interface SessionLog extends FeedbackData {
  scenarioId: string;
  timestamp: string;
}

export interface TestHistoryItem {
  timestamp: string;
  traineeName: string;
  center: string;
  questionId: string;
  questionText: string;
  userAnswer: string;
  aiFeedback: string;
  score: number;
  modelAnswer: string;
  difficulty: number;
}

export interface TestResult {
  score: number;
  evaluation: string;
  modelAnswer?: string;
}

export interface QuestioningTrainingLog {
  timestamp: string;
  traineeName: string;
  center: string;
  scenarioTopic: string;
  customerSituation: string;
  transcript: string;
  aiSummary: string;
  scores: QuestioningTrainingLogScores;
}

export interface QuestioningTrainingLogScores {
  informationGathering: number;
  hypothesisBuilding: number;
  questioningTechnique: number;
  initiative: number;
  problemIdentification: number;
}

export interface QuestioningTrainingTranscriptItem {
  speaker: 'user' | 'model' | 'system';
  text: string;
  feedback?: {
    questionType: string;
    suggestion: string;
  };
}

export interface SimulationResult {
  scenario: Scenario;
  transcript: TranscriptItem[];
  analysis: string;
  error?: string;
}

export interface ExportedSettings {
  scenarios: Scenario[];
  ngWords: string[];
  faqTopics: string[];
  testQuestions: TestQuestion[];
  masterSettings: MasterSetting[];
  trainees: Trainee[];
  apiKey: string | null;
}

export interface CenterDetails {
  groupTitle: string;
  name: string;
  abbr: string;
  sites?: string;
  location?: string;
  title: React.ReactNode;
  details: string[] | { col1: string[]; col2: string[]; col3: string[] };
  note?: string;
}

export interface OneOnOneSession {
  sessionId: string;
  caller: string;
  receiver: string;
  scenarioId: string;
  status: 'calling' | 'connected' | 'ended';
  transcript: TranscriptItem[];
  timestamp: number;
}
