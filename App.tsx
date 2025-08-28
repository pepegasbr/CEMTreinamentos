
import React, { useState, useEffect, useCallback } from 'react';
import { AllQuestions, Screen, User, QuizState, VFQuestion, OpenAnswerQuestion, Question, VFAnswer, OpenAnswer, Toast, ModalState } from './types';
import { LS_KEYS, TOTAL_FARDAS_QUESTIONS, TOTAL_VF_QUESTIONS, DOC_IDS } from './constants';
import { loadQuizData, sendDataToSpreadsheet } from './services/apiService';

// Import Screens
import LoadingScreen from './components/screens/LoadingScreen';
import StartScreen from './components/screens/StartScreen';
import AplicadorScreen from './components/screens/InstructorScreen';
import TrainingSelectionScreen from './components/screens/TrainingSelectionScreen';
import TdpSelectionScreen from './components/screens/TdpSelectionScreen';
import AvdocResSelectionScreen from './components/screens/AvdocResSelectionScreen';
import VfQuizScreen from './components/screens/VfQuizScreen';
import OpenAnswerQuizScreen from './components/screens/OpenAnswerQuizScreen';
import VfResultsScreen from './components/screens/VfResultsScreen';
import OpenAnswerResultsScreen from './components/screens/OpenAnswerResultsScreen';
import AdminScreen from './components/screens/AdminScreen';
import SubmittingScreen from './components/screens/SubmittingScreen';

// Import UI
import Header from './components/Header';
import Footer from './components/Footer';
import Modal from './components/ui/Modal';
import { ToastContainer } from './components/ui/Toast';


const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>('loading');
    const [loadingStatus, setLoadingStatus] = useState('Iniciando...');
    const [allQuestions, setAllQuestions] = useState<Partial<AllQuestions>>({});
    const [user, setUser] = useState<User | null>(null);
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '' });

    // --- Effects ---
    useEffect(() => {
        // App starts immediately, no data preloading.
        setScreen('start');
    }, []);

    // --- Helper Functions ---
    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const newToast: Toast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const showAlert = (message: string, title = 'Atenção') => {
        setModal({ isOpen: true, title, message });
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const resetToHome = () => {
        setQuizState(null);
        setScreen('trainingSelection');
    };

    // --- Screen Handlers ---
    const handleStart = (nickname: string) => {
        if (nickname.toLowerCase() === '/admin') {
            setScreen('admin');
            return;
        }
        setUser({ nickname, aplicadorName: '' });
        localStorage.setItem(LS_KEYS.NICK, nickname);
        setScreen('aplicador');
    };

    const handleAplicador = (aplicadorName: string) => {
        if (user) {
            setUser({ ...user, aplicadorName });
            localStorage.setItem(LS_KEYS.APLICADOR, aplicadorName);
            setScreen('trainingSelection');
        }
    };

    const handleTrainingSelect = async (quizKey: 'vf' | 'tdp' | 'avdocRes' | 'pulsoFirme' | 'fardas') => {
        const proceedToQuiz = (currentQuestions: Partial<AllQuestions>) => {
            if (!currentQuestions) return;
            
            switch (quizKey) {
                case 'vf':
                    if (!currentQuestions.vf) return;
                    const vfQuestions = shuffleArray(currentQuestions.vf).slice(0, TOTAL_VF_QUESTIONS);
                    startQuiz(vfQuestions, 'Verdadeiro ou Falso', true);
                    break;
                case 'tdp':
                    setScreen('tdpSelection');
                    break;
                case 'avdocRes':
                    setScreen('avdocResSelection');
                    break;
                case 'pulsoFirme':
                    if (!currentQuestions.pulsoFirme) return;
                    startQuiz(currentQuestions.pulsoFirme, 'Pulso Firme & Rigidez', true);
                    break;
                case 'fardas':
                    if (!currentQuestions.fardas) return;
                    const fardasQuestions = shuffleArray(currentQuestions.fardas).slice(0, TOTAL_FARDAS_QUESTIONS);
                    startQuiz(fardasQuestions, 'Treinamento de Fardas', true);
                    break;
            }
        };

        if (allQuestions[quizKey]) {
            proceedToQuiz(allQuestions);
        } else {
            setScreen('loading');
            const keyMap = { vf: 'VF', tdp: 'TDP', avdocRes: 'AVDOC_RES', pulsoFirme: 'PULSO_FIRME', fardas: 'FARDAS' };
            try {
                const data = await loadQuizData(keyMap[quizKey] as keyof typeof DOC_IDS, setLoadingStatus);
                const newQuestionsState = { ...allQuestions, [quizKey]: data };
                setAllQuestions(newQuestionsState);
                proceedToQuiz(newQuestionsState);
            } catch (error) {
                console.error("Failed to load quiz data:", error);
                showAlert(`Falha ao carregar o treinamento. Tente novamente mais tarde.`);
                setScreen('trainingSelection');
            }
        }
    };

    const startQuiz = (questions: Question[], type: string, showQuestionNumber: boolean) => {
        if (questions.length === 0) {
            showAlert(`Não foi possível carregar as perguntas para "${type}".`);
            return;
        }
        setQuizState({
            type,
            questions,
            answers: [],
            currentQuestionIndex: 0,
            showQuestionNumber,
        });
        setScreen(type === 'Verdadeiro ou Falso' ? 'vfQuiz' : 'openAnswerQuiz');
    };
    
    // --- Quiz Logic Handlers ---
    const handleVfAnswer = (answer: 'Verdadeiro' | 'Falso') => {
        if (!quizState) return;
        const newAnswers = [...quizState.answers, answer];
        if (quizState.currentQuestionIndex + 1 >= quizState.questions.length) {
            setQuizState({ ...quizState, answers: newAnswers });
            setScreen('submitting');
        } else {
            setQuizState({
                ...quizState,
                answers: newAnswers,
                currentQuestionIndex: quizState.currentQuestionIndex + 1,
            });
        }
    };

    const handleVfBack = () => {
        if (!quizState || quizState.currentQuestionIndex === 0) return;
        setQuizState({
            ...quizState,
            answers: quizState.answers.slice(0, -1),
            currentQuestionIndex: quizState.currentQuestionIndex - 1,
        });
    };
    
    const handleOpenAnswerSubmit = (answer: string) => {
        if (!quizState) return;
        const newAnswers = [...quizState.answers, answer];
        if (quizState.currentQuestionIndex + 1 >= quizState.questions.length) {
            setQuizState({ ...quizState, answers: newAnswers });
            setScreen('submitting');
        } else {
            setQuizState({
                ...quizState,
                answers: newAnswers,
                currentQuestionIndex: quizState.currentQuestionIndex + 1,
            });
        }
    };
    
    // --- Results Processing ---
    useEffect(() => {
        const processAndSendResults = async () => {
            if (!user || !quizState || !quizState.questions) return;

            const isVfQuiz = quizState.type === 'Verdadeiro ou Falso';

            if (isVfQuiz) {
                const vfAnswers: VFAnswer[] = quizState.questions.map((q, i) => {
                    const question = q as VFQuestion;
                    const userAnswer = quizState.answers[i] as 'Verdadeiro' | 'Falso';
                    return {
                        question: question.question,
                        userAnswer,
                        correctAnswer: question.answer,
                        justification: question.justification,
                        isCorrect: userAnswer === question.answer,
                    };
                });
                const score = vfAnswers.filter(a => a.isCorrect).length;
                try {
                    await sendDataToSpreadsheet({ nickname: user.nickname, aplicadorName: user.aplicadorName, quizType: quizState.type, score: `${score}/${vfAnswers.length}`, answers: vfAnswers });
                    addToast('Respostas enviadas com sucesso!', 'success');
                } catch(e) {
                    showAlert('Erro ao enviar respostas. Verifique sua conexão.');
                }
                setScreen('vfResults');
            } else {
                const oaAnswers: OpenAnswer[] = quizState.questions.map((q, i) => {
                    const question = q as OpenAnswerQuestion;
                    return {
                        question: question.question,
                        userAnswer: quizState.answers[i] as string,
                        correctAnswer: question.answer
                    };
                });
                 try {
                    await sendDataToSpreadsheet({ nickname: user.nickname, aplicadorName: user.aplicadorName, quizType: quizState.type, answers: oaAnswers });
                    addToast('Respostas enviadas com sucesso!', 'success');
                } catch(e) {
                    showAlert('Erro ao enviar respostas. Verifique sua conexão.');
                }
                setScreen('openAnswerResults');
            }
        };

        if (screen === 'submitting') {
            processAndSendResults();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);
    
    // --- Render Logic ---
    const renderScreen = () => {
        switch (screen) {
            case 'loading': return <LoadingScreen status={loadingStatus} />;
            case 'start': return <StartScreen onNext={handleStart} />;
            case 'aplicador': return <AplicadorScreen onStart={handleAplicador} />;
            case 'admin': return <AdminScreen onExit={() => window.location.reload()} />;
            case 'submitting': return <SubmittingScreen />;
            case 'trainingSelection': return user && <TrainingSelectionScreen user={user} onSelect={handleTrainingSelect} />;
            case 'tdpSelection': return <TdpSelectionScreen tdpQuestionsByEval={allQuestions.tdp!} onSelect={(q, type) => startQuiz(q, type, true)} />;
            case 'avdocResSelection': return <AvdocResSelectionScreen avdocResQuestions={allQuestions.avdocRes!} onSelect={(q, type) => startQuiz(q, type, true)} />;
            case 'vfQuiz':
                if (quizState) {
                    const q = quizState.questions[quizState.currentQuestionIndex] as VFQuestion;
                    return <VfQuizScreen key={quizState.currentQuestionIndex} question={q} current={quizState.currentQuestionIndex} total={quizState.questions.length} onAnswer={handleVfAnswer} onBack={handleVfBack} />;
                }
                break;
            case 'openAnswerQuiz':
                if (quizState) {
                    const q = quizState.questions[quizState.currentQuestionIndex] as OpenAnswerQuestion;
                    return <OpenAnswerQuizScreen key={quizState.currentQuestionIndex} question={q} current={quizState.currentQuestionIndex} total={quizState.questions.length} showQuestionNumber={quizState.showQuestionNumber} quizType={quizState.type} onSubmit={handleOpenAnswerSubmit} />;
                }
                break;
            case 'vfResults':
                 if (quizState && user) {
                    const vfAnswers: VFAnswer[] = quizState.questions.map((q, i) => {
                        const question = q as VFQuestion;
                        const userAnswer = quizState.answers[i] as 'Verdadeiro' | 'Falso';
                        return { question: question.question, userAnswer, correctAnswer: question.answer, justification: question.justification, isCorrect: userAnswer === question.answer };
                    });
                    return <VfResultsScreen user={user} answers={vfAnswers} onRestart={resetToHome} />;
                }
                break;
            case 'openAnswerResults':
                 if (quizState && user) {
                     const oaAnswers: OpenAnswer[] = quizState.questions.map((q, i) => ({
                         question: (q as OpenAnswerQuestion).question,
                         userAnswer: quizState.answers[i] as string,
                         correctAnswer: (q as OpenAnswerQuestion).answer
                     }));
                    return <OpenAnswerResultsScreen user={user} answers={oaAnswers} onRestart={resetToHome} quizType={quizState.type}/>;
                }
                break;
        }
        return <LoadingScreen status="Carregando..." />;
    };

    return (
        <div className="flex flex-col min-h-screen items-center space-y-4">
            <Header user={user} quizType={quizState?.type || 'Seleção'} onGoHome={resetToHome} screen={screen} />
            <main className="flex-grow flex items-center justify-center w-full px-4">
                {renderScreen()}
            </main>
            <Footer />
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />
        </div>
    );
};

export default App;