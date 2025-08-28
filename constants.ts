export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFk73RfITnQIUm9OxRHNNcJt6rNCu6tzRr5PuE0XAGRAaIyv-Kp92S9Fw6aaPFrSbpRw/exec";

// Usando um proxy para contornar problemas de CORS ao buscar diretamente do Google Docs.
export const PROXY_URL = 'https://api.allorigins.win/raw?url=';
export const DOCS_URL_PREFIX = 'https://docs.google.com/document/d/';
export const DOCS_URL_SUFFIX = '/export?format=txt';

export const DOC_IDS = {
    VF: '13mufkEtYY8eDHxu_szmMKM_TmAbEV4pr29GStEn80qk',
    TDP: '1h0MtzZj31NagmyZLIJGftwpOBYOHGh4AUUKSjDbEnC4',
    AVDOC_RES: '14UkNVic1wHGQ5gKNwjKG4Tgbzb3eHYKdMGDWO1N6OMM',
    PULSO_FIRME: '1cRty-m9_PqGlYCX1XaQhNoOXluwF746o1z57FhrHjPQ',
    FARDAS: '17rV3wx5qpl5AmB6rFeqXkPQdNxopnoZXlzI8dDjTC4U',
};

export const TOTAL_VF_QUESTIONS = 10;
export const TOTAL_FARDAS_QUESTIONS = 10;
export const MAX_OA_CHARS = 1200;

export const LS_KEYS = {
    NICK: 'cem_nick',
    INSTRUCTOR: 'cem_instructor',
    DRAFT: 'cem_draft',
    ADMIN_FILTER: 'cem_admin_filter',
    ADMIN_SORT: 'cem_admin_sort',
};