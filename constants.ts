export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFk73RfITnQIUm9OxRHNNcJt6rNCu6tzRr5PuE0XAGRAaIyv-Kp92S9Fw6aaPFrSbpRw/exec";

export const DOCS_URL_PREFIX = 'https://docs.google.com/document/d/';
export const DOCS_URL_SUFFIX = '/export?format=txt';
export const DOCS_CACHE_VERSION = '2026-07-10-direct-docs-v1';
export const DOCS_CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutos
export const DOC_FETCH_TIMEOUT_MS = 8000;

export const DOC_IDS = {
    VF: '13mufkEtYY8eDHxu_szmMKM_TmAbEV4pr29GStEn80qk',
    TDP: '1h0MtzZj31NagmyZLIJGftwpOBYOHGh4AUUKSjDbEnC4',
    AVDOC_RES: '14UkNVic1wHGQ5gKNwjKG4Tgbzb3eHYKdMGDWO1N6OMM',
    PULSO_FIRME: '1cRty-m9_PqGlYCX1XaQhNoOXluwF746o1z57FhrHjPQ',
    FARDAS: '17rV3wx5qpl5AmB6rFeqXkPQdNxopnoZXlzI8dDjTC4U',
};

// Cópias geradas pelo script `npm run sync:trainings` e servidas pelo próprio site.
// Elas são usadas somente se o Google Docs e o cache local estiverem indisponíveis.
export const DOC_SNAPSHOT_PATHS: Record<keyof typeof DOC_IDS, string> = {
    VF: 'trainings/vf.txt',
    TDP: 'trainings/tdp.txt',
    AVDOC_RES: 'trainings/avdoc-res.txt',
    PULSO_FIRME: 'trainings/pulso-firme.txt',
    FARDAS: 'trainings/fardas.txt',
};

export const TOTAL_VF_QUESTIONS = 10;
export const TOTAL_FARDAS_QUESTIONS = 10;
export const MAX_OA_CHARS = 1200;

export const LS_KEYS = {
    NICK: 'cem_nick',
    APLICADOR: 'cem_aplicador',
    ADMIN_FILTER: 'cem_admin_filter',
    ADMIN_SORT: 'cem_admin_sort',
    QUIZ_CACHE_PREFIX: 'cem_quiz_cache',
};
