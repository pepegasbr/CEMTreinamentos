
export interface User {
    nickname: string;
    instructorName: string;
}

export interface VFQuestion {
    question: string;
    answer: 'Verdadeiro' | 'Falso';
    justification: string;
}

export interface OpenAnswerQuestion {
    question: string;
    answer: string;
}

export type Question = VFQuestion | OpenAnswerQuestion;

export interface VFAnswer {
    question: string;
    userAnswer: 'Verdadeiro' | 'Falso';
    correctAnswer: 'Verdadeiro' | 'Falso';
    justification: string;
    isCorrect: boolean;
}

export interface OpenAnswer {
    question: string;
    userAnswer: string;
    correctAnswer: string;
}

export type Answer = VFAnswer | OpenAnswer;

export interface QuizSession {
    timestamp: string;
    instructorName: string;
    score?: string;
    answers: Answer[];
}

export interface AdminStudentData {
    [quizType: string]: QuizSession[];
}

export interface AllQuestions {
    vf: VFQuestion[];
    tdp: Record<string, OpenAnswerQuestion[]>;
    avdocRes: Record<string, OpenAnswerQuestion[]>;
    pulsoFirme: OpenAnswerQuestion[];
    fardas: OpenAnswerQuestion[];
}

export type Screen = 
    | 'loading' 
    | 'start' 
    | 'instructor' 
    | 'trainingSelection' 
    | 'tdpSelection' 
    | 'avdocResSelection' 
    | 'vfQuiz' 
    | 'openAnswerQuiz' 
    | 'vfResults' 
    | 'openAnswerResults' 
    | 'admin';

export interface QuizState {
    type: string;
    questions: Question[];
    answers: (string | 'Verdadeiro' | 'Falso')[];
    currentQuestionIndex: number;
    showQuestionNumber: boolean;
}

export interface Toast {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warn';
}

export interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
}
