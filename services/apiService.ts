import {
    DOC_FETCH_TIMEOUT_MS,
    DOC_IDS,
    DOCS_CACHE_TTL_MS,
    DOCS_CACHE_VERSION,
    DOCS_URL_PREFIX,
    DOCS_URL_SUFFIX,
    LS_KEYS,
    SCRIPT_URL,
} from '../constants';
import { OpenAnswerQuestion, VFQuestion, AdminStudentData, Answer } from '../types';

type DocKey = keyof typeof DOC_IDS;
type QuizData = VFQuestion[] | Record<string, OpenAnswerQuestion[]> | OpenAnswerQuestion[];

interface CachedQuizPayload {
    version: string;
    savedAt: number;
    data: QuizData;
}

interface FetchSource {
    name: string;
    buildUrl: (targetUrl: string) => string;
}

const memoryCache = new Map<DocKey, QuizData>();
const pendingLoads = new Map<DocKey, Promise<QuizData>>();

const DOC_NAME_MAP: Record<DocKey, string> = {
    VF: 'Verdadeiro ou Falso',
    TDP: 'Treinamento Documental',
    AVDOC_RES: 'Avaliação / Resolução',
    PULSO_FIRME: 'Pulso Firme & Rigidez',
    FARDAS: 'Treinamento de Fardas',
};

const DOC_FETCH_SOURCES: FetchSource[] = [
    {
        name: 'CodeTabs',
        buildUrl: (targetUrl) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    },
    {
        name: 'AllOrigins',
        buildUrl: (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    },
    {
        name: 'CORSProxy',
        buildUrl: (targetUrl) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    },
];

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

function parseQuizData(key: DocKey, text: string): QuizData {
    switch (key) {
        case 'VF':
            return parseVFQuestions(text);
        case 'TDP': {
            const tdpData: Record<string, OpenAnswerQuestion[]> = {};
            parseOpenAnswerDoc(text, tdpData, /\[(AV\d+)\]/g);
            return tdpData;
        }
        case 'AVDOC_RES': {
            const avdocData: Record<string, OpenAnswerQuestion[]> = {};
            parseOpenAnswerDoc(text, avdocData, /\[(AVDOC|RES)\]/g);
            return avdocData;
        }
        case 'PULSO_FIRME':
            return parseOpenAnswerDoc(text);
        case 'FARDAS':
            return parseOpenAnswerDoc(text);
    }
}

// --- Cache helpers ---

function getStorageKey(key: DocKey): string {
    return `${LS_KEYS.QUIZ_CACHE_PREFIX}:${key}`;
}

function readPersistentCache(key: DocKey, allowStale = false): QuizData | null {
    if (typeof window === 'undefined') return null;

    try {
        const rawPayload = window.localStorage.getItem(getStorageKey(key));
        if (!rawPayload) return null;

        const payload = JSON.parse(rawPayload) as CachedQuizPayload;
        if (
            !payload
            || payload.version !== DOCS_CACHE_VERSION
            || typeof payload.savedAt !== 'number'
            || payload.data == null
        ) {
            window.localStorage.removeItem(getStorageKey(key));
            return null;
        }

        const isFresh = Date.now() - payload.savedAt < DOCS_CACHE_TTL_MS;
        if (!isFresh && !allowStale) {
            return null;
        }

        memoryCache.set(key, payload.data);
        return payload.data;
    } catch (error) {
        console.warn(`Falha ao ler cache local de ${key}.`, error);
        return null;
    }
}

function savePersistentCache(key: DocKey, data: QuizData): void {
    if (typeof window === 'undefined') return;

    const payload: CachedQuizPayload = {
        version: DOCS_CACHE_VERSION,
        savedAt: Date.now(),
        data,
    };

    try {
        window.localStorage.setItem(getStorageKey(key), JSON.stringify(payload));
    } catch (error) {
        console.warn(`Falha ao salvar cache local de ${key}.`, error);
    }
}

export function getCachedQuizData(key: DocKey): QuizData | null {
    const memoryValue = memoryCache.get(key);
    if (memoryValue) {
        return memoryValue;
    }

    return readPersistentCache(key);
}

// --- Network helpers ---

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function validateDocContent(content: string, docName: string, sourceName: string): string {
    const trimmed = content.trim();
    if (!trimmed) {
        throw new Error(`${sourceName} retornou ${docName} vazio.`);
    }

    const lowerTrimmed = trimmed.toLowerCase();
    if (
        lowerTrimmed.startsWith('<!doctype html')
        || lowerTrimmed.startsWith('<html')
        || lowerTrimmed.includes('<body')
    ) {
        throw new Error(`${sourceName} retornou HTML no lugar do TXT de ${docName}.`);
    }

    return trimmed;
}

async function fetchTextFromSource(targetUrl: string, source: FetchSource, docName: string, signal: AbortSignal): Promise<string> {
    const response = await fetch(source.buildUrl(targetUrl), {
        signal,
        cache: 'default',
    });

    if (!response.ok) {
        throw new Error(`${source.name} respondeu ${response.status} para ${docName}.`);
    }

    const content = await response.text();
    return validateDocContent(content, docName, source.name);
}

async function fetchDocContent(docId: string, setLoadingStatus: (status: string) => void, docName: string): Promise<string> {
    const targetUrl = `${DOCS_URL_PREFIX}${docId}${DOCS_URL_SUFFIX}`;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controllers = DOC_FETCH_SOURCES.map(() => new AbortController());
        const timers = controllers.map(controller => setTimeout(() => controller.abort(), DOC_FETCH_TIMEOUT_MS));

        try {
            setLoadingStatus(
                attempt === 1
                    ? `Buscando ${docName} por rotas alternativas...`
                    : `Nova tentativa para ${docName}...`
            );

            const content = await Promise.any(
                DOC_FETCH_SOURCES.map((source, index) =>
                    fetchTextFromSource(targetUrl, source, docName, controllers[index].signal)
                )
            );

            return content;
        } catch (error) {
            console.error(`Falha ao buscar ${docName} na tentativa ${attempt}.`, error);

            if (attempt >= maxAttempts) {
                throw new Error(`Falha ao carregar ${docName} pelas rotas disponíveis.`);
            }

            setLoadingStatus(`Ainda não foi possível carregar ${docName}. Tentando novamente...`);
            await wait(900);
        } finally {
            timers.forEach(timer => clearTimeout(timer));
            controllers.forEach(controller => controller.abort());
        }
    }

    throw new Error(`Falha ao carregar ${docName}.`);
}

async function loadAndCacheQuizData(key: DocKey, setLoadingStatus: (status: string) => void): Promise<QuizData> {
    const docName = DOC_NAME_MAP[key];
    const docId = DOC_IDS[key];

    setLoadingStatus(`Carregando ${docName}...`);
    const text = await fetchDocContent(docId, setLoadingStatus, docName);
    setLoadingStatus('Processando dados...');

    const parsedData = parseQuizData(key, text);
    memoryCache.set(key, parsedData);
    savePersistentCache(key, parsedData);

    return parsedData;
}

// --- API Calls ---

export async function loadQuizData(
    key: DocKey,
    setLoadingStatus: (status: string) => void
): Promise<QuizData> {
    const cachedData = getCachedQuizData(key);
    if (cachedData) {
        setLoadingStatus('Abrindo conteúdo salvo neste dispositivo...');
        return cachedData;
    }

    const pendingLoad = pendingLoads.get(key);
    if (pendingLoad) {
        setLoadingStatus(`Reaproveitando carregamento em andamento de ${DOC_NAME_MAP[key]}...`);
        return pendingLoad;
    }

    const request = loadAndCacheQuizData(key, setLoadingStatus)
        .catch(error => {
            const staleCache = readPersistentCache(key, true);
            if (staleCache) {
                console.warn(`Usando cache antigo de ${key} após falha de rede.`, error);
                setLoadingStatus('Sem rede estável. Abrindo a última cópia salva...');
                return staleCache;
            }

            throw error;
        })
        .finally(() => {
            pendingLoads.delete(key);
        });

    pendingLoads.set(key, request);
    return request;
}

export async function prefetchQuizData(key: DocKey): Promise<void> {
    if (getCachedQuizData(key) || pendingLoads.has(key)) {
        return;
    }

    try {
        await loadQuizData(key, () => {});
    } catch (error) {
        console.warn(`Pré-carregamento de ${key} falhou.`, error);
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
