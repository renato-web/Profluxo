import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO FINAL ---

// 1. URL do Projeto
const SUPABASE_URL: string = 'https://hjwdxbsorxzqatvdjfog.supabase.co';

// 2. Chave de API (Anon Public Key)
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd2R4YnNvcnh6cWF0dmRqZm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjcxOTksImV4cCI6MjA4MDk0MzE5OX0.9o8s-z4Uy5YtY93-_TZ56d6DGFpeaD5AvgRKKCeuwCY';

// ----------------------

// Verifica se a chave foi configurada corretamente
export const isSupabaseConfigured = () => {
    // Verifica se a URL é padrão
    if (SUPABASE_URL.includes('SEU_PROJETO')) return false;
    
    // Verifica se a chave é placeholder
    if (SUPABASE_ANON_KEY.includes('COLE_AQUI')) return false;
    
    // VERIFICAÇÃO IMPORTANTE: Chaves do Supabase JS Client SEMPRE começam com 'ey'
    if (!SUPABASE_ANON_KEY.startsWith('ey')) return false;

    return true;
};

// Cria a conexão
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);