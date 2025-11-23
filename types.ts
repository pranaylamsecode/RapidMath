export interface User {
  name: string;
  history: DrillResult[];
}

export interface Question {
  id: string;
  type: 'simplification' | 'series' | 'quadratic' | 'approximation';
  questionText: string;
  correctAnswer: string;
  explanation: string;
  options?: string[]; // Multiple choice options if applicable
}

export interface DrillResult {
  id: string;
  date: string;
  topic: string;
  score: number;
  totalQuestions: number;
  timeTaken: number; // in seconds
  accuracy: number;
  maxStreak: number;
  details: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    timeSpent: number;
  }[];
}

export type AppView = 'login' | 'dashboard' | 'drill' | 'analysis';

export enum QuestionType {
  SIMPLIFICATION = 'Simplification',
  SERIES = 'Number Series',
  QUADRATIC = 'Quadratic Equations',
  APPROXIMATION = 'Approximation'
}