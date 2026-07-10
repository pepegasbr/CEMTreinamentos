export function getStoredValue(key: string, fallback = ''): string {
    try {
        return window.localStorage.getItem(key) ?? fallback;
    } catch (error) {
        console.warn(`Armazenamento local indisponível para ${key}.`, error);
        return fallback;
    }
}

export function setStoredValue(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        // O treinamento continua funcionando mesmo em navegação privada ou storage bloqueado.
        console.warn(`Não foi possível salvar ${key} localmente.`, error);
    }
}
