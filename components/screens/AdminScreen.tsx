
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Loader from '../ui/Loader';
import { AdminStudentData, QuizSession, Answer } from '../../types';
import { LS_KEYS } from '../../constants';
import { searchStudent } from '../../services/apiService';

interface AdminScreenProps {
    onExit: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onExit }) => {
    const [nickToSearch, setNickToSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [studentData, setStudentData] = useState<AdminStudentData | null>(null);
    
    const [filterQuiz, setFilterQuiz] = useState(localStorage.getItem(LS_KEYS.ADMIN_FILTER) || 'all');
    const [sortOrder, setSortOrder] = useState(localStorage.getItem(LS_KEYS.ADMIN_SORT) || 'newest');

    useEffect(() => {
        localStorage.setItem(LS_KEYS.ADMIN_FILTER, filterQuiz);
        localStorage.setItem(LS_KEYS.ADMIN_SORT, sortOrder);
    }, [filterQuiz, sortOrder]);

    const handleSearch = async () => {
        if (!nickToSearch.trim()) {
            setError('Por favor, digite o nick do aluno.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStudentData(null);
        try {
            const data = await searchStudent(nickToSearch.trim());
            setStudentData(data);
        } catch (err: any) {
            setError(err.message || 'Falha ao buscar dados.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getFilteredData = (): AdminStudentData => {
        if (!studentData) return {};

        let filtered = {};
        if (filterQuiz === 'all') {
            filtered = { ...studentData };
        } else if (studentData[filterQuiz]) {
            filtered = { [filterQuiz]: studentData[filterQuiz] };
        }

        Object.keys(filtered).forEach(quizType => {
            (filtered as AdminStudentData)[quizType].sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
        });
        return filtered;
    };

    const filteredData = getFilteredData();
    const quizTypes = studentData ? ['all', ...Object.keys(studentData).sort()] : ['all'];

    return (
        <Card className="w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-white text-center">Painel do Instrutor</h2>
            <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3 mb-4">
                <Input
                    icon="🏷️"
                    type="text"
                    value={nickToSearch}
                    onChange={e => setNickToSearch(e.target.value)}
                    placeholder="Digite o nick do aluno"
                    className="flex-grow"
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Buscando...' : 'Buscar'}
                </Button>
            </form>

            {studentData && (
                 <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <div className="flex-1">
                        <label htmlFor="admin-filter-quiz" className="block text-sm font-medium text-slate-300 mb-1">Filtrar por Treinamento</label>
                        <Select id="admin-filter-quiz" value={filterQuiz} onChange={e => setFilterQuiz(e.target.value)}>
                            {quizTypes.map(type => (
                                <option key={type} value={type}>{type === 'all' ? 'Todos os Treinamentos' : type}</option>
                            ))}
                        </Select>
                    </div>
                     <div className="flex-1">
                        <label htmlFor="admin-sort-order" className="block text-sm font-medium text-slate-300 mb-1">Ordenar por</label>
                        <Select id="admin-sort-order" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            <option value="newest">Mais Recentes</option>
                            <option value="oldest">Mais Antigos</option>
                        </Select>
                    </div>
                </div>
            )}
            
            <div className="space-y-6 mt-6">
                {isLoading && <div className="flex justify-center"><Loader /></div>}
                {error && <p className="text-center text-red-400">{error}</p>}
                {!isLoading && !studentData && !error && (
                    <p className="text-center text-slate-400">Digite um nick para ver o histórico de treinamentos.</p>
                )}
                {!isLoading && studentData && Object.keys(filteredData).length === 0 && (
                    <p className="text-center text-slate-400">Nenhum treinamento encontrado para este aluno com o filtro aplicado.</p>
                )}
                {!isLoading && Object.entries(filteredData).map(([quizType, sessions]) => (
                    <div key={quizType} className="p-4 border border-slate-700 bg-slate-800/50 rounded-lg">
                        <h3 className="text-xl font-bold text-white">{quizType}</h3>
                        {sessions.map((session, idx) => <SessionDetails key={idx} session={session} />)}
                    </div>
                ))}
            </div>

            <div className="text-center mt-8">
                <Button variant="ghost" onClick={onExit}>Sair do Painel</Button>
            </div>
        </Card>
    );
};


const SessionDetails: React.FC<{session: QuizSession}> = ({ session }) => (
    <details className="mt-4 p-3 border border-slate-600 rounded-md group transition-colors hover:bg-slate-700/30">
        <summary className="cursor-pointer select-none flex items-center justify-between text-white list-none [&::-webkit-details-marker]:hidden">
            <div>
                <span className="text-sm text-slate-400">
                    <strong>Instrutor:</strong> {session.instructorName || '—'} | <strong>Data:</strong> {new Date(session.timestamp).toLocaleString('pt-BR')}
                </span>
                {session.score && <div className="font-bold text-lg text-[var(--theme-blue)]">Pontuação: {session.score}</div>}
            </div>
            <span className="text-xs text-slate-400 group-open:hidden">Mostrar</span>
            <span className="text-xs text-slate-400 hidden group-open:inline">Ocultar</span>
        </summary>
        <div className="mt-4 space-y-2">
            {session.answers.map((ans, index) => <AnswerDetails key={index} ans={ans} index={index} />)}
        </div>
    </details>
);

const AnswerDetails: React.FC<{ans: Answer, index: number}> = ({ ans, index }) => {
    const isVF = 'isCorrect' in ans;
    const color = isVF ? (ans.isCorrect ? 'green' : 'red') : 'slate';
    const hasJustification = isVF && ans.justification;

    return (
        <div className={`p-3 border-l-4 border-${color}-500 bg-slate-900/50 rounded-r-md`}>
            <p className="font-semibold text-slate-300">{index + 1}. {ans.question}</p>
            <p className="text-sm text-blue-400 mt-1 ml-4"><strong>Resposta do Aluno:</strong> {ans.userAnswer}</p>
            <p className="text-sm text-green-400 mt-1 ml-4"><strong>Gabarito:</strong> {ans.correctAnswer}</p>
            {hasJustification && <p className="text-xs text-slate-400 italic mt-1 ml-4"><strong>Justificativa:</strong> {ans.justification}</p>}
        </div>
    );
};

export default AdminScreen;
