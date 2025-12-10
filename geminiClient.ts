import { GoogleGenAI } from "@google/genai";
import { TaskLog } from "./types";

// Inicialização do cliente Gemini conforme diretrizes oficiais.
// A chave deve ser fornecida via variável de ambiente (process.env.API_KEY) no build/deploy.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProductivityData = async (data: TaskLog[]): Promise<string> => {
  // Prepara um resumo leve dos dados para envio à IA, economizando tokens
  const summary = data.map(log => ({
    role: log.role,
    taskCount: log.tasks.length,
    date: log.date
  }));

  const prompt = `
    Analise os seguintes dados de produtividade de uma equipe (formato JSON simplificado).
    
    Dados:
    ${JSON.stringify(summary.slice(0, 50))} (Amostra recente)

    Forneça:
    1. Análise de volume de trabalho.
    2. Identificação de gargalos por cargo.
    3. Uma sugestão estratégica de melhoria.
    
    Responda em Português do Brasil, formato Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Você é um Consultor de Produtividade Sênior especialista em análise de KPIs corporativos.",
        temperature: 0.7,
      },
    });

    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Erro na comunicação com Gemini:", error);
    // Retorna mensagem amigável em caso de falha (chave ausente, erro de rede, etc.)
    return "O Consultor Virtual está indisponível no momento. Por favor, tente novamente mais tarde.";
  }
};