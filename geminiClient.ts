import { GoogleGenAI } from "@google/genai";
import { TaskLog } from "./types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeProductivityData = async (data: TaskLog[]): Promise<string> => {
  if (!apiKey) {
    return "API Key não configurada. Por favor, configure a chave da API Gemini para ver insights de IA.";
  }

  // Summarize data to send to AI to save tokens and avoid complexity
  const summary = data.map(log => ({
    role: log.role,
    taskCount: log.tasks.length,
    date: log.date
  }));

  const prompt = `
    Atue como um Consultor de Produtividade Sênior. Analise os seguintes dados de produtividade de uma equipe (formato JSON simplificado).
    
    Dados:
    ${JSON.stringify(summary.slice(0, 50))} (Amostra dos últimos registros)

    Por favor, forneça:
    1. Uma breve análise sobre o volume de trabalho.
    2. Identifique possíveis gargalos ou sobrecargas baseadas nos cargos.
    3. Sugira uma ação estratégica para a diretoria melhorar a eficiência.
    
    Responda em Português do Brasil, com formatação Markdown, seja direto e executivo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro ao conectar com a IA Inteligente. Verifique sua conexão ou chave de API.";
  }
};