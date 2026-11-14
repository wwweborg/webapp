import { GoogleGenAI } from '@google/genai';

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'meta' | 'custom';

export interface ProviderPreset {
  id: AiProvider;
  name: string;
  badge: string;
  description: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  needsApiKey: boolean;
}

export const AI_PROVIDERS: Record<AiProvider, ProviderPreset> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini',
    description: 'Modelos multimodales de Google con razonamiento rápido y amplias ventanas de contexto.',
    defaultModel: 'gemini-2.5-flash',
    needsApiKey: true,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'ChatGPT',
    description: 'Los reconocidos modelos GPT de OpenAI para redacción, análisis y codificación.',
    defaultModel: 'gpt-4o',
    defaultBaseUrl: 'https://api.openai.com/v1',
    needsApiKey: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude',
    description: 'Modelos Claude con excelente comprensión de lenguaje natural, tono matizado y redacción impecable.',
    defaultModel: 'claude-3-7-sonnet-20250219',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    needsApiKey: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Groq',
    description: 'Inferencia a velocidad récord mediante LPU, ideal para respuestas en milisegundos.',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    needsApiKey: true,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'DeepSeek',
    description: 'Modelos de vanguardia con sobresaliente capacidad de razonamiento y codificación.',
    defaultModel: 'deepseek-chat',
    defaultBaseUrl: 'https://api.deepseek.com',
    needsApiKey: true,
  },
  meta: {
    id: 'meta',
    name: 'Meta Llama',
    badge: 'Llama',
    description: 'La familia de modelos abiertos de Meta (ejecutada mediante Groq o API compatible).',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    needsApiKey: true,
  },
  custom: {
    id: 'custom',
    name: 'Local / Personalizado (Ollama, LM Studio, etc.)',
    badge: 'Local/Custom',
    description: 'Conecta cualquier servidor local (Ollama, LM Studio, vLLM) o proveedor compatible con OpenAI (OpenRouter, Together).',
    defaultModel: 'llama3',
    defaultBaseUrl: 'http://localhost:11434/v1',
    needsApiKey: false,
  },
};

/**
 * Executes a call to Google Gemini
 */
export async function executeGeminiRequest(params: {
  apiKey: string;
  model: string;
  prompt: string;
  systemInstruction: string;
}): Promise<string> {
  const { apiKey, model, prompt, systemInstruction } = params;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const candidateModels = [
    model,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-1.5-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: any = null;

  for (const m of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      const text = response.text || '';
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      const isUnavailable =
        err?.status === 'UNAVAILABLE' ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('429');

      if (!isUnavailable) {
        if (
          err?.message?.includes('API key') ||
          err?.message?.includes('401') ||
          err?.message?.includes('403')
        ) {
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError || new Error('No se obtuvo respuesta de Gemini');
}

/**
 * Executes a call to any OpenAI-compatible API (OpenAI, Groq, DeepSeek, Meta, Ollama, LM Studio, etc.)
 */
export async function executeOpenAICompatibleRequest(params: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  prompt: string;
  systemInstruction: string;
}): Promise<string> {
  const { baseUrl, apiKey, model, prompt, systemInstruction } = params;

  // Clean trailing slash
  let cleanUrl = baseUrl.trim().replace(/\/+$/, '');
  // If the user entered base without /chat/completions, append it appropriately
  if (!cleanUrl.endsWith('/chat/completions')) {
    if (!cleanUrl.endsWith('/v1')) {
      // Some endpoints like deepseek are https://api.deepseek.com/chat/completions
      // while others are https://api.openai.com/v1/chat/completions
      if (cleanUrl.includes('deepseek.com')) {
        cleanUrl = `${cleanUrl}/chat/completions`;
      } else {
        cleanUrl = `${cleanUrl}/chat/completions`;
      }
    } else {
      cleanUrl = `${cleanUrl}/chat/completions`;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  } else {
    // For local Ollama without auth, sending a dummy Bearer token is safe if required
    headers['Authorization'] = 'Bearer ollama';
  }

  const payload = {
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  };

  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail =
        errJson?.error?.message ||
        errJson?.message ||
        JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(
      `Error de API (${response.status}): ${errorDetail || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('La respuesta del modelo llegó vacía.');
  }

  return content;
}

/**
 * Executes a call to Anthropic Claude
 */
export async function executeAnthropicRequest(params: {
  apiKey: string;
  model: string;
  prompt: string;
  systemInstruction: string;
}): Promise<string> {
  const { apiKey, model, prompt, systemInstruction } = params;

  const url = 'https://api.anthropic.com/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-haiku-20241022',
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail =
        errJson?.error?.message ||
        errJson?.message ||
        JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(
      `Error de Claude (${response.status}): ${errorDetail || response.statusText}`
    );
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error('La respuesta de Claude llegó vacía.');
  }

  return text;
}
