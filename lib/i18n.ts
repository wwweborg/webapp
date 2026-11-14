import es from '@/locales/es.json';
import en from '@/locales/en.json';
import pt from '@/locales/pt.json';
import fr from '@/locales/fr.json';
import nl from '@/locales/nl.json';
import it from '@/locales/it.json';
import de from '@/locales/de.json';
import ja from '@/locales/ja.json';
import zh from '@/locales/zh.json';
import ru from '@/locales/ru.json';

export type AppLanguage = 'es' | 'en' | 'pt' | 'fr' | 'nl' | 'it' | 'de' | 'ja' | 'zh' | 'ru';

export type I18nDictionary = typeof es;

export interface LanguageOption {
  code: AppLanguage;
  nativeName: string;
  spanishName: string;
  regionLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', nativeName: 'Español', spanishName: 'Español', regionLabel: 'ES / LATAM (Nativo)', flag: '🇪🇸' },
  { code: 'en', nativeName: 'English', spanishName: 'Inglés', regionLabel: 'US / UK', flag: '🇺🇸' },
  { code: 'pt', nativeName: 'Português', spanishName: 'Portugués', regionLabel: 'BR / PT', flag: '🇧🇷' },
  { code: 'fr', nativeName: 'Français', spanishName: 'Francés', regionLabel: 'FR / CA', flag: '🇫🇷' },
  { code: 'nl', nativeName: 'Nederlands', spanishName: 'Neerlandés', regionLabel: 'NL / BE', flag: '🇳🇱' },
  { code: 'it', nativeName: 'Italiano', spanishName: 'Italiano', regionLabel: 'IT / CH', flag: '🇮🇹' },
  { code: 'de', nativeName: 'Deutsch', spanishName: 'Alemán', regionLabel: 'DE / AT / CH', flag: '🇩🇪' },
  { code: 'ja', nativeName: '日本語', spanishName: 'Japonés', regionLabel: 'JP', flag: '🇯🇵' },
  { code: 'zh', nativeName: '中文', spanishName: 'Chino', regionLabel: 'CN / TW', flag: '🇨🇳' },
  { code: 'ru', nativeName: 'Русский', spanishName: 'Ruso', regionLabel: 'RU', flag: '🇷🇺' },
];

export const DICTIONARIES: Record<AppLanguage, I18nDictionary> = {
  es,
  en,
  pt,
  fr,
  nl,
  it,
  de,
  ja,
  zh,
  ru,
};

export function isSupportedLanguage(code: string | undefined | null): code is AppLanguage {
  if (!code) return false;
  return code in DICTIONARIES;
}

/**
 * 12.C Automatic Region / Browser Detection (`navigator.language`)
 * Falls back to Spanish ('es') as the primary/native system language.
 */
export function detectBrowserLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'es';

  const candidates: string[] = [];
  if (navigator.language) {
    candidates.push(navigator.language);
  }
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }

  for (const rawLocale of candidates) {
    const base = rawLocale.toLowerCase().trim().split(/[-_]/)[0];
    if (isSupportedLanguage(base)) {
      return base;
    }
  }

  return 'es';
}

export function getDictionary(lang?: AppLanguage | string): I18nDictionary {
  if (lang && isSupportedLanguage(lang)) {
    return DICTIONARIES[lang];
  }
  return DICTIONARIES.es;
}

export function getLanguageOption(lang?: AppLanguage | string): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find((item) => item.code === lang) ||
    SUPPORTED_LANGUAGES[0]
  );
}

export interface LocalizedAiProviderStrings {
  customProviderName: string;
  aiToggleTitle: string;
  aiToggleDesc: string;
  aiEnabledToast: string;
  aiDisabledToast: string;
  aiKeyMissingNotice: string;
  providerDescriptions: Record<string, string>;
}

const AI_PROVIDER_I18N: Record<AppLanguage, LocalizedAiProviderStrings> = {
  es: {
    customProviderName: 'Local / Personalizado (Ollama, LM Studio, etc.)',
    aiToggleTitle: 'Asistente de IA (Petardo AI)',
    aiToggleDesc: 'Muestra el asistente de inteligencia artificial en toda la aplicación (excepto en Configuración).',
    aiEnabledToast: 'Asistente de IA activado',
    aiDisabledToast: 'Asistente de IA desactivado',
    aiKeyMissingNotice: 'No se ha configurado la clave API Key de IA en las variables de entorno. El asistente no se mostrará ni podrá activarse.',
    providerDescriptions: {
      gemini: 'Modelos multimodales de Google con razonamiento rápido y amplias ventanas de contexto.',
      openai: 'Los reconocidos modelos GPT de OpenAI para redacción, análisis y codificación.',
      anthropic: 'Modelos Claude con excelente comprensión de lenguaje natural, tono matizado y redacción impecable.',
      groq: 'Inferencia a velocidad récord mediante LPU, ideal para respuestas en milisegundos.',
      deepseek: 'Modelos de vanguardia con sobresaliente capacidad de razonamiento y codificación.',
      meta: 'La familia de modelos abiertos de Meta (ejecutada mediante Groq o API compatible).',
      custom: 'Conecta cualquier servidor local (Ollama, LM Studio, vLLM) o proveedor compatible con OpenAI (OpenRouter, Together).',
    },
  },
  en: {
    customProviderName: 'Local / Custom (Ollama, LM Studio, etc.)',
    aiToggleTitle: 'AI Assistant (Petardo AI)',
    aiToggleDesc: 'Displays the AI assistant across the entire application (except inside Settings).',
    aiEnabledToast: 'AI Assistant enabled',
    aiDisabledToast: 'AI Assistant disabled',
    aiKeyMissingNotice: 'No AI API Key is configured in environment variables. The assistant will not be shown or activated.',
    providerDescriptions: {
      gemini: 'Google multimodal models with fast reasoning and massive context windows.',
      openai: 'OpenAI’s renowned GPT models for writing, analysis, and coding.',
      anthropic: 'Claude models with nuanced natural language understanding and impeccable writing.',
      groq: 'Record-breaking LPU inference speed, ideal for millisecond responses.',
      deepseek: 'Cutting-edge models with outstanding reasoning and coding capabilities.',
      meta: 'Meta’s open model family (powered via Groq or OpenAI-compatible API).',
      custom: 'Connect any local server (Ollama, LM Studio, vLLM) or OpenAI-compatible provider (OpenRouter, Together).',
    },
  },
  pt: {
    customProviderName: 'Local / Personalizado (Ollama, LM Studio, etc.)',
    aiToggleTitle: 'Assistente de IA (Petardo AI)',
    aiToggleDesc: 'Exibe o assistente de inteligência artificial em todo o aplicativo (exceto nas Configurações).',
    aiEnabledToast: 'Assistente de IA ativado',
    aiDisabledToast: 'Assistente de IA desativado',
    aiKeyMissingNotice: 'Nenhuma chave API Key de IA configurada nas variáveis de ambiente. O assistente não será exibido nem ativado.',
    providerDescriptions: {
      gemini: 'Modelos multimodais do Google com raciocínio rápido e amplas janelas de contexto.',
      openai: 'Os renomados modelos GPT da OpenAI para redação, análise e programação.',
      anthropic: 'Modelos Claude com excelente compreensão de linguagem natural e escrita impecável.',
      groq: 'Inferência em velocidade recorde via LPU, ideal para respostas em milissegundos.',
      deepseek: 'Modelos de ponta com excelente capacidade de raciocínio e codificação.',
      meta: 'A família de modelos abertos da Meta (executada via Groq ou API compatível).',
      custom: 'Conecte qualquer servidor local (Ollama, LM Studio, vLLM) ou provedor compatível com OpenAI.',
    },
  },
  fr: {
    customProviderName: 'Local / Personnalisé (Ollama, LM Studio, etc.)',
    aiToggleTitle: 'Assistant IA (Petardo AI)',
    aiToggleDesc: 'Affiche l’assistant d’intelligence artificielle dans toute l’application (sauf dans les Paramètres).',
    aiEnabledToast: 'Assistant IA activé',
    aiDisabledToast: 'Assistant IA désactivé',
    aiKeyMissingNotice: 'Aucune clé API IA n’est configurée dans les variables d’environnement. L’assistant ne sera ni affiché ni activé.',
    providerDescriptions: {
      gemini: 'Modèles multimodaux de Google avec raisonnement rapide et larges fenêtres de contexte.',
      openai: 'Les célèbres modèles GPT d’OpenAI pour la rédaction, l’analyse et le code.',
      anthropic: 'Modèles Claude offrant une compréhension nuancée et une rédaction impeccable.',
      groq: 'Inférence ultra-rapide par LPU, idéale pour des réponses en millisecondes.',
      deepseek: 'Modèles de pointe dotés d’excellentes capacités de raisonnement et de programmation.',
      meta: 'La famille de modèles ouverts de Meta (via Groq ou API compatible).',
      custom: 'Connectez n’importe quel serveur local (Ollama, LM Studio, vLLM) ou fournisseur compatible OpenAI.',
    },
  },
  nl: {
    customProviderName: 'Lokaal / Aangepast (Ollama, LM Studio, enz.)',
    aiToggleTitle: 'AI-assistent (Petardo AI)',
    aiToggleDesc: 'Toont de AI-assistent in de hele applicatie (behalve in Instellingen).',
    aiEnabledToast: 'AI-assistent ingeschakeld',
    aiDisabledToast: 'AI-assistent uitgeschakeld',
    aiKeyMissingNotice: 'Geen AI API-sleutel geconfigureerd in omgevingsvariabelen. De assistent wordt niet getoond of geactiveerd.',
    providerDescriptions: {
      gemini: 'Multimodale modellen van Google met snel redeneren en grote contextvensters.',
      openai: 'De bekende GPT-modellen van OpenAI voor schrijven, analyse en programmeren.',
      anthropic: 'Claude-modellen met uitstekend taalbegrip en vlekkeloze tekstkwaliteit.',
      groq: 'Razendsnelle LPU-inferentie, ideaal voor antwoorden in milliseconden.',
      deepseek: 'Geavanceerde modellen met uitstekende redeneer- en codeervaardigheden.',
      meta: 'Meta’s open modelfamilie (uitgevoerd via Groq of compatibele API).',
      custom: 'Verbind elke lokale server (Ollama, LM Studio, vLLM) of OpenAI-compatibele provider.',
    },
  },
  it: {
    customProviderName: 'Locale / Personalizzato (Ollama, LM Studio, ecc.)',
    aiToggleTitle: 'Assistente IA (Petardo AI)',
    aiToggleDesc: 'Mostra l’assistente di intelligenza artificiale in tutta l’applicazione (tranne nelle Impostazioni).',
    aiEnabledToast: 'Assistente IA attivato',
    aiDisabledToast: 'Assistente IA disattivato',
    aiKeyMissingNotice: 'Nessuna chiave API IA configurata nelle variabili d’ambiente. L’assistente non verrà mostrato né attivato.',
    providerDescriptions: {
      gemini: 'Modelli multimodali di Google con ragionamento rapido e ampie finestre di contesto.',
      openai: 'I rinomati modelli GPT di OpenAI per scrittura, analisi e programmazione.',
      anthropic: 'Modelli Claude con eccellente comprensione del linguaggio naturale e scrittura impeccabile.',
      groq: 'Inferenza a velocità record tramite LPU, ideale per risposte in millisecondi.',
      deepseek: 'Modelli all’avanguardia con straordinarie capacità di ragionamento e programmazione.',
      meta: 'La famiglia di modelli aperti di Meta (eseguita tramite Groq o API compatibile).',
      custom: 'Collega qualsiasi server locale (Ollama, LM Studio, vLLM) o provider compatibile con OpenAI.',
    },
  },
  de: {
    customProviderName: 'Lokal / Benutzerdefiniert (Ollama, LM Studio usw.)',
    aiToggleTitle: 'KI-Assistent (Petardo AI)',
    aiToggleDesc: 'Zeigt den KI-Assistenten in der gesamten Anwendung an (außer in den Einstellungen).',
    aiEnabledToast: 'KI-Assistent aktiviert',
    aiDisabledToast: 'KI-Assistent deaktiviert',
    aiKeyMissingNotice: 'Kein KI-API-Schlüssel in den Umgebungsvariablen konfiguriert. Der Assistent wird weder angezeigt noch aktiviert.',
    providerDescriptions: {
      gemini: 'Multimodale Google-Modelle mit schnellem Denken und großen Kontextfenstern.',
      openai: 'Die bekannten GPT-Modelle von OpenAI für Text, Analyse und Programmierung.',
      anthropic: 'Claude-Modelle mit exzellentem Sprachverständnis und präzisem Schreibstil.',
      groq: 'Rekordschnelle LPU-Inferenz, ideal für Antworten im Millisekundenbereich.',
      deepseek: 'Spitzenmodelle mit herausragender Denk- und Programmierleistung.',
      meta: 'Metas offene Modellfamilie (über Groq oder kompatible API ausgeführt).',
      custom: 'Verbinden Sie jeden lokalen Server (Ollama, LM Studio, vLLM) oder OpenAI-kompatiblen Anbieter.',
    },
  },
  ja: {
    customProviderName: 'ローカル / カスタム (Ollama, LM Studio など)',
    aiToggleTitle: 'AIアシスタント (Petardo AI)',
    aiToggleDesc: '設定画面を除くアプリ全体でAIアシスタントを表示します。',
    aiEnabledToast: 'AIアシスタントを有効にしました',
    aiDisabledToast: 'AIアシスタントを無効にしました',
    aiKeyMissingNotice: '環境変数にAI APIキーが設定されていません。アシスタントは表示・有効化されません。',
    providerDescriptions: {
      gemini: '高速な推論と広大なコンテキストウィンドウを備えた Google のマルチモーダルモデル。',
      openai: '執筆、分析、コーディングに優れた OpenAI の代表的な GPT モデル。',
      anthropic: '自然な言語理解と洗練された文章作成に優れた Claude モデル。',
      groq: 'LPU による超高速推論。ミリ秒単位の応答に最適。',
      deepseek: '卓越した推論力とコーディング能力を持つ最先端モデル。',
      meta: 'Meta のオープンモデルファミリー（Groq または互換 API 経由で実行）。',
      custom: 'ローカルサーバー（Ollama、LM Studio、vLLM）や OpenAI 互換プロバイダーに接続します。',
    },
  },
  zh: {
    customProviderName: '本地 / 自定义 (Ollama, LM Studio 等)',
    aiToggleTitle: 'AI 助手 (Petardo AI)',
    aiToggleDesc: '在除设置页面外的整个应用中显示人工智能助手。',
    aiEnabledToast: '已启用 AI 助手',
    aiDisabledToast: '已禁用 AI 助手',
    aiKeyMissingNotice: '环境变量中未配置 AI API 密钥，助手不会显示或启用。',
    providerDescriptions: {
      gemini: 'Google 多模态模型，具备快速推理能力与超大上下文窗口。',
      openai: 'OpenAI 知名的 GPT 系列模型，适用于写作、分析与编程。',
      anthropic: 'Claude 模型具备出色的自然语言理解与细腻流畅的写作能力。',
      groq: '基于 LPU 的极速推理，实现毫秒级响应。',
      deepseek: '具备卓越推理与编程能力的前沿模型。',
      meta: 'Meta 开源模型家族（通过 Groq 或兼容 API 运行）。',
      custom: '连接任何本地服务器（Ollama、LM Studio、vLLM）或兼容 OpenAI 的服务商。',
    },
  },
  ru: {
    customProviderName: 'Локальный / Свой (Ollama, LM Studio и др.)',
    aiToggleTitle: 'ИИ-ассистент (Petardo AI)',
    aiToggleDesc: 'Отображает ИИ-ассистента во всем приложении (кроме окна Настроек).',
    aiEnabledToast: 'ИИ-ассистент включен',
    aiDisabledToast: 'ИИ-ассистент отключен',
    aiKeyMissingNotice: 'API-ключ ИИ не настроен в переменных окружения. Ассистент не отображается и не может быть включен.',
    providerDescriptions: {
      gemini: 'Мультимодальные модели Google с быстрым мышлением и огромным окном контекста.',
      openai: 'Знаменитые модели GPT от OpenAI для текстов, анализа и программирования.',
      anthropic: 'Модели Claude с тонким пониманием естественного языка и безупречным стилем письма.',
      groq: 'Рекордная скорость вывода на базе LPU для ответов за миллисекунды.',
      deepseek: 'Передовые модели с выдающимися способностями к рассуждению и написанию кода.',
      meta: 'Семейство открытых моделей Meta (через Groq или совместимый API).',
      custom: 'Подключайте любой локальный сервер (Ollama, LM Studio, vLLM) или OpenAI-совместимого провайдера.',
    },
  },
};

export function getLocalizedAiProviderMeta(lang?: AppLanguage | string): LocalizedAiProviderStrings {
  if (lang && isSupportedLanguage(lang)) {
    return AI_PROVIDER_I18N[lang];
  }
  return AI_PROVIDER_I18N.es;
}

export { getUiTranslations, type UiTranslations } from '@/lib/i18nExtra';

