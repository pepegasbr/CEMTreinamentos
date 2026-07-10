import {
    DOC_FETCH_TIMEOUT_MS,
    DOC_IDS,
    DOC_SNAPSHOT_PATHS,
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

type MemoryCacheEntry = CachedQuizPayload;

const memoryCache = new Map<DocKey, MemoryCacheEntry>();
const pendingLoads = new Map<DocKey, Promise<QuizData>>();

const DOC_NAME_MAP: Record<DocKey, string> = {
    VF: 'Verdadeiro ou Falso',
    TDP: 'Treinamento Documental',
    AVDOC_RES: 'Avaliação / Resolução',
    PULSO_FIRME: 'Pulso Firme & Rigidez',
    FARDAS: 'Treinamento de Fardas',
};

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
    }).filter((question): question is VFQuestion => question !== null);
}

function parseOpenAnswerDoc(
    text: string,
    targetObject?: Record<string, OpenAnswerQuestion[]>,
    sectionRegex?: RegExp,
): OpenAnswerQuestion[] {
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
            const questionText = (answerIndex !== -1 ? cleanBlock.substring(0, answerIndex) : cleanBlock)
                .replace(/^\d{1,3}\.\s*/, '')
                .trim();
            const answerText = (
                answerIndex !== -1
                    ? cleanBlock.substring(answerIndex + answerMarker.length)
                    : 'Sem resposta no gabarito.'
            ).trim();

            return { question: questionText, answer: answerText };
        }).filter((question): question is OpenAnswerQuestion => question !== null);
    }

    if (targetObject) {
        const sections = cleanText.split(sectionRegex).slice(1);
        for (let index = 0; index < sections.length; index += 2) {
            const sectionName = sections[index];
            const content = sections[index + 1]?.trim() ?? '';
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
        case 'FARDAS':
            return parseOpenAnswerDoc(text);
    }
}

function isOpenAnswerArray(value: unknown): value is OpenAnswerQuestion[] {
    return Array.isArray(value)
        && value.length > 0
        && value.every(question => (
            question
            && typeof question === 'object'
            && typeof question.question === 'string'
            && question.question.trim().length > 0
            && typeof question.answer === 'string'
            && question.answer.trim().length > 0
        ));
}

function isValidQuizData(key: DocKey, data: unknown): data is QuizData {
    if (key === 'VF') {
        return Array.isArray(data)
            && data.length > 0
            && data.every(question => (
                question
                && typeof question === 'object'
                && typeof question.question === 'string'
                && question.question.trim().length > 0
                && (question.answer === 'Verdadeiro' || question.answer === 'Falso')
                && typeof question.justification === 'string'
            ));
    }

    if (key === 'PULSO_FIRME' || key === 'FARDAS') {
        return isOpenAnswerArray(data);
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return false;
    }

    const sections = data as Record<string, unknown>;
    if (key === 'AVDOC_RES') {
        return isOpenAnswerArray(sections.AVDOC) && isOpenAnswerArray(sections.RES);
    }

    const entries = Object.entries(sections);
    return entries.length > 0
        && entries.every(([sectionName, questions]) => /^AV\d+$/.test(sectionName) && isOpenAnswerArray(questions));
}

function parseAndValidateQuizData(key: DocKey, text: string, sourceName: string): QuizData {
    const parsedData = parseQuizData(key, text);
    if (!isValidQuizData(key, parsedData)) {
        throw new Error(`${sourceName} não contém perguntas válidas para ${DOC_NAME_MAP[key]}.`);
    }

    return parsedData;
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
            || !isValidQuizData(key, payload.data)
        ) {
            window.localStorage.removeItem(getStorageKey(key));
            return null;
        }

        const isFresh = Date.now() - payload.savedAt < DOCS_CACHE_TTL_MS;
        if (!isFresh && !allowStale) {
            return null;
        }

        memoryCache.set(key, payload);
        return payload.data;
    } catch (error) {
        console.warn(`Falha ao ler cache local de ${key}.`, error);
        return null;
    }
}

function savePersistentCache(key: DocKey, payload: CachedQuizPayload): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(getStorageKey(key), JSON.stringify(payload));
    } catch (error) {
        console.warn(`Falha ao salvar cache local de ${key}.`, error);
    }
}

function cacheQuizData(key: DocKey, data: QuizData): QuizData {
    const payload: CachedQuizPayload = {
        version: DOCS_CACHE_VERSION,
        savedAt: Date.now(),
        data,
    };

    memoryCache.set(key, payload);
    savePersistentCache(key, payload);
    return data;
}

export function getCachedQuizData(key: DocKey): QuizData | null {
    const memoryValue = memoryCache.get(key);
    if (
        memoryValue
        && memoryValue.version === DOCS_CACHE_VERSION
        && Date.now() - memoryValue.savedAt < DOCS_CACHE_TTL_MS
        && isValidQuizData(key, memoryValue.data)
    ) {
        return memoryValue.data;
    }

    memoryCache.delete(key);
    return readPersistentCache(key);
}

// --- Network helpers ---

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

async function fetchText(
    url: string,
    docName: string,
    sourceName: string,
    cacheMode: RequestCache,
): Promise<string> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), DOC_FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: cacheMode,
            redirect: 'follow',
            headers: { Accept: 'text/plain' },
        });

        if (!response.ok) {
            throw new Error(`${sourceName} respondeu ${response.status} para ${docName}.`);
        }

        return validateDocContent(await response.text(), docName, sourceName);
    } catch (error) {
        if (controller.signal.aborted) {
            throw new Error(`${sourceName} demorou demais para carregar ${docName}.`, { cause: error });
        }
        throw error;
    } finally {
        window.clearTimeout(timeout);
    }
}

function getSnapshotUrl(key: DocKey): string {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
    const version = encodeURIComponent(DOCS_CACHE_VERSION);
    return `${baseUrl}${DOC_SNAPSHOT_PATHS[key]}?v=${version}`;
}

async function loadRemoteQuizData(
    key: DocKey,
    setLoadingStatus: (status: string) => void,
): Promise<QuizData> {
    const docName = DOC_NAME_MAP[key];
    const targetUrl = `${DOCS_URL_PREFIX}${DOC_IDS[key]}${DOCS_URL_SUFFIX}`;

    setLoadingStatus(`Carregando ${docName}...`);
    const text = await fetchText(targetUrl, docName, 'Google Docs', 'no-store');
    setLoadingStatus('Processando dados...');
    return cacheQuizData(key, parseAndValidateQuizData(key, text, 'Google Docs'));
}

async function loadBundledQuizData(
    key: DocKey,
    setLoadingStatus: (status: string) => void,
): Promise<QuizData> {
    const docName = DOC_NAME_MAP[key];

    setLoadingStatus('Abrindo a cópia de segurança do treinamento...');
    const text = await fetchText(getSnapshotUrl(key), docName, 'Cópia de segurança', 'force-cache');
    return cacheQuizData(key, parseAndValidateQuizData(key, text, 'Cópia de segurança'));
}

// --- API Calls ---

export async function loadQuizData(
    key: DocKey,
    setLoadingStatus: (status: string) => void,
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

    const request = (async () => {
        let remoteError: unknown;

        try {
            return await loadRemoteQuizData(key, setLoadingStatus);
        } catch (error) {
            remoteError = error;
            console.warn(`Falha ao atualizar ${key} pelo Google Docs.`, error);
        }

        const staleCache = readPersistentCache(key, true);
        if (staleCache) {
            setLoadingStatus('Sem acesso ao documento. Abrindo a última cópia válida...');
            return staleCache;
        }

        try {
            return await loadBundledQuizData(key, setLoadingStatus);
        } catch (snapshotError) {
            console.error(`Falha também na cópia de segurança de ${key}.`, snapshotError);
            throw new Error(`Não foi possível carregar ${DOC_NAME_MAP[key]}.`, {
                cause: new AggregateError([remoteError, snapshotError]),
            });
        }
    })().finally(() => {
        pendingLoads.delete(key);
    });

    pendingLoads.set(key, request);
    return request;
}

export async function sendDataToSpreadsheet(data: {
    nickname: string;
    instructorName: string;
    quizType: string;
    score?: string;
    answers: Answer[];
}): Promise<void> {
    if (!SCRIPT_URL) {
        console.error('SCRIPT_URL is not set. Cannot send data.');
        throw new Error('A aplicação não está configurada para salvar os resultados.');
    }

    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        body: JSON.stringify(data),
        redirect: 'follow',
    });
}

export async function searchStudent(nickname: string): Promise<AdminStudentData> {
    const response = await fetch(`${SCRIPT_URL}?action=search&nickname=${encodeURIComponent(nickname)}`);
    if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
    const results = await response.json();
    if (results.error) throw new Error(results.error);
    return results.data || {};
}
