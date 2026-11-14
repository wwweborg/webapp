import { NextRequest, NextResponse } from 'next/server';
import {
  AiProvider,
  AI_PROVIDERS,
  executeGeminiRequest,
  executeOpenAICompatibleRequest,
  executeAnthropicRequest,
} from '@/lib/aiService';

function isValidApiKey(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (
    trimmed === 'MY_GEMINI_API_KEY' ||
    trimmed === 'YOUR_API_KEY' ||
    trimmed === 'YOUR_GEMINI_API_KEY' ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return false;
  }
  return true;
}

export async function GET() {
  const configuredProviders: Record<AiProvider, boolean> = {
    gemini: isValidApiKey(process.env.GEMINI_API_KEY),
    openai: isValidApiKey(process.env.OPENAI_API_KEY),
    anthropic: isValidApiKey(process.env.ANTHROPIC_API_KEY),
    groq: isValidApiKey(process.env.GROQ_API_KEY),
    deepseek: isValidApiKey(process.env.DEEPSEEK_API_KEY),
    meta: isValidApiKey(process.env.GROQ_API_KEY) || isValidApiKey(process.env.OPENAI_API_KEY),
    custom: isValidApiKey(process.env.CUSTOM_AI_API_KEY) || isValidApiKey(process.env.CUSTOM_AI_BASE_URL),
  };

  const hasAnyKeyConfigured = Object.values(configuredProviders).some(Boolean);

  return NextResponse.json({
    hasAnyKeyConfigured,
    configuredProviders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      action = 'chat', 
      context = '', 
      currentNoteContent = '', 
      currentNotePath = '', 
      provider = 'gemini',
      model = '',
      baseUrl = ''
    } = body;

    const selectedProvider: AiProvider = (provider in AI_PROVIDERS) 
      ? (provider as AiProvider) 
      : 'gemini';
    const providerPreset = AI_PROVIDERS[selectedProvider];
    const targetModel = model?.trim() || providerPreset.defaultModel;

    // Resolve API Key from server environment variables
    let apiKey = '';
    if (selectedProvider === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY || '';
    } else if (selectedProvider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || '';
    } else if (selectedProvider === 'anthropic') {
      apiKey = process.env.ANTHROPIC_API_KEY || '';
    } else if (selectedProvider === 'groq') {
      apiKey = process.env.GROQ_API_KEY || '';
    } else if (selectedProvider === 'deepseek') {
      apiKey = process.env.DEEPSEEK_API_KEY || '';
    } else if (selectedProvider === 'meta') {
      apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '';
    } else if (selectedProvider === 'custom') {
      apiKey = process.env.CUSTOM_AI_API_KEY || '';
    }

    // Check key requirements (local Ollama / custom does not require key)
    if (providerPreset.needsApiKey && (!apiKey || apiKey === 'MY_GEMINI_API_KEY')) {
      return NextResponse.json({ 
        error: `No se encontró una API Key configurada para ${providerPreset.name} en las variables de entorno del servidor.`,
        isKeyMissing: true,
        provider: selectedProvider
      }, { status: 400 });
    }

    const systemInstruction = `Eres Petardo, un agente de IA amigable, experto y ágil integrado en una aplicación de notas y documentación Markdown sincronizada con GitHub.
Tu misión es ayudar al usuario a:
1. Redactar notas y documentos Markdown bien estructurados, claros y profesionales.
2. Crear nuevos archivos Markdown con títulos y rutas adecuadas (ej: "notas/mi-documento.md" o "ideas.md").
3. Mejorar, corregir, formatear y embellecer textos o notas existentes.
4. Resumir y extraer conclusiones clave.
5. Generar esquemas, lluvia de ideas y código técnico si es necesario.

Si el usuario te pide crear una nota o redactar un archivo, proporciona una respuesta clara y siempre incluye el contenido Markdown bien delimitado.
Si la acción solicitada es 'create_document', responde estructurando claramente:
- Nombre de archivo sugerido (con extensión .md)
- Contenido completo en Markdown.

Contexto actual de la aplicación:
${currentNotePath ? `- Archivo actual abierto: ${currentNotePath}` : '- Ningún archivo abierto actualmente'}
${currentNoteContent ? `- Contenido del archivo actual:\n"""\n${currentNoteContent.slice(0, 4000)}\n"""` : ''}
${context ? `- Contexto adicional: ${context}` : ''}
`;

    let userPrompt = prompt || '';
    if (action === 'improve' && currentNoteContent) {
      userPrompt = `Mejora y optimiza la redacción y formato del siguiente documento Markdown, manteniendo su esencia y haciéndolo más claro y legible:\n\n${currentNoteContent}`;
    } else if (action === 'summarize' && currentNoteContent) {
      userPrompt = `Proporciona un resumen claro, conciso y estructurado con puntos clave del siguiente documento:\n\n${currentNoteContent}`;
    } else if (action === 'generate_file') {
      userPrompt = `Crea un documento Markdown completo y detallado para: "${prompt}". Sugiere también un nombre de archivo adecuado (ejemplo: 'carpeta/nombre.md' o 'nombre.md').`;
    }

    let responseText = '';

    if (selectedProvider === 'gemini') {
      responseText = await executeGeminiRequest({
        apiKey,
        model: targetModel,
        prompt: userPrompt,
        systemInstruction
      });
    } else if (selectedProvider === 'anthropic') {
      responseText = await executeAnthropicRequest({
        apiKey,
        model: targetModel,
        prompt: userPrompt,
        systemInstruction
      });
    } else {
      // OpenAI, Groq, DeepSeek, Meta, Custom / Ollama (OpenAI-compatible)
      const targetBaseUrl = baseUrl?.trim() || providerPreset.defaultBaseUrl || process.env.CUSTOM_AI_BASE_URL || 'http://localhost:11434/v1';
      responseText = await executeOpenAICompatibleRequest({
        baseUrl: targetBaseUrl,
        apiKey: apiKey || undefined,
        model: targetModel,
        prompt: userPrompt,
        systemInstruction
      });
    }

    const text = responseText;

    // Extract potential filename if generated
    let suggestedFileName = '';
    const fileMatch = text.match(/(?:archivo|nombre|path|file):\s*[`"]?([a-zA-Z0-9_\-\/]+\.md)[`"]?/i);
    if (fileMatch && fileMatch[1]) {
      suggestedFileName = fileMatch[1];
    } else if (action === 'generate_file' && prompt) {
      const sanitized = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 25).replace(/^-|-$/g, '');
      suggestedFileName = sanitized ? `${sanitized}.md` : 'nueva-nota.md';
    }

    return NextResponse.json({
      text,
      suggestedFileName: suggestedFileName || undefined,
      action,
      provider: selectedProvider,
      model: targetModel
    });

  } catch (error: any) {
    console.error('Petardo AI API Error:', error);
    let errorMessage = error?.message || 'Error al comunicarse con el proveedor de IA';
    const isUnavailable = 
      error?.status === 'UNAVAILABLE' || 
      errorMessage.includes('503') || 
      errorMessage.includes('high demand') ||
      errorMessage.includes('experiencing high demand');
    const isRateLimited = error?.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429');

    if (isUnavailable) {
      errorMessage = 'El servidor de IA está experimentando alta demanda en este momento. Por favor reintenta en unos segundos.';
    } else if (isRateLimited) {
      errorMessage = 'Límite de solicitudes alcanzado para este proveedor. Por favor espera un momento o revisa tus cuotas.';
    }

    return NextResponse.json({ 
      error: errorMessage,
      isKeyInvalid: errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('unauthorized'),
      isHighDemand: isUnavailable
    }, { status: isUnavailable ? 503 : 500 });
  }
}
