import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'trainings');
const CONSTANTS_PATH = path.join(ROOT_DIR, 'constants.ts');
const BEST_EFFORT = process.argv.includes('--best-effort');
const CHECK_ONLY = process.argv.includes('--check');
const FETCH_TIMEOUT_MS = 15_000;

const DOCUMENTS = [
    { key: 'VF', name: 'Verdadeiro ou Falso', file: 'vf.txt', requiredSections: [] },
    { key: 'TDP', name: 'Treinamento Documental', file: 'tdp.txt', requiredSections: ['AV1'] },
    { key: 'AVDOC_RES', name: 'Avaliação / Resolução', file: 'avdoc-res.txt', requiredSections: ['AVDOC', 'RES'] },
    { key: 'PULSO_FIRME', name: 'Pulso Firme & Rigidez', file: 'pulso-firme.txt', requiredSections: [] },
    { key: 'FARDAS', name: 'Treinamento de Fardas', file: 'fardas.txt', requiredSections: [] },
];

function readDocumentIds(constantsSource) {
    const idsBlock = constantsSource.match(/export const DOC_IDS\s*=\s*\{([\s\S]*?)\n\};/);
    if (!idsBlock) {
        throw new Error('Não foi possível localizar DOC_IDS em constants.ts.');
    }

    const ids = {};
    for (const match of idsBlock[1].matchAll(/([A-Z_]+):\s*['"]([^'"]+)['"]/g)) {
        ids[match[1]] = match[2];
    }

    return ids;
}

function validateDocument(document, content) {
    const normalized = content.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lowerContent = normalized.toLowerCase();

    if (!normalized || lowerContent.startsWith('<!doctype html') || lowerContent.startsWith('<html')) {
        throw new Error(`${document.name} retornou conteúdo vazio ou HTML.`);
    }
    if (!/(?:^|\n)\d{1,3}\.\s/.test(normalized)) {
        throw new Error(`${document.name} não possui perguntas no formato "1. Pergunta".`);
    }
    if (!/(?:^|\n)R:/i.test(normalized)) {
        throw new Error(`${document.name} não possui respostas no formato "R: Resposta".`);
    }
    for (const section of document.requiredSections) {
        if (!normalized.includes(`[${section}]`)) {
            throw new Error(`${document.name} não possui a seção obrigatória [${section}].`);
        }
    }
    if (document.key === 'VF' && !/(?:^|\n)R:\s*(?:Verdadeiro|Falso)/i.test(normalized)) {
        throw new Error(`${document.name} não possui gabarito Verdadeiro/Falso válido.`);
    }

    return `${normalized}\n`;
}

async function fetchDocument(document, docId) {
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(
                `https://docs.google.com/document/d/${docId}/export?format=txt`,
                {
                    signal: controller.signal,
                    redirect: 'follow',
                    headers: { Accept: 'text/plain' },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return validateDocument(document, await response.text());
        } catch (error) {
            lastError = error;
            if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, attempt * 500));
            }
        } finally {
            clearTimeout(timeout);
        }
    }

    throw new Error(`Falha ao baixar ${document.name}.`, { cause: lastError });
}

async function snapshotsExist() {
    const checks = await Promise.all(DOCUMENTS.map(async document => {
        try {
            await access(path.join(OUTPUT_DIR, document.file));
            return true;
        } catch {
            return false;
        }
    }));

    return checks.every(Boolean);
}

async function main() {
    const constantsSource = await readFile(CONSTANTS_PATH, 'utf8');
    const documentIds = readDocumentIds(constantsSource);

    const downloads = await Promise.all(DOCUMENTS.map(async document => {
        const docId = documentIds[document.key];
        if (!docId) {
            throw new Error(`DOC_IDS não possui a chave ${document.key}.`);
        }

        const content = await fetchDocument(document, docId);
        return { ...document, content };
    }));

    for (const document of downloads) {
        const questionCount = document.content.match(/(?:^|\n)\d{1,3}\.\s/g)?.length ?? 0;
        console.log(`✓ ${document.name}: ${questionCount} perguntas válidas`);
    }

    if (CHECK_ONLY) {
        console.log('Todos os documentos estão acessíveis e com formato válido.');
        return;
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    await Promise.all(downloads.map(document => (
        writeFile(path.join(OUTPUT_DIR, document.file), document.content, 'utf8')
    )));
    console.log('Cópias de segurança dos treinamentos atualizadas.');
}

main().catch(async error => {
    if (BEST_EFFORT && await snapshotsExist()) {
        console.warn(`Aviso: ${error.message} Mantendo as cópias de segurança existentes.`);
        return;
    }

    console.error(error);
    process.exitCode = 1;
});
