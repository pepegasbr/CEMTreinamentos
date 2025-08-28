import { DOC_IDS, SCRIPT_URL, PROXY_URL, DOCS_URL_PREFIX, DOCS_URL_SUFFIX } from '../constants';
import { AllQuestions, OpenAnswerQuestion, VFQuestion, AdminStudentData, Answer } from '../types';

// --- Parsers ---

function parseVFQuestions(text: string): VFQuestion[] {
    const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const questionRegex = /\d{1,3}\.\s[\s\S]*?(?=\n+\d{1,3}\.\s|$)/g;
    const blocks = cleanText.match(questionRegex);
    if (!blocks) return [];
    
    return blocks.map(block => {
        if (!block || block.trim() === '') return null;
        const cleanBlock = block.trim();
        const answerMarker = 'R:';
        const answerIndex = cleanBlock.toUpperCase().indexOf(answerMarker);
        if (answerIndex === -1) return null;

        const questionText = cleanBlock.substring(0, answerIndex).replace(/^\d{1,3}\.\s*/, '').trim();
        const answerBlock = cleanBlock.substring(answerIndex + answerMarker.length).trim();
        let correctAnswer: 'Verdadeiro' | 'Falso' | null = null;
        let justification = '';

        if (answerBlock.toLowerCase().startsWith('verdadeiro')) {
            correctAnswer = 'Verdadeiro';
            justification = answerBlock.substring('verdadeiro'.length).replace(/^[\.\s]*/, '').trim();
        } else if (answerBlock.toLowerCase().startsWith('falso')) {
            correctAnswer = 'Falso';
            justification = answerBlock.substring('falso'.length).replace(/^[\.\s]*/, '').trim();
        } else {
            return null;
        }

        return { question: questionText, answer: correctAnswer, justification };
    }).filter((q): q is VFQuestion => q !== null);
}

function parseOpenAnswerDoc(text: string, targetObject?: Record<string, OpenAnswerQuestion[]>, sectionRegex?: RegExp): OpenAnswerQuestion[] {
    const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    if (!sectionRegex) {
        const questionRegex = /\d{1,3}\.\s[\s\S]*?(?=\n+\d{1,3}\.\s|$)/g;
        const blocks = cleanText.match(questionRegex);
        if (!blocks) return [];
        return blocks.map(block => {
            if (!block || block.trim() === '') return null;
            const cleanBlock = block.trim();
            const answerMarker = 'R:';
            const answerIndex = cleanBlock.toUpperCase().indexOf(answerMarker);
            const questionText = (answerIndex !== -1 ? cleanBlock.substring(0, answerIndex) : cleanBlock).replace(/^\d{1,3}\.\s*/, '').trim();
            const answerText = (answerIndex !== -1 ? cleanBlock.substring(answerIndex + answerMarker.length) : 'Sem resposta no gabarito.').trim();
            return { question: questionText, answer: answerText };
        }).filter((q): q is OpenAnswerQuestion => q !== null);
    }

    if (targetObject) {
        const sections = cleanText.split(sectionRegex).slice(1);
        for (let i = 0; i < sections.length; i += 2) {
            const sectionName = sections[i];
            const content = sections[i + 1] ? sections[i + 1].trim() : '';
            if (content) {
                targetObject[sectionName] = parseOpenAnswerDoc(content);
            }
        }
    }
    return [];
}


// --- API Calls ---

async function fetchDocContent(docId: string, setLoadingStatus: (status: string) => void, docName: string): Promise<string> {
    const targetUrl = `${DOCS_URL_PREFIX}${docId}${DOCS_URL_SUFFIX}`;
    const requestUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
    
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(requestUrl);
            if (!response.ok) {
                throw new Error(`Falha na rede ao buscar via proxy: ${response.statusText}`);
            }
            
            const content = await response.text();
            if (content) {
                 // Verifica se o Google retornou uma página de erro HTML em vez de texto puro
                if (content.trim().startsWith('<!DOCTYPE html>')) {
                    throw new Error(`O documento ${docName} pode ser privado ou a URL está incorreta.`);
                }
                return content;
            } else {
                throw new Error(`Conteúdo de ${docName} está vazio.`);
            }
        } catch (error) {
            attempts++;
            console.error(`Failed to fetch ${docName} (attempt ${attempts}):`, error);
            setLoadingStatus(`Tentando novamente ${docName}... (${attempts}/${maxAttempts})`);
            if (attempts >= maxAttempts) {
                throw new Error(`Falha ao carregar ${docName} após ${maxAttempts} tentativas.`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error(`Falha ao carregar ${docName}.`);
}


export async function preloadAllData(setLoadingStatus: (status: string) => void): Promise<AllQuestions> {
    setLoadingStatus('Carregando todos os treinamentos...');

    const docsToFetch = [
        { key: 'VF', id: DOC_IDS.VF, name: 'Verdadeiro ou Falso' },
        { key: 'TDP', id: DOC_IDS.TDP, name: 'Treinamento Documental' },
        { key: 'AVDOC_RES', id: DOC_IDS.AVDOC_RES, name: 'Avaliação / Resolução' },
        { key: 'PULSO_FIRME', id: DOC_IDS.PULSO_FIRME, name: 'Pulso Firme & Rigidez' },
        { key: 'FARDAS', id: DOC_IDS.FARDAS, name: 'Treinamento de Fardas' },
    ];

    try {
        const docPromises = docsToFetch.map(doc =>
            fetchDocContent(doc.id, setLoadingStatus, doc.name)
        );

        const [vfText, tdpText, avdocResText, pulsoFirmeText, fardasText] = await Promise.all(docPromises);

        setLoadingStatus('Processando dados...');
        
        const allQuestions: AllQuestions = {
            vf: [],
            tdp: {},
            avdocRes: {},
            pulsoFirme: [],
            fardas: [],
        };

        allQuestions.vf = parseVFQuestions(vfText);
        parseOpenAnswerDoc(tdpText, allQuestions.tdp, /\[(AV\d+)\]/g);
        parseOpenAnswerDoc(avdocResText, allQuestions.avdocRes, /\[(AVDOC|RES)\]/g);
        allQuestions.pulsoFirme = parseOpenAnswerDoc(pulsoFirmeText);
        allQuestions.fardas = parseOpenAnswerDoc(fardasText);
        
        setLoadingStatus('Tudo pronto!');
        return allQuestions;

    } catch (error) {
        console.error("Error preloading data:", error);
        // Rethrow the error to be caught by the caller in App.tsx
        throw error;
    }
}

export async function sendDataToSpreadsheet(data: {
    nickname: string;
    instructorName: string;
    quizType: string;
    score?: string;
    answers: Answer[];
}): Promise<void> {
    if (!SCRIPT_URL) {
        console.error("SCRIPT_URL is not set. Cannot send data.");
        throw new Error("A aplicação não está configurada para salvar os resultados.");
    }

    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        body: JSON.stringify(data),
        redirect: 'follow'
    });
}

export async function searchStudent(nickname: string): Promise<AdminStudentData> {
    const response = await fetch(`${SCRIPT_URL}?action=search&nickname=${encodeURIComponent(nickname)}`);
    if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
    const results = await response.json();
    if (results.error) throw new Error(results.error);
    return results.data || {};
}