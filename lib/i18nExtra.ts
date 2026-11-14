import { AppLanguage, isSupportedLanguage } from '@/lib/i18n';

export interface UiTranslations {
  tooltips: {
    noteOptions: string;
    backToParent: string;
    changeIconOrEmoji: string;
    hideAiPanel: string;
    openAiPanel: string;
    chooseNoteColor: string;
    savingChanges: string;
    saveChangesShortcut: string;
    noChangesToSave: string;
    focusModeDisable: string;
    focusModeEnable: string;
    universalCommandPalette: string;
    findReplaceInNote: string;
    hideNoteInfo: string;
    showNoteInfo: string;
    closePanel: string;
    openPetardoAi: string;
    newFileInNotes: string;
    newFileInSection: string;
    ascending: string;
    descending: string;
  };
  subnotes: {
    nestedIn: string;
    badge: string;
    openBtn: string;
    enterSubNoteTitle: string;
    defaultSnippet: string;
    initialBodyPrompt: string;
    createdInNoteToast: string;
    openedToast: string;
    menuHeader: string;
    newSubNoteDefault: string;
    createSubNoteLabel: string;
    createSubNoteSub: string;
    orEmbedExisting: string;
  };
  menus: {
    slash: {
      calendario: string;
      task: string;
      emoji: string;
      icon: string;
      h1: string;
      h2: string;
      h3: string;
      bullet: string;
      code: string;
      quote: string;
      highlight: string;
      table: string;
      wikilink: string;
      githubMention: string;
    };
    github: {
      header: string;
      typeAfterAt: string;
      noUsersFound: string;
      goToProfileTitle: string;
    };
    emoji: {
      header: string;
    };
    context: {
      changeIcon: string;
      changeColor: string;
      newFileHere: string;
      rename: string;
      delete: string;
      unsavedTitle: string;
      unsavedDesc: string;
      discardChanges: string;
      saveAndExit: string;
      renameFileTitle: string;
      renameFolderTitle: string;
      emptyFolder: string;
      createFileHere: string;
      uploadingImage: string;
    };
  };
  findReplace: {
    hideReplace: string;
    showReplace: string;
    findPlaceholder: string;
    clearSearch: string;
    matchCase: string;
    wholeWord: string;
    prevMatch: string;
    nextMatch: string;
    close: string;
    replacePlaceholder: string;
    replaceCurrentTooltip: string;
    replaceBtn: string;
    replaceAllTooltip: string;
    allBtn: string;
    replacedSingleToast: string;
    replacedAllToastSingular: string;
    replacedAllToastPlural: string;
    tableAlignLeft: string;
    tableAlignCenter: string;
    tableAlignRight: string;
    tableInsertRowAbove: string;
    tableRowAboveBtn: string;
    tableInsertRowBelow: string;
    tableRowBelowBtn: string;
    tableDeleteRow: string;
    tableDeleteRowBtn: string;
    tableInsertColLeft: string;
    tableColLeftBtn: string;
    tableInsertColRight: string;
    tableColRightBtn: string;
    tableDeleteCol: string;
    tableDeleteColBtn: string;
    tableDeleteAll: string;
    defaultCol1: string;
    defaultCol2: string;
    defaultCol3: string;
    highlightedTextSample: string;
  };
  noteInfo: {
    title: string;
    statsAndReading: string;
    minRead: string;
    wordsLabel: string;
    charsLabel: string;
    noSpacesLabel: string;
    readingTimeLabel: string;
    tocTitle: string;
    tocEmptyHint: string;
  };
  commandPalette: {
    searchPlaceholder: string;
    clearSearch: string;
    tabToFilter: string;
    noResultsFor: string;
    createNewNoteBtn: string;
    catAll: string;
    catNotes: string;
    catActions: string;
    catFormat: string;
    catTheme: string;
    footerNavigate: string;
    footerExecute: string;
    footerCategory: string;
    footerTitle: string;
    secQuickCreate: string;
    secSyncedNotes: string;
    secCurrentNote: string;
    secActionsNav: string;
    secInsertFormat: string;
    secThemesAppearance: string;
    badgeNew: string;
    badgeCreateMd: string;
    badgeOpen: string;
    badgePinned: string;
    badgeSubnote: string;
    badgeUnsaved: string;
    badgeActive: string;
    rootFolder: string;
    createSubnoteDynamicTitle: string;
    createSubnoteDynamicSub: string;
    createNoteDynamicTitle: string;
    createNoteDynamicSub: string;
    actSaveTitle: string;
    actSaveSub: string;
    actSubnoteTitle: string;
    actSubnoteSub: string;
    actFindTitle: string;
    actFindSub: string;
    actReplaceTitle: string;
    actReplaceSub: string;
    actIconTitle: string;
    actIconSub: string;
    actPinTitle: string;
    actPinSub: string;
    actInfoHideTitle: string;
    actInfoShowTitle: string;
    actInfoSub: string;
    actNewNoteTitle: string;
    actNewNoteSub: string;
    actDailyTitle: string;
    actDailySub: string;
    actNewSectionTitle: string;
    actNewSectionSub: string;
    navDashboardTitle: string;
    navDashboardSub: string;
    navTasksTitle: string;
    navTasksSub: string;
    navCalendarTitle: string;
    navCalendarSub: string;
    navSettingsTitle: string;
    navSettingsSub: string;
    fmtSubnoteTitle: string;
    fmtSubnoteSub: string;
    fmtH1Title: string;
    fmtH1Sub: string;
    fmtH2Title: string;
    fmtH2Sub: string;
    fmtH3Title: string;
    fmtH3Sub: string;
    fmtTaskTitle: string;
    fmtTaskSub: string;
    fmtBulletTitle: string;
    fmtBulletSub: string;
    fmtTableTitle: string;
    fmtTableSub: string;
    fmtCodeTitle: string;
    fmtCodeSub: string;
    fmtQuoteTitle: string;
    fmtQuoteSub: string;
    fmtHighlightTitle: string;
    fmtHighlightSub: string;
    fmtGithubTitle: string;
    fmtGithubSub: string;
    fmtBoldTitle: string;
    fmtBoldSub: string;
    fmtItalicTitle: string;
    fmtItalicSub: string;
    fmtCalendarTitle: string;
    fmtCalendarSub: string;
    fmtHrTitle: string;
    fmtHrSub: string;
    fmtMoveUpTitle: string;
    fmtMoveUpSub: string;
    fmtMoveDownTitle: string;
    fmtMoveDownSub: string;
    thmFocusDisableTitle: string;
    thmFocusEnableTitle: string;
    thmFocusSub: string;
    thmLightTitle: string;
    thmLightSub: string;
    thmDarkTitle: string;
    thmDarkSub: string;
    thmSystemTitle: string;
    thmSystemSub: string;
    thmLayoutCompactTitle: string;
    thmLayoutGridTitle: string;
    thmLayoutSub: string;
    thmSidebarShowTitle: string;
    thmSidebarHideTitle: string;
    thmSidebarSub: string;
    thmSortModTitle: string;
    thmSortModSub: string;
    thmSortCreTitle: string;
    thmSortCreSub: string;
    thmSortNameTitle: string;
    thmSortNameSub: string;
  };
  ai: {
    newChatTitle: string;
    welcomeMessage: string;
    backToChat: string;
    chatHistory: string;
    activeProviderTooltip: string;
    closeAiBar: string;
    savedFor7Days: string;
    noRecentChats: string;
    conversationFallback: string;
    msgSingular: string;
    msgPlural: string;
    deleteBtn: string;
    activeSyncedNote: string;
    greetingPrefix: string;
    partnerFallback: string;
    greetingSub: string;
    cardCreateTitle1: string;
    cardCreateTitle2: string;
    cardCreatePrompt: string;
    cardSummarizeTitle1: string;
    cardSummarizeTitle2: string;
    cardSummarizePrompt: string;
    cardImproveTitle1: string;
    cardImproveTitle2: string;
    cardImprovePrompt: string;
    youLabel: string;
    thoughtForSeconds: string;
    oneContextSource: string;
    copiedTooltip: string;
    copyTooltip: string;
    insertTooltip: string;
    insertBtn: string;
    createMdTooltip: string;
    createMdBtn: string;
    helpfulTooltip: string;
    notHelpfulTooltip: string;
    thinkingAndWriting: string;
    removeContext: string;
    askAboutContextPlaceholder: string;
    askAnythingPlaceholder: string;
    toolsAndContext: string;
    pinCurrentNote: string;
    requestVisualDiagram: string;
    summarizeNote: string;
    improveWriting: string;
    sendMessageAria: string;
    recentLabel: string;
    newChatStartedToast: string;
    chatDeletedToast: string;
    copiedClipboardToast: string;
    insertedIntoNoteToast: string;
    notePinnedContextToast: string;
    noOpenNoteToAttachToast: string;
    improveActionText: string;
    summarizeActionText: string;
    diagramPromptPrefix: string;
  };
}

export const UI_TRANSLATIONS_PART1: Record<'es' | 'en' | 'pt' | 'fr' | 'nl', UiTranslations> = {
  es: {
    tooltips: {
      noteOptions: 'Opciones de la nota',
      backToParent: 'Volver a la nota padre:',
      changeIconOrEmoji: 'Cambiar icono o emoji',
      hideAiPanel: 'Ocultar panel IA',
      openAiPanel: 'Abrir panel IA (Petardo)',
      chooseNoteColor: 'Elegir color de la nota',
      savingChanges: 'Guardando cambios...',
      saveChangesShortcut: 'Guardar cambios (Ctrl+S)',
      noChangesToSave: 'No hay cambios para guardar',
      focusModeDisable: 'Desactivar Modo Enfoque / Máquina de Escribir (Alt+Z)',
      focusModeEnable: 'Activar Modo Enfoque / Máquina de Escribir (Alt+Z)',
      universalCommandPalette: 'Paleta de comandos universal (Ctrl+K)',
      findReplaceInNote: 'Buscar y reemplazar en la nota (Ctrl+F / Ctrl+H)',
      hideNoteInfo: 'Ocultar panel de información',
      showNoteInfo: 'Información e Índice de la nota',
      closePanel: 'Cerrar panel',
      openPetardoAi: 'Abrir Petardo AI',
      newFileInNotes: 'Nuevo archivo en Notas',
      newFileInSection: 'Nuevo archivo en',
      ascending: 'Ascendente',
      descending: 'Descendente',
    },
    subnotes: {
      nestedIn: 'Sub-nota dentro de',
      badge: 'Sub-nota',
      openBtn: 'Abrir',
      enterSubNoteTitle: 'Entrar a la sub-nota:',
      defaultSnippet: 'Sub-nota anidada • Haz clic para entrar y escribir contenido...',
      initialBodyPrompt: 'Escribe aquí el contenido de esta sub-nota...',
      createdInNoteToast: 'Sub-nota creada dentro de esta nota',
      openedToast: 'Sub-nota abierta',
      menuHeader: 'Nota dentro de nota (Estilo Craft / Notion)',
      newSubNoteDefault: 'Nueva sub-nota',
      createSubNoteLabel: 'Crear sub-nota',
      createSubNoteSub: 'Crea e incrusta una página dentro de esta nota',
      orEmbedExisting: 'O incrustar nota existente',
    },
    menus: {
      slash: {
        calendario: 'Calendario',
        task: 'Casilla de Tarea',
        emoji: 'Emoji',
        icon: 'Icono Inline',
        h1: 'Encabezado 1',
        h2: 'Encabezado 2',
        h3: 'Encabezado 3',
        bullet: 'Lista con viñetas',
        code: 'Bloque de código',
        quote: 'Cita destacada',
        highlight: 'Texto resaltado',
        table: 'Tabla estructurada',
        wikilink: 'Sub-nota (Nota dentro de nota)',
        githubMention: 'Mención de GitHub (@usuario)',
      },
      github: {
        header: 'Personas de GitHub',
        typeAfterAt: 'Escribe el usuario de GitHub después de @ (ej. @torvalds)',
        noUsersFound: 'No se encontraron usuarios de GitHub para',
        goToProfileTitle: 'Ir al perfil de GitHub de',
      },
      emoji: {
        header: 'Emojis',
      },
      context: {
        changeIcon: 'Cambiar icono o emoji',
        changeColor: 'Cambiar color',
        newFileHere: 'Nuevo archivo aquí',
        rename: 'Renombrar',
        delete: 'Eliminar',
        unsavedTitle: 'Cambios sin guardar',
        unsavedDesc: 'Tienes modificaciones en esta nota que aún no has guardado en GitHub. ¿Deseas descartarlos o guardar antes de continuar?',
        discardChanges: 'Descartar cambios',
        saveAndExit: 'Guardar y salir',
        renameFileTitle: 'Renombrar archivo',
        renameFolderTitle: 'Renombrar carpeta',
        emptyFolder: 'Esta carpeta está vacía',
        createFileHere: 'Crear un archivo aquí',
        uploadingImage: 'Subiendo imagen...',
      },
    },
    findReplace: {
      hideReplace: 'Ocultar reemplazar',
      showReplace: 'Mostrar reemplazar (Ctrl+H)',
      findPlaceholder: 'Buscar en la nota...',
      clearSearch: 'Limpiar búsqueda',
      matchCase: 'Distinguir mayúsculas y minúsculas',
      wholeWord: 'Coincidir palabra completa',
      prevMatch: 'Anterior (Shift+Enter)',
      nextMatch: 'Siguiente (Enter)',
      close: 'Cerrar (Esc)',
      replacePlaceholder: 'Reemplazar con...',
      replaceCurrentTooltip: 'Reemplazar coincidencia actual (Enter)',
      replaceBtn: 'Reemplazar',
      replaceAllTooltip: 'Reemplazar todas en lote (Shift+Enter)',
      allBtn: 'Todo',
      replacedSingleToast: 'Coincidencia reemplazada',
      replacedAllToastSingular: 'Se reemplazó 1 coincidencia',
      replacedAllToastPlural: 'coincidencias reemplazadas',
      tableAlignLeft: 'Alinear columna a la izquierda',
      tableAlignCenter: 'Centrar columna',
      tableAlignRight: 'Alinear columna a la derecha',
      tableInsertRowAbove: 'Insertar fila arriba',
      tableRowAboveBtn: '+ Arriba',
      tableInsertRowBelow: 'Insertar fila abajo (Enter)',
      tableRowBelowBtn: '+ Abajo',
      tableDeleteRow: 'Eliminar fila actual',
      tableDeleteRowBtn: '- Fila',
      tableInsertColLeft: 'Insertar columna a la izquierda',
      tableColLeftBtn: '+ Izq',
      tableInsertColRight: 'Insertar columna a la derecha',
      tableColRightBtn: '+ Der',
      tableDeleteCol: 'Eliminar columna actual',
      tableDeleteColBtn: '- Col',
      tableDeleteAll: 'Eliminar tabla completa',
      defaultCol1: 'Columna 1',
      defaultCol2: 'Columna 2',
      defaultCol3: 'Columna 3',
      highlightedTextSample: 'texto resaltado',
    },
    noteInfo: {
      title: 'Información de la nota',
      statsAndReading: 'Contador y Lectura',
      minRead: 'min de lectura',
      wordsLabel: 'Palabras',
      charsLabel: 'Caracteres',
      noSpacesLabel: 'Sin espacios',
      readingTimeLabel: 'Tiempo lectura',
      tocTitle: 'Índice de Contenidos',
      tocEmptyHint: 'Agrega encabezados (#, ## o ###) en tu nota para generar el índice automáticamente.',
    },
    commandPalette: {
      searchPlaceholder: 'Escribe para buscar notas, ejecutar comandos, cambiar temas o insertar formato...',
      clearSearch: 'Limpiar búsqueda',
      tabToFilter: 'Tab para filtrar',
      noResultsFor: 'No se encontraron comandos ni notas para',
      createNewNoteBtn: '+ Crear nueva nota',
      catAll: 'Todo',
      catNotes: 'Notas',
      catActions: 'Acciones',
      catFormat: 'Formato',
      catTheme: 'Apariencia',
      footerNavigate: 'Navegar',
      footerExecute: 'Ejecutar',
      footerCategory: 'Categoría',
      footerTitle: 'Paleta Universal · Ctrl+K / ⌘K',
      secQuickCreate: 'Creación rápida',
      secSyncedNotes: 'Notas sincronizadas',
      secCurrentNote: 'Acciones de la nota actual',
      secActionsNav: 'Acciones y Navegación',
      secInsertFormat: 'Insertar Formato en la Nota',
      secThemesAppearance: 'Temas y Apariencia',
      badgeNew: 'Nuevo',
      badgeCreateMd: 'Crear .md',
      badgeOpen: 'Abierta',
      badgePinned: 'Fijada',
      badgeSubnote: 'Sub-nota',
      badgeUnsaved: 'Sin guardar',
      badgeActive: 'Activo',
      rootFolder: 'Raíz de notas',
      createSubnoteDynamicTitle: 'Crear sub-nota dentro de esta nota',
      createSubnoteDynamicSub: 'Incrusta una tarjeta estilo Notion / Craft y crea el archivo',
      createNoteDynamicTitle: 'Crear nueva nota',
      createNoteDynamicSub: 'Crea y abre un nuevo documento Markdown inmediatamente',
      actSaveTitle: 'Guardar cambios en la nota actual',
      actSaveSub: 'Sincroniza el archivo Markdown con GitHub',
      actSubnoteTitle: 'Crear sub-nota dentro de esta nota',
      actSubnoteSub: 'Inserta una sub-nota anidada al estilo Notion / Craft',
      actFindTitle: 'Buscar en la nota actual',
      actFindSub: 'Resalta coincidencias dentro del documento abierto',
      actReplaceTitle: 'Buscar y reemplazar en la nota actual',
      actReplaceSub: 'Reemplaza una o todas las coincidencias del documento',
      actIconTitle: 'Cambiar icono o emoji de la nota actual',
      actIconSub: 'Personaliza el icono visual de esta nota',
      actPinTitle: 'Fijar o desfijar nota actual al inicio',
      actPinSub: 'Mantiene esta nota destacada al principio de la lista',
      actInfoHideTitle: 'Ocultar panel de Información y Tabla de Contenidos',
      actInfoShowTitle: 'Mostrar panel de Información y Tabla de Contenidos',
      actInfoSub: 'Estadísticas de lectura, índice H1-H3 y jerarquía de sub-notas',
      actNewNoteTitle: 'Crear nueva nota',
      actNewNoteSub: 'Abre el asistente para crear un nuevo archivo Markdown',
      actDailyTitle: 'Abrir o crear Nota Diaria de hoy',
      actDailySub: 'Bitácora y lista de tareas con la fecha de hoy',
      actNewSectionTitle: 'Crear nueva sección (Carpeta)',
      actNewSectionSub: 'Organiza tus notas en una nueva categoría',
      navDashboardTitle: 'Ir al Panel principal',
      navDashboardSub: 'Explora todas tus notas sincronizadas',
      navTasksTitle: 'Ir a Todas las tareas',
      navTasksSub: 'Centro de tareas pendientes y completadas en tus notas',
      navCalendarTitle: 'Ir al Calendario',
      navCalendarSub: 'Consulta tus notas diarias y actividad por fecha',
      navSettingsTitle: 'Abrir Configuración',
      navSettingsSub: 'Personaliza fuentes, colores, iconos y preferencias',
      fmtSubnoteTitle: 'Insertar Sub-nota (Nota dentro de nota)',
      fmtSubnoteSub: 'Abre el selector [[ para anidar una sub-nota',
      fmtH1Title: 'Encabezado 1 (Título principal)',
      fmtH1Sub: 'Convierte la línea actual en título H1',
      fmtH2Title: 'Encabezado 2 (Subtítulo)',
      fmtH2Sub: 'Convierte la línea actual en subtítulo H2',
      fmtH3Title: 'Encabezado 3 (Sección)',
      fmtH3Sub: 'Convierte la línea actual en encabezado H3',
      fmtTaskTitle: 'Lista de tareas interactiva',
      fmtTaskSub: 'Inserta casillas de verificación [ ]',
      fmtBulletTitle: 'Lista con viñetas',
      fmtBulletSub: 'Inserta una lista desordenada',
      fmtTableTitle: 'Tabla estructurada (3 columnas)',
      fmtTableSub: 'Inserta una tabla interactiva con encabezados',
      fmtCodeTitle: 'Bloque de código con resaltado de sintaxis',
      fmtCodeSub: 'Inserta un bloque de código multi-lenguaje',
      fmtQuoteTitle: 'Cita / Callout',
      fmtQuoteSub: 'Inserta un bloque de cita destacada',
      fmtHighlightTitle: 'Texto resaltado (Marca textos)',
      fmtHighlightSub: 'Resalta la selección o inserta ==texto resaltado==',
      fmtGithubTitle: 'Mencionar persona de GitHub (@usuario)',
      fmtGithubSub: 'Busca y menciona un usuario de GitHub con enlace directo a su perfil',
      fmtBoldTitle: 'Negrita',
      fmtBoldSub: 'Aplica formato en negrita al texto',
      fmtItalicTitle: 'Cursiva',
      fmtItalicSub: 'Aplica formato en cursiva al texto',
      fmtCalendarTitle: 'Calendario interactivo incrustado',
      fmtCalendarSub: 'Inserta un widget de calendario dentro de la nota',
      fmtHrTitle: 'Separador horizontal',
      fmtHrSub: 'Inserta una línea divisoria limpia en el documento',
      fmtMoveUpTitle: 'Mover párrafo o elemento de lista hacia arriba',
      fmtMoveUpSub: 'Reorganiza el bloque o ítem de lista donde está el cursor',
      fmtMoveDownTitle: 'Mover párrafo o elemento de lista hacia abajo',
      fmtMoveDownSub: 'Reorganiza el bloque o ítem de lista donde está el cursor',
      thmFocusDisableTitle: 'Desactivar Modo Enfoque (Máquina de Escribir)',
      thmFocusEnableTitle: 'Activar Modo Enfoque (Máquina de Escribir)',
      thmFocusSub: 'Mantiene el párrafo activo iluminado mientras atenúa el resto y centra la línea de escritura',
      thmLightTitle: 'Tema: Modo Claro',
      thmLightSub: 'Cambia la interfaz al esquema luminoso limpio',
      thmDarkTitle: 'Tema: Modo Oscuro',
      thmDarkSub: 'Cambia la interfaz al esquema oscuro de alto confort',
      thmSystemTitle: 'Tema: Automático (Sistema)',
      thmSystemSub: 'Sincroniza el tema automáticamente con tu sistema operativo',
      thmLayoutCompactTitle: 'Cambiar vista a Lista Compacta',
      thmLayoutGridTitle: 'Cambiar vista a Cuadrícula de Tarjetas',
      thmLayoutSub: 'Alterna la disposición de las notas en el Panel principal',
      thmSidebarShowTitle: 'Mostrar barra lateral izquierda',
      thmSidebarHideTitle: 'Ocultar barra lateral izquierda',
      thmSidebarSub: 'Modo enfoque sin distracciones',
      thmSortModTitle: 'Ordenar notas por: Última edición',
      thmSortModSub: 'Muestra primero las notas editadas recientemente',
      thmSortCreTitle: 'Ordenar notas por: Fecha de creación',
      thmSortCreSub: 'Ordena cronológicamente según cuándo se crearon',
      thmSortNameTitle: 'Ordenar notas por: Título (A-Z)',
      thmSortNameSub: 'Ordena alfabéticamente todas las notas',
    },
    ai: {
      newChatTitle: 'Nuevo chat',
      welcomeMessage: '¡Hola! Soy **Petardo AI**, tu asistente inteligente. Puedo redactar notas completas, crear archivos `.md`, estructurar ideas, resumir y mejorar tus textos en tiempo real.',
      backToChat: 'Volver al chat',
      chatHistory: 'Historial de chats',
      activeProviderTooltip: 'Proveedor activo',
      closeAiBar: 'Cerrar barra de IA',
      savedFor7Days: 'Guardado durante 7 días',
      noRecentChats: 'No hay conversaciones recientes',
      conversationFallback: 'Conversación',
      msgSingular: 'mensaje',
      msgPlural: 'mensajes',
      deleteBtn: 'Eliminar',
      activeSyncedNote: 'Nota activa sincronizada',
      greetingPrefix: 'Hola',
      partnerFallback: 'compañero',
      greetingSub: 'Dime qué necesitas y me encargo del resto.',
      cardCreateTitle1: 'Crear',
      cardCreateTitle2: 'Nota .md',
      cardCreatePrompt: 'Crea una nueva nota estructurada sobre un tema clave',
      cardSummarizeTitle1: 'Resumir',
      cardSummarizeTitle2: 'Contenido',
      cardSummarizePrompt: 'Resume las ideas y conceptos esenciales en puntos clave',
      cardImproveTitle1: 'Mejorar',
      cardImproveTitle2: 'Redacción',
      cardImprovePrompt: 'Mejora la redacción y claridad de mi texto',
      youLabel: 'Tú',
      thoughtForSeconds: 'Pensó durante {s} segundos',
      oneContextSource: '1 fuente de contexto',
      copiedTooltip: '¡Copiado!',
      copyTooltip: 'Copiar texto',
      insertTooltip: 'Insertar en la nota actual',
      insertBtn: 'Insertar',
      createMdTooltip: 'Crear nuevo archivo .md con esta respuesta',
      createMdBtn: 'Crear .md',
      helpfulTooltip: 'Respuesta útil',
      notHelpfulTooltip: 'Respuesta no útil',
      thinkingAndWriting: 'Pensando y redactando...',
      removeContext: 'Quitar contexto',
      askAboutContextPlaceholder: 'Pregunta sobre "{note}" o pide cambios...',
      askAnythingPlaceholder: 'Pregunta lo que sea o pide redactar una nota...',
      toolsAndContext: 'Herramientas y contexto',
      pinCurrentNote: 'Fijar nota actual',
      requestVisualDiagram: 'Pedir diagrama visual',
      summarizeNote: 'Resumir nota',
      improveWriting: 'Mejorar redacción',
      sendMessageAria: 'Enviar mensaje',
      recentLabel: 'Reciente',
      newChatStartedToast: 'Nuevo chat iniciado',
      chatDeletedToast: 'Conversación eliminada del historial',
      copiedClipboardToast: 'Copiado al portapapeles',
      insertedIntoNoteToast: 'Contenido insertado en la nota',
      notePinnedContextToast: 'Nota fijada como contexto',
      noOpenNoteToAttachToast: 'No hay ninguna nota abierta en el editor para adjuntar',
      improveActionText: 'Mejora la redacción y claridad de la nota actual',
      summarizeActionText: 'Resume los puntos clave de la nota actual',
      diagramPromptPrefix: 'Genera un diagrama visual o ilustración descriptiva de: ',
    },
  },
  en: {
    tooltips: {
      noteOptions: 'Note options',
      backToParent: 'Back to parent note:',
      changeIconOrEmoji: 'Change icon or emoji',
      hideAiPanel: 'Hide AI panel',
      openAiPanel: 'Open AI panel (Petardo)',
      chooseNoteColor: 'Choose note color',
      savingChanges: 'Saving changes...',
      saveChangesShortcut: 'Save changes (Ctrl+S)',
      noChangesToSave: 'No changes to save',
      focusModeDisable: 'Disable Focus / Typewriter Mode (Alt+Z)',
      focusModeEnable: 'Enable Focus / Typewriter Mode (Alt+Z)',
      universalCommandPalette: 'Universal Command Palette (Ctrl+K)',
      findReplaceInNote: 'Find and replace in note (Ctrl+F / Ctrl+H)',
      hideNoteInfo: 'Hide info panel',
      showNoteInfo: 'Note Info & Table of Contents',
      closePanel: 'Close panel',
      openPetardoAi: 'Open Petardo AI',
      newFileInNotes: 'New file in Notes',
      newFileInSection: 'New file in',
      ascending: 'Ascending',
      descending: 'Descending',
    },
    subnotes: {
      nestedIn: 'Sub-note inside',
      badge: 'Sub-note',
      openBtn: 'Open',
      enterSubNoteTitle: 'Open sub-note:',
      defaultSnippet: 'Nested sub-note • Click to enter and write content...',
      initialBodyPrompt: 'Write the content of this sub-note here...',
      createdInNoteToast: 'Sub-note created inside this note',
      openedToast: 'Sub-note opened',
      menuHeader: 'Note inside note (Craft / Notion style)',
      newSubNoteDefault: 'New sub-note',
      createSubNoteLabel: 'Create sub-note',
      createSubNoteSub: 'Creates and embeds a page inside this note',
      orEmbedExisting: 'Or embed existing note',
    },
    menus: {
      slash: {
        calendario: 'Calendar',
        task: 'Task Checkbox',
        emoji: 'Emoji',
        icon: 'Inline Icon',
        h1: 'Heading 1',
        h2: 'Heading 2',
        h3: 'Heading 3',
        bullet: 'Bullet List',
        code: 'Code Block',
        quote: 'Blockquote',
        highlight: 'Highlighted Text',
        table: 'Structured Table',
        wikilink: 'Sub-note (Note inside note)',
        githubMention: 'GitHub Mention (@user)',
      },
      github: {
        header: 'GitHub People',
        typeAfterAt: 'Type a GitHub username after @ (e.g. @torvalds)',
        noUsersFound: 'No GitHub users found for',
        goToProfileTitle: 'Go to GitHub profile of',
      },
      emoji: {
        header: 'Emojis',
      },
      context: {
        changeIcon: 'Change icon or emoji',
        changeColor: 'Change color',
        newFileHere: 'New file here',
        rename: 'Rename',
        delete: 'Delete',
        unsavedTitle: 'Unsaved changes',
        unsavedDesc: 'You have unsaved changes in this note. Would you like to discard them or save before continuing?',
        discardChanges: 'Discard changes',
        saveAndExit: 'Save and exit',
        renameFileTitle: 'Rename file',
        renameFolderTitle: 'Rename folder',
        emptyFolder: 'This folder is empty',
        createFileHere: 'Create a file here',
        uploadingImage: 'Uploading image...',
      },
    },
    findReplace: {
      hideReplace: 'Hide replace',
      showReplace: 'Show replace (Ctrl+H)',
      findPlaceholder: 'Find in note...',
      clearSearch: 'Clear search',
      matchCase: 'Match case',
      wholeWord: 'Match whole word',
      prevMatch: 'Previous (Shift+Enter)',
      nextMatch: 'Next (Enter)',
      close: 'Close (Esc)',
      replacePlaceholder: 'Replace with...',
      replaceCurrentTooltip: 'Replace current match (Enter)',
      replaceBtn: 'Replace',
      replaceAllTooltip: 'Replace all matches (Shift+Enter)',
      allBtn: 'All',
      replacedSingleToast: 'Match replaced',
      replacedAllToastSingular: 'Replaced 1 match',
      replacedAllToastPlural: 'matches replaced',
      tableAlignLeft: 'Align column left',
      tableAlignCenter: 'Center column',
      tableAlignRight: 'Align column right',
      tableInsertRowAbove: 'Insert row above',
      tableRowAboveBtn: '+ Above',
      tableInsertRowBelow: 'Insert row below (Enter)',
      tableRowBelowBtn: '+ Below',
      tableDeleteRow: 'Delete current row',
      tableDeleteRowBtn: '- Row',
      tableInsertColLeft: 'Insert column left',
      tableColLeftBtn: '+ Left',
      tableInsertColRight: 'Insert column right',
      tableColRightBtn: '+ Right',
      tableDeleteCol: 'Delete current column',
      tableDeleteColBtn: '- Col',
      tableDeleteAll: 'Delete entire table',
      defaultCol1: 'Column 1',
      defaultCol2: 'Column 2',
      defaultCol3: 'Column 3',
      highlightedTextSample: 'highlighted text',
    },
    noteInfo: {
      title: 'Note Information',
      statsAndReading: 'Counter & Reading Time',
      minRead: 'min read',
      wordsLabel: 'Words',
      charsLabel: 'Characters',
      noSpacesLabel: 'No spaces',
      readingTimeLabel: 'Reading time',
      tocTitle: 'Table of Contents',
      tocEmptyHint: 'Add headings (#, ## or ###) in your note to automatically generate the table of contents.',
    },
    commandPalette: {
      searchPlaceholder: 'Type to search notes, run commands, switch themes, or insert formatting...',
      clearSearch: 'Clear search',
      tabToFilter: 'Tab to filter',
      noResultsFor: 'No commands or notes found for',
      createNewNoteBtn: '+ Create new note',
      catAll: 'All',
      catNotes: 'Notes',
      catActions: 'Actions',
      catFormat: 'Format',
      catTheme: 'Appearance',
      footerNavigate: 'Navigate',
      footerExecute: 'Run',
      footerCategory: 'Category',
      footerTitle: 'Universal Palette · Ctrl+K / ⌘K',
      secQuickCreate: 'Quick Create',
      secSyncedNotes: 'Synced Notes',
      secCurrentNote: 'Current Note Actions',
      secActionsNav: 'Actions & Navigation',
      secInsertFormat: 'Insert Formatting in Note',
      secThemesAppearance: 'Themes & Appearance',
      badgeNew: 'New',
      badgeCreateMd: 'Create .md',
      badgeOpen: 'Open',
      badgePinned: 'Pinned',
      badgeSubnote: 'Sub-note',
      badgeUnsaved: 'Unsaved',
      badgeActive: 'Active',
      rootFolder: 'Notes root',
      createSubnoteDynamicTitle: 'Create sub-note inside this note',
      createSubnoteDynamicSub: 'Embeds a Notion / Craft style card and creates the file',
      createNoteDynamicTitle: 'Create new note',
      createNoteDynamicSub: 'Immediately creates and opens a new Markdown document',
      actSaveTitle: 'Save changes in current note',
      actSaveSub: 'Syncs the Markdown file with GitHub',
      actSubnoteTitle: 'Create sub-note inside this note',
      actSubnoteSub: 'Inserts a nested sub-note in Notion / Craft style',
      actFindTitle: 'Find in current note',
      actFindSub: 'Highlights matches inside the open document',
      actReplaceTitle: 'Find and replace in current note',
      actReplaceSub: 'Replaces one or all matches in the document',
      actIconTitle: 'Change icon or emoji of current note',
      actIconSub: 'Customize the visual icon of this note',
      actPinTitle: 'Pin or unpin current note to top',
      actPinSub: 'Keeps this note featured at the top of the list',
      actInfoHideTitle: 'Hide Note Info & Table of Contents panel',
      actInfoShowTitle: 'Show Note Info & Table of Contents panel',
      actInfoSub: 'Reading stats, H1-H3 outline, and sub-note hierarchy',
      actNewNoteTitle: 'Create new note',
      actNewNoteSub: 'Opens the wizard to create a new Markdown file',
      actDailyTitle: 'Open or create Today’s Daily Note',
      actDailySub: 'Journal and task list with today’s date',
      actNewSectionTitle: 'Create new section (Folder)',
      actNewSectionSub: 'Organize your notes into a new category',
      navDashboardTitle: 'Go to Dashboard',
      navDashboardSub: 'Browse all your synced notes',
      navTasksTitle: 'Go to All Tasks',
      navTasksSub: 'Hub for pending and completed tasks across your notes',
      navCalendarTitle: 'Go to Calendar',
      navCalendarSub: 'Check your daily notes and activity by date',
      navSettingsTitle: 'Open Settings',
      navSettingsSub: 'Customize fonts, colors, icons, and preferences',
      fmtSubnoteTitle: 'Insert Sub-note (Note inside note)',
      fmtSubnoteSub: 'Opens the [[ selector to nest a sub-note',
      fmtH1Title: 'Heading 1 (Main title)',
      fmtH1Sub: 'Converts the current line into an H1 heading',
      fmtH2Title: 'Heading 2 (Subtitle)',
      fmtH2Sub: 'Converts the current line into an H2 heading',
      fmtH3Title: 'Heading 3 (Section)',
      fmtH3Sub: 'Converts the current line into an H3 heading',
      fmtTaskTitle: 'Interactive Task List',
      fmtTaskSub: 'Inserts checkboxes [ ]',
      fmtBulletTitle: 'Bullet List',
      fmtBulletSub: 'Inserts an unordered list',
      fmtTableTitle: 'Structured Table (3 columns)',
      fmtTableSub: 'Inserts an interactive table with headers',
      fmtCodeTitle: 'Syntax-Highlighted Code Block',
      fmtCodeSub: 'Inserts a multi-language code block',
      fmtQuoteTitle: 'Blockquote / Callout',
      fmtQuoteSub: 'Inserts a highlighted quote block',
      fmtHighlightTitle: 'Highlighted Text (Marker)',
      fmtHighlightSub: 'Highlights selection or inserts ==highlighted text==',
      fmtGithubTitle: 'Mention GitHub Person (@username)',
      fmtGithubSub: 'Search and mention a GitHub user with direct profile link',
      fmtBoldTitle: 'Bold',
      fmtBoldSub: 'Applies bold formatting to text',
      fmtItalicTitle: 'Italic',
      fmtItalicSub: 'Applies italic formatting to text',
      fmtCalendarTitle: 'Embedded Interactive Calendar',
      fmtCalendarSub: 'Inserts a calendar widget inside the note',
      fmtHrTitle: 'Horizontal Divider',
      fmtHrSub: 'Inserts a clean dividing line in the document',
      fmtMoveUpTitle: 'Move paragraph or list item up',
      fmtMoveUpSub: 'Reorders the block or list item at the cursor',
      fmtMoveDownTitle: 'Move paragraph or list item down',
      fmtMoveDownSub: 'Reorders the block or list item at the cursor',
      thmFocusDisableTitle: 'Disable Focus Mode (Typewriter)',
      thmFocusEnableTitle: 'Enable Focus Mode (Typewriter)',
      thmFocusSub: 'Keeps the active paragraph lit while dimming others and centering the writing line',
      thmLightTitle: 'Theme: Light Mode',
      thmLightSub: 'Switches the interface to a clean bright scheme',
      thmDarkTitle: 'Theme: Dark Mode',
      thmDarkSub: 'Switches the interface to a high-comfort dark scheme',
      thmSystemTitle: 'Theme: Automatic (System)',
      thmSystemSub: 'Automatically syncs the theme with your OS',
      thmLayoutCompactTitle: 'Switch view to Compact List',
      thmLayoutGridTitle: 'Switch view to Card Grid',
      thmLayoutSub: 'Toggles the note layout on the Dashboard',
      thmSidebarShowTitle: 'Show left sidebar',
      thmSidebarHideTitle: 'Hide left sidebar',
      thmSidebarSub: 'Distraction-free focus layout',
      thmSortModTitle: 'Sort notes by: Last modified',
      thmSortModSub: 'Shows recently edited notes first',
      thmSortCreTitle: 'Sort notes by: Created date',
      thmSortCreSub: 'Sorts chronologically by creation time',
      thmSortNameTitle: 'Sort notes by: Title (A-Z)',
      thmSortNameSub: 'Sorts all notes alphabetically',
    },
    ai: {
      newChatTitle: 'New chat',
      welcomeMessage: 'Hello! I am **Petardo AI**, your smart assistant. I can draft full notes, create `.md` files, structure ideas, summarize, and improve your writing in real time.',
      backToChat: 'Back to chat',
      chatHistory: 'Chat history',
      activeProviderTooltip: 'Active provider',
      closeAiBar: 'Close AI sidebar',
      savedFor7Days: 'Saved for 7 days',
      noRecentChats: 'No recent conversations',
      conversationFallback: 'Conversation',
      msgSingular: 'message',
      msgPlural: 'messages',
      deleteBtn: 'Delete',
      activeSyncedNote: 'Active synced note',
      greetingPrefix: 'Hello',
      partnerFallback: 'friend',
      greetingSub: 'Tell me what you need and I will handle the rest.',
      cardCreateTitle1: 'Create',
      cardCreateTitle2: 'Note .md',
      cardCreatePrompt: 'Create a new structured note about a key topic',
      cardSummarizeTitle1: 'Summarize',
      cardSummarizeTitle2: 'Content',
      cardSummarizePrompt: 'Summarize the essential ideas and concepts into key points',
      cardImproveTitle1: 'Improve',
      cardImproveTitle2: 'Writing',
      cardImprovePrompt: 'Improve the writing and clarity of my text',
      youLabel: 'You',
      thoughtForSeconds: 'Thought for {s} seconds',
      oneContextSource: '1 context source',
      copiedTooltip: 'Copied!',
      copyTooltip: 'Copy text',
      insertTooltip: 'Insert into current note',
      insertBtn: 'Insert',
      createMdTooltip: 'Create new .md file with this response',
      createMdBtn: 'Create .md',
      helpfulTooltip: 'Helpful response',
      notHelpfulTooltip: 'Unhelpful response',
      thinkingAndWriting: 'Thinking and writing...',
      removeContext: 'Remove context',
      askAboutContextPlaceholder: 'Ask about "{note}" or request edits...',
      askAnythingPlaceholder: 'Ask anything or request a note draft...',
      toolsAndContext: 'Tools & context',
      pinCurrentNote: 'Pin current note',
      requestVisualDiagram: 'Request visual diagram',
      summarizeNote: 'Summarize note',
      improveWriting: 'Improve writing',
      sendMessageAria: 'Send message',
      recentLabel: 'Recent',
      newChatStartedToast: 'New chat started',
      chatDeletedToast: 'Conversation removed from history',
      copiedClipboardToast: 'Copied to clipboard',
      insertedIntoNoteToast: 'Content inserted into note',
      notePinnedContextToast: 'Note pinned as context',
      noOpenNoteToAttachToast: 'No note is currently open in the editor to attach',
      improveActionText: 'Improve the writing and clarity of the current note',
      summarizeActionText: 'Summarize the key points of the current note',
      diagramPromptPrefix: 'Generate a visual diagram or descriptive illustration of: ',
    },
  },
  pt: {
    tooltips: {
      noteOptions: 'Opções da nota',
      backToParent: 'Voltar para a nota pai:',
      changeIconOrEmoji: 'Alterar ícone ou emoji',
      hideAiPanel: 'Ocultar painel de IA',
      openAiPanel: 'Abrir painel de IA (Petardo)',
      chooseNoteColor: 'Escolher cor da nota',
      savingChanges: 'Salvando alterações...',
      saveChangesShortcut: 'Salvar alterações (Ctrl+S)',
      noChangesToSave: 'Nenhuma alteração para salvar',
      focusModeDisable: 'Desativar Modo Foco / Máquina de Escrever (Alt+Z)',
      focusModeEnable: 'Ativar Modo Foco / Máquina de Escrever (Alt+Z)',
      universalCommandPalette: 'Paleta de comandos universal (Ctrl+K)',
      findReplaceInNote: 'Buscar e substituir na nota (Ctrl+F / Ctrl+H)',
      hideNoteInfo: 'Ocultar painel de informações',
      showNoteInfo: 'Informações e Índice da nota',
      closePanel: 'Fechar painel',
      openPetardoAi: 'Abrir Petardo AI',
      newFileInNotes: 'Novo arquivo em Notas',
      newFileInSection: 'Novo arquivo em',
      ascending: 'Crescente',
      descending: 'Decrescente',
    },
    subnotes: {
      nestedIn: 'Subnota dentro de',
      badge: 'Subnota',
      openBtn: 'Abrir',
      enterSubNoteTitle: 'Entrar na subnota:',
      defaultSnippet: 'Subnota aninhada • Clique para entrar e escrever conteúdo...',
      initialBodyPrompt: 'Escreva aqui o conteúdo desta subnota...',
      createdInNoteToast: 'Subnota criada dentro desta nota',
      openedToast: 'Subnota aberta',
      menuHeader: 'Nota dentro de nota (Estilo Craft / Notion)',
      newSubNoteDefault: 'Nova subnota',
      createSubNoteLabel: 'Criar subnota',
      createSubNoteSub: 'Cria e incorpora uma página dentro desta nota',
      orEmbedExisting: 'Ou incorporar nota existente',
    },
    menus: {
      slash: {
        calendario: 'Calendário',
        task: 'Caixa de Tarefa',
        emoji: 'Emoji',
        icon: 'Ícone Inline',
        h1: 'Título 1',
        h2: 'Título 2',
        h3: 'Título 3',
        bullet: 'Lista com marcadores',
        code: 'Bloco de código',
        quote: 'Citação destacada',
        highlight: 'Texto destacado',
        table: 'Tabela estruturada',
        wikilink: 'Subnota (Nota dentro de nota)',
        githubMention: 'Menção do GitHub (@usuário)',
      },
      github: {
        header: 'Pessoas do GitHub',
        typeAfterAt: 'Digite o usuário do GitHub após @ (ex. @torvalds)',
        noUsersFound: 'Nenhum usuário do GitHub encontrado para',
        goToProfileTitle: 'Ir para o perfil do GitHub de',
      },
      emoji: {
        header: 'Emojis',
      },
      context: {
        changeIcon: 'Alterar ícone ou emoji',
        changeColor: 'Alterar cor',
        newFileHere: 'Novo arquivo aqui',
        rename: 'Renomear',
        delete: 'Excluir',
        unsavedTitle: 'Alterações não salvas',
        unsavedDesc: 'Você tem modificações nesta nota que ainda não foram salvas. Deseja descartá-las ou salvar antes de continuar?',
        discardChanges: 'Descartar alterações',
        saveAndExit: 'Salvar e sair',
        renameFileTitle: 'Renomear arquivo',
        renameFolderTitle: 'Renomear pasta',
        emptyFolder: 'Esta pasta está vazia',
        createFileHere: 'Criar um arquivo aqui',
        uploadingImage: 'Enviando imagem...',
      },
    },
    findReplace: {
      hideReplace: 'Ocultar substituir',
      showReplace: 'Mostrar substituir (Ctrl+H)',
      findPlaceholder: 'Buscar na nota...',
      clearSearch: 'Limpar busca',
      matchCase: 'Diferenciar maiúsculas e minúsculas',
      wholeWord: 'Palavra inteira',
      prevMatch: 'Anterior (Shift+Enter)',
      nextMatch: 'Próximo (Enter)',
      close: 'Fechar (Esc)',
      replacePlaceholder: 'Substituir por...',
      replaceCurrentTooltip: 'Substituir ocorrência atual (Enter)',
      replaceBtn: 'Substituir',
      replaceAllTooltip: 'Substituir todas em lote (Shift+Enter)',
      allBtn: 'Tudo',
      replacedSingleToast: 'Ocorrência substituída',
      replacedAllToastSingular: '1 ocorrência substituída',
      replacedAllToastPlural: 'ocorrências substituídas',
      tableAlignLeft: 'Alinhar coluna à esquerda',
      tableAlignCenter: 'Centralizar coluna',
      tableAlignRight: 'Alinhar coluna à direita',
      tableInsertRowAbove: 'Inserir linha acima',
      tableRowAboveBtn: '+ Acima',
      tableInsertRowBelow: 'Inserir linha abaixo (Enter)',
      tableRowBelowBtn: '+ Abaixo',
      tableDeleteRow: 'Excluir linha atual',
      tableDeleteRowBtn: '- Linha',
      tableInsertColLeft: 'Inserir coluna à esquerda',
      tableColLeftBtn: '+ Esq',
      tableInsertColRight: 'Inserir coluna à direita',
      tableColRightBtn: '+ Dir',
      tableDeleteCol: 'Excluir coluna atual',
      tableDeleteColBtn: '- Col',
      tableDeleteAll: 'Excluir tabela inteira',
      defaultCol1: 'Coluna 1',
      defaultCol2: 'Coluna 2',
      defaultCol3: 'Coluna 3',
      highlightedTextSample: 'texto destacado',
    },
    noteInfo: {
      title: 'Informações da nota',
      statsAndReading: 'Contador e Leitura',
      minRead: 'min de leitura',
      wordsLabel: 'Palavras',
      charsLabel: 'Caracteres',
      noSpacesLabel: 'Sem espaços',
      readingTimeLabel: 'Tempo de leitura',
      tocTitle: 'Índice de Conteúdo',
      tocEmptyHint: 'Adicione títulos (#, ## ou ###) na sua nota para gerar o índice automaticamente.',
    },
    commandPalette: {
      searchPlaceholder: 'Digite para buscar notas, executar comandos, mudar temas ou inserir formatação...',
      clearSearch: 'Limpar busca',
      tabToFilter: 'Tab para filtrar',
      noResultsFor: 'Nenhum comando ou nota encontrado para',
      createNewNoteBtn: '+ Criar nova nota',
      catAll: 'Tudo',
      catNotes: 'Notas',
      catActions: 'Ações',
      catFormat: 'Formato',
      catTheme: 'Aparência',
      footerNavigate: 'Navegar',
      footerExecute: 'Executar',
      footerCategory: 'Categoria',
      footerTitle: 'Paleta Universal · Ctrl+K / ⌘K',
      secQuickCreate: 'Criação rápida',
      secSyncedNotes: 'Notas sincronizadas',
      secCurrentNote: 'Ações da nota atual',
      secActionsNav: 'Ações e Navegação',
      secInsertFormat: 'Inserir Formatação na Nota',
      secThemesAppearance: 'Temas e Aparência',
      badgeNew: 'Novo',
      badgeCreateMd: 'Criar .md',
      badgeOpen: 'Aberta',
      badgePinned: 'Fixada',
      badgeSubnote: 'Subnota',
      badgeUnsaved: 'Não salvo',
      badgeActive: 'Ativo',
      rootFolder: 'Raiz de notas',
      createSubnoteDynamicTitle: 'Criar subnota dentro desta nota',
      createSubnoteDynamicSub: 'Incorpora um cartão estilo Notion / Craft e cria o arquivo',
      createNoteDynamicTitle: 'Criar nova nota',
      createNoteDynamicSub: 'Cria e abre um novo documento Markdown imediatamente',
      actSaveTitle: 'Salvar alterações na nota atual',
      actSaveSub: 'Sincroniza o arquivo Markdown com o GitHub',
      actSubnoteTitle: 'Criar subnota dentro desta nota',
      actSubnoteSub: 'Insere uma subnota aninhada estilo Notion / Craft',
      actFindTitle: 'Buscar na nota atual',
      actFindSub: 'Destaca ocorrências dentro do documento aberto',
      actReplaceTitle: 'Buscar e substituir na nota atual',
      actReplaceSub: 'Substitui uma ou todas as ocorrências do documento',
      actIconTitle: 'Alterar ícone ou emoji da nota atual',
      actIconSub: 'Personalize o ícone visual desta nota',
      actPinTitle: 'Fixar ou desafixar nota atual no topo',
      actPinSub: 'Mantém esta nota destacada no início da lista',
      actInfoHideTitle: 'Ocultar painel de Informações e Índice',
      actInfoShowTitle: 'Mostrar painel de Informações e Índice',
      actInfoSub: 'Estatísticas de leitura, índice H1-H3 e hierarquia de subnotas',
      actNewNoteTitle: 'Criar nova nota',
      actNewNoteSub: 'Abre o assistente para criar um novo arquivo Markdown',
      actDailyTitle: 'Abrir ou criar Nota Diária de hoje',
      actDailySub: 'Diário e lista de tarefas com a data de hoje',
      actNewSectionTitle: 'Criar nova seção (Pasta)',
      actNewSectionSub: 'Organize suas notas em uma nova categoria',
      navDashboardTitle: 'Ir para o Painel principal',
      navDashboardSub: 'Explore todas as suas notas sincronizadas',
      navTasksTitle: 'Ir para Todas as tarefas',
      navTasksSub: 'Central de tarefas pendentes e concluídas',
      navCalendarTitle: 'Ir para o Calendário',
      navCalendarSub: 'Consulte suas notas diárias e atividades por data',
      navSettingsTitle: 'Abrir Configurações',
      navSettingsSub: 'Personalize fontes, cores, ícones e preferências',
      fmtSubnoteTitle: 'Inserir Subnota (Nota dentro de nota)',
      fmtSubnoteSub: 'Abre o seletor [[ para aninhar uma subnota',
      fmtH1Title: 'Título 1 (Principal)',
      fmtH1Sub: 'Converte a linha atual em título H1',
      fmtH2Title: 'Título 2 (Subtítulo)',
      fmtH2Sub: 'Converte a linha atual em subtítulo H2',
      fmtH3Title: 'Título 3 (Seção)',
      fmtH3Sub: 'Converte a linha atual em título H3',
      fmtTaskTitle: 'Lista de tarefas interativa',
      fmtTaskSub: 'Insere caixas de seleção [ ]',
      fmtBulletTitle: 'Lista com marcadores',
      fmtBulletSub: 'Insere uma lista não ordenada',
      fmtTableTitle: 'Tabela estruturada (3 colunas)',
      fmtTableSub: 'Insere uma tabela interativa com cabeçalhos',
      fmtCodeTitle: 'Bloco de código com realce de sintaxe',
      fmtCodeSub: 'Insere um bloco de código multilíngue',
      fmtQuoteTitle: 'Citação / Callout',
      fmtQuoteSub: 'Insere um bloco de citação destacada',
      fmtHighlightTitle: 'Texto destacado (Marca-texto)',
      fmtHighlightSub: 'Destaca a seleção ou insere ==texto destacado==',
      fmtGithubTitle: 'Mencionar pessoa do GitHub (@usuário)',
      fmtGithubSub: 'Busque e mencione um usuário do GitHub com link direto',
      fmtBoldTitle: 'Negrito',
      fmtBoldSub: 'Aplica formatação em negrito ao texto',
      fmtItalicTitle: 'Itálico',
      fmtItalicSub: 'Aplica formatação em itálico ao texto',
      fmtCalendarTitle: 'Calendário interativo incorporado',
      fmtCalendarSub: 'Insere um widget de calendário dentro da nota',
      fmtHrTitle: 'Separador horizontal',
      fmtHrSub: 'Insere uma linha divisória limpa no documento',
      fmtMoveUpTitle: 'Mover parágrafo ou item de lista para cima',
      fmtMoveUpSub: 'Reorganiza o bloco ou item onde está o cursor',
      fmtMoveDownTitle: 'Mover parágrafo ou item de lista para baixo',
      fmtMoveDownSub: 'Reorganiza o bloco ou item onde está o cursor',
      thmFocusDisableTitle: 'Desativar Modo Foco (Máquina de Escrever)',
      thmFocusEnableTitle: 'Ativar Modo Foco (Máquina de Escrever)',
      thmFocusSub: 'Mantém o parágrafo ativo iluminado e centraliza a linha de escrita',
      thmLightTitle: 'Tema: Modo Claro',
      thmLightSub: 'Altera a interface para o esquema claro',
      thmDarkTitle: 'Tema: Modo Escuro',
      thmDarkSub: 'Altera a interface para o esquema escuro',
      thmSystemTitle: 'Tema: Automático (Sistema)',
      thmSystemSub: 'Sincroniza o tema automaticamente com seu sistema',
      thmLayoutCompactTitle: 'Mudar vista para Lista Compacta',
      thmLayoutGridTitle: 'Mudar vista para Grade de Cartões',
      thmLayoutSub: 'Alterna a disposição das notas no Painel principal',
      thmSidebarShowTitle: 'Mostrar barra lateral esquerda',
      thmSidebarHideTitle: 'Ocultar barra lateral esquerda',
      thmSidebarSub: 'Modo foco sem distrações',
      thmSortModTitle: 'Ordenar notas por: Última edição',
      thmSortModSub: 'Mostra primeiro as notas editadas recentemente',
      thmSortCreTitle: 'Ordenar notas por: Data de criação',
      thmSortCreSub: 'Ordena cronologicamente por data de criação',
      thmSortNameTitle: 'Ordenar notas por: Título (A-Z)',
      thmSortNameSub: 'Ordena alfabeticamente todas as notas',
    },
    ai: {
      newChatTitle: 'Novo chat',
      welcomeMessage: 'Olá! Sou o **Petardo AI**, seu assistente inteligente. Posso redigir notas completas, criar arquivos `.md`, estruturar ideias, resumir e melhorar seus textos em tempo real.',
      backToChat: 'Voltar ao chat',
      chatHistory: 'Histórico de chats',
      activeProviderTooltip: 'Provedor ativo',
      closeAiBar: 'Fechar barra de IA',
      savedFor7Days: 'Salvo por 7 dias',
      noRecentChats: 'Nenhuma conversa recente',
      conversationFallback: 'Conversa',
      msgSingular: 'mensagem',
      msgPlural: 'mensagens',
      deleteBtn: 'Excluir',
      activeSyncedNote: 'Nota ativa sincronizada',
      greetingPrefix: 'Olá',
      partnerFallback: 'parceiro',
      greetingSub: 'Diga o que você precisa e eu cuido do resto.',
      cardCreateTitle1: 'Criar',
      cardCreateTitle2: 'Nota .md',
      cardCreatePrompt: 'Crie uma nova nota estruturada sobre um tema importante',
      cardSummarizeTitle1: 'Resumir',
      cardSummarizeTitle2: 'Conteúdo',
      cardSummarizePrompt: 'Resuma as ideias e conceitos essenciais em pontos-chave',
      cardImproveTitle1: 'Melhorar',
      cardImproveTitle2: 'Redação',
      cardImprovePrompt: 'Melhore a redação e clareza do meu texto',
      youLabel: 'Você',
      thoughtForSeconds: 'Pensou por {s} segundos',
      oneContextSource: '1 fonte de contexto',
      copiedTooltip: 'Copiado!',
      copyTooltip: 'Copiar texto',
      insertTooltip: 'Inserir na nota atual',
      insertBtn: 'Inserir',
      createMdTooltip: 'Criar novo arquivo .md com esta resposta',
      createMdBtn: 'Criar .md',
      helpfulTooltip: 'Resposta útil',
      notHelpfulTooltip: 'Resposta não útil',
      thinkingAndWriting: 'Pensando e escrevendo...',
      removeContext: 'Remover contexto',
      askAboutContextPlaceholder: 'Pergunte sobre "{note}" ou peça alterações...',
      askAnythingPlaceholder: 'Pergunte qualquer coisa ou peça para redigir uma nota...',
      toolsAndContext: 'Ferramentas e contexto',
      pinCurrentNote: 'Fixar nota atual',
      requestVisualDiagram: 'Pedir diagrama visual',
      summarizeNote: 'Resumir nota',
      improveWriting: 'Melhorar redação',
      sendMessageAria: 'Enviar mensagem',
      recentLabel: 'Recente',
      newChatStartedToast: 'Novo chat iniciado',
      chatDeletedToast: 'Conversa removida do histórico',
      copiedClipboardToast: 'Copiado para a área de transferência',
      insertedIntoNoteToast: 'Conteúdo inserido na nota',
      notePinnedContextToast: 'Nota fixada como contexto',
      noOpenNoteToAttachToast: 'Nenhuma nota aberta no editor para anexar',
      improveActionText: 'Melhore a redação e clareza da nota atual',
      summarizeActionText: 'Resuma os pontos-chave da nota atual',
      diagramPromptPrefix: 'Gere um diagrama visual ou ilustração descritiva de: ',
    },
  },
  fr: {
    tooltips: {
      noteOptions: 'Options de la note',
      backToParent: 'Retour à la note parente :',
      changeIconOrEmoji: 'Changer l’icône ou l’émoji',
      hideAiPanel: 'Masquer le panneau IA',
      openAiPanel: 'Ouvrir le panneau IA (Petardo)',
      chooseNoteColor: 'Choisir la couleur de la note',
      savingChanges: 'Enregistrement...',
      saveChangesShortcut: 'Enregistrer les modifications (Ctrl+S)',
      noChangesToSave: 'Aucune modification à enregistrer',
      focusModeDisable: 'Désactiver le Mode Focus / Machine à écrire (Alt+Z)',
      focusModeEnable: 'Activer le Mode Focus / Machine à écrire (Alt+Z)',
      universalCommandPalette: 'Palette de commandes universelle (Ctrl+K)',
      findReplaceInNote: 'Rechercher et remplacer dans la note (Ctrl+F / Ctrl+H)',
      hideNoteInfo: 'Masquer le panneau d’informations',
      showNoteInfo: 'Informations et Sommaire de la note',
      closePanel: 'Fermer le panneau',
      openPetardoAi: 'Ouvrir Petardo AI',
      newFileInNotes: 'Nouveau fichier dans Notes',
      newFileInSection: 'Nouveau fichier dans',
      ascending: 'Croissant',
      descending: 'Décroissant',
    },
    subnotes: {
      nestedIn: 'Sous-note dans',
      badge: 'Sous-note',
      openBtn: 'Ouvrir',
      enterSubNoteTitle: 'Ouvrir la sous-note :',
      defaultSnippet: 'Sous-note imbriquée • Cliquez pour ouvrir et rédiger...',
      initialBodyPrompt: 'Écrivez ici le contenu de cette sous-note...',
      createdInNoteToast: 'Sous-note créée dans cette note',
      openedToast: 'Sous-note ouverte',
      menuHeader: 'Note dans une note (Style Craft / Notion)',
      newSubNoteDefault: 'Nouvelle sous-note',
      createSubNoteLabel: 'Créer la sous-note',
      createSubNoteSub: 'Crée et intègre une page dans cette note',
      orEmbedExisting: 'Ou intégrer une note existante',
    },
    menus: {
      slash: {
        calendario: 'Calendrier',
        task: 'Case de tâche',
        emoji: 'Émoji',
        icon: 'Icône en ligne',
        h1: 'Titre 1',
        h2: 'Titre 2',
        h3: 'Titre 3',
        bullet: 'Liste à puces',
        code: 'Bloc de code',
        quote: 'Citation',
        highlight: 'Texte surligné',
        table: 'Tableau structuré',
        wikilink: 'Sous-note (Note dans une note)',
        githubMention: 'Mention GitHub (@utilisateur)',
      },
      github: {
        header: 'Utilisateurs GitHub',
        typeAfterAt: 'Tapez un nom d’utilisateur GitHub après @ (ex. @torvalds)',
        noUsersFound: 'Aucun utilisateur GitHub trouvé pour',
        goToProfileTitle: 'Voir le profil GitHub de',
      },
      emoji: {
        header: 'Émojis',
      },
      context: {
        changeIcon: 'Changer l’icône ou l’émoji',
        changeColor: 'Changer la couleur',
        newFileHere: 'Nouveau fichier ici',
        rename: 'Renommer',
        delete: 'Supprimer',
        unsavedTitle: 'Modifications non enregistrées',
        unsavedDesc: 'Vous avez des modifications non enregistrées dans cette note. Voulez-vous les ignorer ou enregistrer avant de continuer ?',
        discardChanges: 'Ignorer',
        saveAndExit: 'Enregistrer et quitter',
        renameFileTitle: 'Renommer le fichier',
        renameFolderTitle: 'Renommer le dossier',
        emptyFolder: 'Ce dossier est vide',
        createFileHere: 'Créer un fichier ici',
        uploadingImage: 'Téléversement de l’image...',
      },
    },
    findReplace: {
      hideReplace: 'Masquer remplacer',
      showReplace: 'Afficher remplacer (Ctrl+H)',
      findPlaceholder: 'Rechercher dans la note...',
      clearSearch: 'Effacer la recherche',
      matchCase: 'Respecter la casse',
      wholeWord: 'Mot entier',
      prevMatch: 'Précédent (Shift+Entrée)',
      nextMatch: 'Suivant (Entrée)',
      close: 'Fermer (Échap)',
      replacePlaceholder: 'Remplacer par...',
      replaceCurrentTooltip: 'Remplacer l’occurrence actuelle (Entrée)',
      replaceBtn: 'Remplacer',
      replaceAllTooltip: 'Tout remplacer (Shift+Entrée)',
      allBtn: 'Tout',
      replacedSingleToast: 'Occurrence remplacée',
      replacedAllToastSingular: '1 occurrence remplacée',
      replacedAllToastPlural: 'occurrences remplacées',
      tableAlignLeft: 'Aligner la colonne à gauche',
      tableAlignCenter: 'Centrer la colonne',
      tableAlignRight: 'Aligner la colonne à droite',
      tableInsertRowAbove: 'Insérer une ligne au-dessus',
      tableRowAboveBtn: '+ Haut',
      tableInsertRowBelow: 'Insérer une ligne en dessous (Entrée)',
      tableRowBelowBtn: '+ Bas',
      tableDeleteRow: 'Supprimer la ligne actuelle',
      tableDeleteRowBtn: '- Ligne',
      tableInsertColLeft: 'Insérer une colonne à gauche',
      tableColLeftBtn: '+ Gauche',
      tableInsertColRight: 'Insérer une colonne à droite',
      tableColRightBtn: '+ Droite',
      tableDeleteCol: 'Supprimer la colonne actuelle',
      tableDeleteColBtn: '- Col',
      tableDeleteAll: 'Supprimer tout le tableau',
      defaultCol1: 'Colonne 1',
      defaultCol2: 'Colonne 2',
      defaultCol3: 'Colonne 3',
      highlightedTextSample: 'texte surligné',
    },
    noteInfo: {
      title: 'Informations sur la note',
      statsAndReading: 'Compteur et Lecture',
      minRead: 'min de lecture',
      wordsLabel: 'Mots',
      charsLabel: 'Caractères',
      noSpacesLabel: 'Sans espaces',
      readingTimeLabel: 'Temps de lecture',
      tocTitle: 'Sommaire',
      tocEmptyHint: 'Ajoutez des titres (#, ## ou ###) dans votre note pour générer automatiquement le sommaire.',
    },
    commandPalette: {
      searchPlaceholder: 'Tapez pour chercher des notes, exécuter des commandes, changer de thème ou formater...',
      clearSearch: 'Effacer la recherche',
      tabToFilter: 'Tab pour filtrer',
      noResultsFor: 'Aucune commande ni note trouvée pour',
      createNewNoteBtn: '+ Créer une nouvelle note',
      catAll: 'Tout',
      catNotes: 'Notes',
      catActions: 'Actions',
      catFormat: 'Format',
      catTheme: 'Apparence',
      footerNavigate: 'Naviguer',
      footerExecute: 'Exécuter',
      footerCategory: 'Catégorie',
      footerTitle: 'Palette Universelle · Ctrl+K / ⌘K',
      secQuickCreate: 'Création rapide',
      secSyncedNotes: 'Notes synchronisées',
      secCurrentNote: 'Actions de la note actuelle',
      secActionsNav: 'Actions et Navigation',
      secInsertFormat: 'Insérer un Format dans la Note',
      secThemesAppearance: 'Thèmes et Apparence',
      badgeNew: 'Nouveau',
      badgeCreateMd: 'Créer .md',
      badgeOpen: 'Ouverte',
      badgePinned: 'Épinglée',
      badgeSubnote: 'Sous-note',
      badgeUnsaved: 'Non enregistré',
      badgeActive: 'Actif',
      rootFolder: 'Racine des notes',
      createSubnoteDynamicTitle: 'Créer une sous-note dans cette note',
      createSubnoteDynamicSub: 'Intègre une carte style Notion / Craft et crée le fichier',
      createNoteDynamicTitle: 'Créer une nouvelle note',
      createNoteDynamicSub: 'Crée et ouvre immédiatement un nouveau document Markdown',
      actSaveTitle: 'Enregistrer les modifications de la note actuelle',
      actSaveSub: 'Synchronise le fichier Markdown avec GitHub',
      actSubnoteTitle: 'Créer une sous-note dans cette note',
      actSubnoteSub: 'Insère une sous-note imbriquée style Notion / Craft',
      actFindTitle: 'Rechercher dans la note actuelle',
      actFindSub: 'Met en évidence les occurrences dans le document ouvert',
      actReplaceTitle: 'Rechercher et remplacer dans la note actuelle',
      actReplaceSub: 'Remplace une ou toutes les occurrences du document',
      actIconTitle: 'Changer l’icône ou l’émoji de la note actuelle',
      actIconSub: 'Personnalisez l’icône visuelle de cette note',
      actPinTitle: 'Épingler ou désépingler la note actuelle',
      actPinSub: 'Garde cette note en haut de la liste',
      actInfoHideTitle: 'Masquer le panneau d’Informations et Sommaire',
      actInfoShowTitle: 'Afficher le panneau d’Informations et Sommaire',
      actInfoSub: 'Statistiques de lecture, plan H1-H3 et sous-notes',
      actNewNoteTitle: 'Créer une nouvelle note',
      actNewNoteSub: 'Ouvre l’assistant pour créer un nouveau fichier Markdown',
      actDailyTitle: 'Ouvrir ou créer la Note Quotidienne d’aujourd’hui',
      actDailySub: 'Journal et liste de tâches à la date du jour',
      actNewSectionTitle: 'Créer une nouvelle section (Dossier)',
      actNewSectionSub: 'Organisez vos notes dans une nouvelle catégorie',
      navDashboardTitle: 'Aller au Tableau de bord',
      navDashboardSub: 'Parcourez toutes vos notes synchronisées',
      navTasksTitle: 'Aller à Toutes les tâches',
      navTasksSub: 'Centre des tâches en attente et terminées',
      navCalendarTitle: 'Aller au Calendrier',
      navCalendarSub: 'Consultez vos notes quotidiennes par date',
      navSettingsTitle: 'Ouvrir les Paramètres',
      navSettingsSub: 'Personnalisez polices, couleurs, icônes et préférences',
      fmtSubnoteTitle: 'Insérer une Sous-note (Note dans une note)',
      fmtSubnoteSub: 'Ouvre le sélecteur [[ pour imbriquer une sous-note',
      fmtH1Title: 'Titre 1 (Titre principal)',
      fmtH1Sub: 'Convertit la ligne actuelle en titre H1',
      fmtH2Title: 'Titre 2 (Sous-titre)',
      fmtH2Sub: 'Convertit la ligne actuelle en sous-titre H2',
      fmtH3Title: 'Titre 3 (Section)',
      fmtH3Sub: 'Convertit la ligne actuelle en titre H3',
      fmtTaskTitle: 'Liste de tâches interactive',
      fmtTaskSub: 'Insère des cases à cocher [ ]',
      fmtBulletTitle: 'Liste à puces',
      fmtBulletSub: 'Insère une liste non ordonnée',
      fmtTableTitle: 'Tableau structuré (3 colonnes)',
      fmtTableSub: 'Insère un tableau interactif avec en-têtes',
      fmtCodeTitle: 'Bloc de code avec coloration syntaxique',
      fmtCodeSub: 'Insère un bloc de code multilingue',
      fmtQuoteTitle: 'Citation / Callout',
      fmtQuoteSub: 'Insère un bloc de citation mis en avant',
      fmtHighlightTitle: 'Texte surligné (Marqueur)',
      fmtHighlightSub: 'Surligne la sélection ou insère ==texte surligné==',
      fmtGithubTitle: 'Mentionner une personne GitHub (@utilisateur)',
      fmtGithubSub: 'Recherchez et mentionnez un utilisateur GitHub',
      fmtBoldTitle: 'Gras',
      fmtBoldSub: 'Applique le format gras au texte',
      fmtItalicTitle: 'Italique',
      fmtItalicSub: 'Applique le format italique au texte',
      fmtCalendarTitle: 'Calendrier interactif intégré',
      fmtCalendarSub: 'Insère un widget de calendrier dans la note',
      fmtHrTitle: 'Séparateur horizontal',
      fmtHrSub: 'Insère une ligne de séparation dans le document',
      fmtMoveUpTitle: 'Déplacer le paragraphe ou l’élément vers le haut',
      fmtMoveUpSub: 'Réorganise le bloc où se trouve le curseur',
      fmtMoveDownTitle: 'Déplacer le paragraphe ou l’élément vers le bas',
      fmtMoveDownSub: 'Réorganise le bloc où se trouve le curseur',
      thmFocusDisableTitle: 'Désactiver le Mode Focus (Machine à écrire)',
      thmFocusEnableTitle: 'Activer le Mode Focus (Machine à écrire)',
      thmFocusSub: 'Illumine le paragraphe actif et centre la ligne d’écriture',
      thmLightTitle: 'Thème : Mode Clair',
      thmLightSub: 'Passe l’interface au thème clair',
      thmDarkTitle: 'Thème : Mode Sombre',
      thmDarkSub: 'Passe l’interface au thème sombre',
      thmSystemTitle: 'Thème : Automatique (Système)',
      thmSystemSub: 'Synchronise automatiquement le thème avec votre OS',
      thmLayoutCompactTitle: 'Passer à la vue Liste Compacte',
      thmLayoutGridTitle: 'Passer à la vue Grille de Cartes',
      thmLayoutSub: 'Change la disposition des notes sur le Tableau de bord',
      thmSidebarShowTitle: 'Afficher la barre latérale gauche',
      thmSidebarHideTitle: 'Masquer la barre latérale gauche',
      thmSidebarSub: 'Mode concentration sans distractions',
      thmSortModTitle: 'Trier les notes par : Dernière modification',
      thmSortModSub: 'Affiche d’abord les notes récemment modifiées',
      thmSortCreTitle: 'Trier les notes par : Date de création',
      thmSortCreSub: 'Trie chronologiquement par date de création',
      thmSortNameTitle: 'Trier les notes par : Titre (A-Z)',
      thmSortNameSub: 'Trie toutes les notes par ordre alphabétique',
    },
    ai: {
      newChatTitle: 'Nouvelle discussion',
      welcomeMessage: 'Bonjour ! Je suis **Petardo AI**, votre assistant intelligent. Je peux rédiger des notes complètes, créer des fichiers `.md`, structurer des idées, résumer et améliorer vos textes en temps réel.',
      backToChat: 'Retour au chat',
      chatHistory: 'Historique des discussions',
      activeProviderTooltip: 'Fournisseur actif',
      closeAiBar: 'Fermer le panneau IA',
      savedFor7Days: 'Conservé pendant 7 jours',
      noRecentChats: 'Aucune conversation récente',
      conversationFallback: 'Conversation',
      msgSingular: 'message',
      msgPlural: 'messages',
      deleteBtn: 'Supprimer',
      activeSyncedNote: 'Note active synchronisée',
      greetingPrefix: 'Bonjour',
      partnerFallback: 'collègue',
      greetingSub: 'Dites-moi ce dont vous avez besoin et je m’occupe du reste.',
      cardCreateTitle1: 'Créer',
      cardCreateTitle2: 'Note .md',
      cardCreatePrompt: 'Crée une nouvelle note structurée sur un sujet clé',
      cardSummarizeTitle1: 'Résumer',
      cardSummarizeTitle2: 'Contenu',
      cardSummarizePrompt: 'Résume les idées et concepts essentiels en points clés',
      cardImproveTitle1: 'Améliorer',
      cardImproveTitle2: 'Rédaction',
      cardImprovePrompt: 'Améliore la rédaction et la clarté de mon texte',
      youLabel: 'Vous',
      thoughtForSeconds: 'A réfléchi pendant {s} secondes',
      oneContextSource: '1 source de contexte',
      copiedTooltip: 'Copié !',
      copyTooltip: 'Copier le texte',
      insertTooltip: 'Insérer dans la note actuelle',
      insertBtn: 'Insérer',
      createMdTooltip: 'Créer un nouveau fichier .md avec cette réponse',
      createMdBtn: 'Créer .md',
      helpfulTooltip: 'Réponse utile',
      notHelpfulTooltip: 'Réponse non utile',
      thinkingAndWriting: 'Réflexion et rédaction...',
      removeContext: 'Retirer le contexte',
      askAboutContextPlaceholder: 'Posez une question sur « {note} » ou demandez des modifications...',
      askAnythingPlaceholder: 'Posez une question ou demandez de rédiger une note...',
      toolsAndContext: 'Outils et contexte',
      pinCurrentNote: 'Épingler la note actuelle',
      requestVisualDiagram: 'Demander un diagramme visuel',
      summarizeNote: 'Résumer la note',
      improveWriting: 'Améliorer la rédaction',
      sendMessageAria: 'Envoyer le message',
      recentLabel: 'Récent',
      newChatStartedToast: 'Nouvelle discussion démarrée',
      chatDeletedToast: 'Conversation supprimée de l’historique',
      copiedClipboardToast: 'Copié dans le presse-papiers',
      insertedIntoNoteToast: 'Contenu inséré dans la note',
      notePinnedContextToast: 'Note épinglée comme contexte',
      noOpenNoteToAttachToast: 'Aucune note ouverte dans l’éditeur à joindre',
      improveActionText: 'Améliore la rédaction et la clarté de la note actuelle',
      summarizeActionText: 'Résume les points clés de la note actuelle',
      diagramPromptPrefix: 'Génère un diagramme visuel ou une illustration descriptive de : ',
    },
  },
  nl: {
    tooltips: {
      noteOptions: 'Notitie-opties',
      backToParent: 'Terug naar bovenliggende notitie:',
      changeIconOrEmoji: 'Icoon of emoji wijzigen',
      hideAiPanel: 'AI-paneel verbergen',
      openAiPanel: 'AI-paneel openen (Petardo)',
      chooseNoteColor: 'Notitiekleur kiezen',
      savingChanges: 'Wijzigingen opslaan...',
      saveChangesShortcut: 'Wijzigingen opslaan (Ctrl+S)',
      noChangesToSave: 'Geen wijzigingen om op te slaan',
      focusModeDisable: 'Focusmodus / Typemachinemodus uitschakelen (Alt+Z)',
      focusModeEnable: 'Focusmodus / Typemachinemodus inschakelen (Alt+Z)',
      universalCommandPalette: 'Universeel opdrachtpalet (Ctrl+K)',
      findReplaceInNote: 'Zoeken en vervangen in notitie (Ctrl+F / Ctrl+H)',
      hideNoteInfo: 'Informatiepaneel verbergen',
      showNoteInfo: 'Notitie-info & Inhoudsopgave',
      closePanel: 'Paneel sluiten',
      openPetardoAi: 'Petardo AI openen',
      newFileInNotes: 'Nieuw bestand in Notities',
      newFileInSection: 'Nieuw bestand in',
      ascending: 'Oplopend',
      descending: 'Aflopend',
    },
    subnotes: {
      nestedIn: 'Subnotitie binnen',
      badge: 'Subnotitie',
      openBtn: 'Openen',
      enterSubNoteTitle: 'Subnotitie openen:',
      defaultSnippet: 'Geneste subnotitie • Klik om te openen en te schrijven...',
      initialBodyPrompt: 'Schrijf hier de inhoud van deze subnotitie...',
      createdInNoteToast: 'Subnotitie aangemaakt binnen deze notitie',
      openedToast: 'Subnotitie geopend',
      menuHeader: 'Notitie in notitie (Craft / Notion-stijl)',
      newSubNoteDefault: 'Nieuwe subnotitie',
      createSubNoteLabel: 'Subnotitie maken',
      createSubNoteSub: 'Maakt en sluit een pagina in binnen deze notitie',
      orEmbedExisting: 'Of bestaande notitie insluiten',
    },
    menus: {
      slash: {
        calendario: 'Kalender',
        task: 'Taakvakje',
        emoji: 'Emoji',
        icon: 'Inline-icoon',
        h1: 'Kop 1',
        h2: 'Kop 2',
        h3: 'Kop 3',
        bullet: 'Opsommingslijst',
        code: 'Codeblok',
        quote: 'Citaat',
        highlight: 'Gemarkeerde tekst',
        table: 'Gestructureerde tabel',
        wikilink: 'Subnotitie (Notitie in notitie)',
        githubMention: 'GitHub-vermelding (@gebruiker)',
      },
      github: {
        header: 'GitHub-personen',
        typeAfterAt: 'Typ een GitHub-gebruikersnaam na @ (bijv. @torvalds)',
        noUsersFound: 'Geen GitHub-gebruikers gevonden voor',
        goToProfileTitle: 'Ga naar GitHub-profiel van',
      },
      emoji: {
        header: 'Emoji’s',
      },
      context: {
        changeIcon: 'Icoon of emoji wijzigen',
        changeColor: 'Kleur wijzigen',
        newFileHere: 'Nieuw bestand hier',
        rename: 'Hernoemen',
        delete: 'Verwijderen',
        unsavedTitle: 'Niet-opgeslagen wijzigingen',
        unsavedDesc: 'Je hebt niet-opgeslagen wijzigingen in deze notitie. Wil je ze verwerpen of opslaan voordat je doorgaat?',
        discardChanges: 'Wijzigingen verwerpen',
        saveAndExit: 'Opslaan en sluiten',
        renameFileTitle: 'Bestand hernoemen',
        renameFolderTitle: 'Map hernoemen',
        emptyFolder: 'Deze map is leeg',
        createFileHere: 'Maak hier een bestand aan',
        uploadingImage: 'Afbeelding uploaden...',
      },
    },
    findReplace: {
      hideReplace: 'Vervangen verbergen',
      showReplace: 'Vervangen tonen (Ctrl+H)',
      findPlaceholder: 'Zoeken in notitie...',
      clearSearch: 'Zoekopdracht wissen',
      matchCase: 'Hoofdlettergevoelig',
      wholeWord: 'Heel woord',
      prevMatch: 'Vorige (Shift+Enter)',
      nextMatch: 'Volgende (Enter)',
      close: 'Sluiten (Esc)',
      replacePlaceholder: 'Vervangen door...',
      replaceCurrentTooltip: 'Huidige overeenkomst vervangen (Enter)',
      replaceBtn: 'Vervangen',
      replaceAllTooltip: 'Alles vervangen (Shift+Enter)',
      allBtn: 'Alles',
      replacedSingleToast: 'Overeenkomst vervangen',
      replacedAllToastSingular: '1 overeenkomst vervangen',
      replacedAllToastPlural: 'overeenkomsten vervangen',
      tableAlignLeft: 'Kolom links uitlijnen',
      tableAlignCenter: 'Kolom centreren',
      tableAlignRight: 'Kolom rechts uitlijnen',
      tableInsertRowAbove: 'Rij erboven invoegen',
      tableRowAboveBtn: '+ Boven',
      tableInsertRowBelow: 'Rij eronder invoegen (Enter)',
      tableRowBelowBtn: '+ Onder',
      tableDeleteRow: 'Huidige rij verwijderen',
      tableDeleteRowBtn: '- Rij',
      tableInsertColLeft: 'Kolom links invoegen',
      tableColLeftBtn: '+ Links',
      tableInsertColRight: 'Kolom rechts invoegen',
      tableColRightBtn: '+ Rechts',
      tableDeleteCol: 'Huidige kolom verwijderen',
      tableDeleteColBtn: '- Kol',
      tableDeleteAll: 'Volledige tabel verwijderen',
      defaultCol1: 'Kolom 1',
      defaultCol2: 'Kolom 2',
      defaultCol3: 'Kolom 3',
      highlightedTextSample: 'gemarkeerde tekst',
    },
    noteInfo: {
      title: 'Notitie-informatie',
      statsAndReading: 'Teller & Leestijd',
      minRead: 'min leestijd',
      wordsLabel: 'Woorden',
      charsLabel: 'Tekens',
      noSpacesLabel: 'Zonder spaties',
      readingTimeLabel: 'Leestijd',
      tocTitle: 'Inhoudsopgave',
      tocEmptyHint: 'Voeg koppen (#, ## of ###) toe aan je notitie om automatisch de inhoudsopgave te genereren.',
    },
    commandPalette: {
      searchPlaceholder: 'Typ om notities te zoeken, opdrachten uit te voeren, thema’s te wisselen of opmaak in te voegen...',
      clearSearch: 'Zoekopdracht wissen',
      tabToFilter: 'Tab om te filteren',
      noResultsFor: 'Geen opdrachten of notities gevonden voor',
      createNewNoteBtn: '+ Nieuwe notitie maken',
      catAll: 'Alles',
      catNotes: 'Notities',
      catActions: 'Acties',
      catFormat: 'Opmaak',
      catTheme: 'Weergave',
      footerNavigate: 'Navigeren',
      footerExecute: 'Uitvoeren',
      footerCategory: 'Categorie',
      footerTitle: 'Universeel Palet · Ctrl+K / ⌘K',
      secQuickCreate: 'Snel aanmaken',
      secSyncedNotes: 'Gesynchroniseerde notities',
      secCurrentNote: 'Acties voor huidige notitie',
      secActionsNav: 'Acties & Navigatie',
      secInsertFormat: 'Opmaak invoegen in notitie',
      secThemesAppearance: 'Thema’s & Weergave',
      badgeNew: 'Nieuw',
      badgeCreateMd: 'Maak .md',
      badgeOpen: 'Geopend',
      badgePinned: 'Vastgezet',
      badgeSubnote: 'Subnotitie',
      badgeUnsaved: 'Niet opgeslagen',
      badgeActive: 'Actief',
      rootFolder: 'Notitiewortel',
      createSubnoteDynamicTitle: 'Subnotitie maken binnen deze notitie',
      createSubnoteDynamicSub: 'Sluit een Notion / Craft-stijl kaart in en maakt het bestand aan',
      createNoteDynamicTitle: 'Nieuwe notitie maken',
      createNoteDynamicSub: 'Maakt en opent direct een nieuw Markdown-document',
      actSaveTitle: 'Wijzigingen in huidige notitie opslaan',
      actSaveSub: 'Synchroniseert het Markdown-bestand met GitHub',
      actSubnoteTitle: 'Subnotitie maken binnen deze notitie',
      actSubnoteSub: 'Voegt een geneste subnotitie toe in Notion / Craft-stijl',
      actFindTitle: 'Zoeken in huidige notitie',
      actFindSub: 'Markeert overeenkomsten in het geopende document',
      actReplaceTitle: 'Zoeken en vervangen in huidige notitie',
      actReplaceSub: 'Vervangt één of alle overeenkomsten in het document',
      actIconTitle: 'Icoon of emoji van huidige notitie wijzigen',
      actIconSub: 'Pas het visuele icoon van deze notitie aan',
      actPinTitle: 'Huidige notitie bovenaan vastzetten of losmaken',
      actPinSub: 'Houdt deze notitie bovenaan de lijst',
      actInfoHideTitle: 'Paneel Notitie-info & Inhoudsopgave verbergen',
      actInfoShowTitle: 'Paneel Notitie-info & Inhoudsopgave tonen',
      actInfoSub: 'Leesstatistieken, H1-H3-overzicht en subnotities',
      actNewNoteTitle: 'Nieuwe notitie maken',
      actNewNoteSub: 'Opent de assistent om een nieuw Markdown-bestand te maken',
      actDailyTitle: 'Dagelijkse notitie van vandaag openen of maken',
      actDailySub: 'Dagboek en takenlijst met de datum van vandaag',
      actNewSectionTitle: 'Nieuwe sectie maken (Map)',
      actNewSectionSub: 'Organiseer je notities in een nieuwe categorie',
      navDashboardTitle: 'Ga naar Dashboard',
      navDashboardSub: 'Bekijk al je gesynchroniseerde notities',
      navTasksTitle: 'Ga naar Alle taken',
      navTasksSub: 'Overzicht van openstaande en voltooide taken',
      navCalendarTitle: 'Ga naar Kalender',
      navCalendarSub: 'Bekijk je dagelijkse notities op datum',
      navSettingsTitle: 'Instellingen openen',
      navSettingsSub: 'Pas lettertypen, kleuren, iconen en voorkeuren aan',
      fmtSubnoteTitle: 'Subnotitie invoegen (Notitie in notitie)',
      fmtSubnoteSub: 'Opent de [[-kiezer om een subnotitie in te sluiten',
      fmtH1Title: 'Kop 1 (Hoofdtitel)',
      fmtH1Sub: 'Zet de huidige regel om in een H1-kop',
      fmtH2Title: 'Kop 2 (Subtitel)',
      fmtH2Sub: 'Zet de huidige regel om in een H2-kop',
      fmtH3Title: 'Kop 3 (Sectie)',
      fmtH3Sub: 'Zet de huidige regel om in een H3-kop',
      fmtTaskTitle: 'Interactieve takenlijst',
      fmtTaskSub: 'Voegt selectievakjes [ ] in',
      fmtBulletTitle: 'Opsommingslijst',
      fmtBulletSub: 'Voegt een ongeordende lijst in',
      fmtTableTitle: 'Gestructureerde tabel (3 kolommen)',
      fmtTableSub: 'Voegt een interactieve tabel met kopteksten in',
      fmtCodeTitle: 'Codeblok met syntaxisaccentuering',
      fmtCodeSub: 'Voegt een meertalig codeblok in',
      fmtQuoteTitle: 'Citaat / Callout',
      fmtQuoteSub: 'Voegt een opvallend citaatblok in',
      fmtHighlightTitle: 'Gemarkeerde tekst (Markeerstift)',
      fmtHighlightSub: 'Markeert selectie of voegt ==gemarkeerde tekst== in',
      fmtGithubTitle: 'GitHub-persoon vermelden (@gebruiker)',
      fmtGithubSub: 'Zoek en vermeld een GitHub-gebruiker met profiellink',
      fmtBoldTitle: 'Vetgedrukt',
      fmtBoldSub: 'Past vette opmaak toe op tekst',
      fmtItalicTitle: 'Cursief',
      fmtItalicSub: 'Past cursieve opmaak toe op tekst',
      fmtCalendarTitle: 'Ingesloten interactieve kalender',
      fmtCalendarSub: 'Voegt een kalenderwidget toe in de notitie',
      fmtHrTitle: 'Horizontale scheidingslijn',
      fmtHrSub: 'Voegt een strakke scheidingslijn in',
      fmtMoveUpTitle: 'Alinea of lijstitem omhoog verplaatsen',
      fmtMoveUpSub: 'Verplaatst het blok waar de cursor staat',
      fmtMoveDownTitle: 'Alinea of lijstitem omlaag verplaatsen',
      fmtMoveDownSub: 'Verplaatst het blok waar de cursor staat',
      thmFocusDisableTitle: 'Focusmodus uitschakelen (Typemachine)',
      thmFocusEnableTitle: 'Focusmodus inschakelen (Typemachine)',
      thmFocusSub: 'Houdt de actieve alinea verlicht en centreert de schrijfregel',
      thmLightTitle: 'Thema: Lichte modus',
      thmLightSub: 'Schakelt over naar het heldere lichte thema',
      thmDarkTitle: 'Thema: Donkere modus',
      thmDarkSub: 'Schakelt over naar het rustige donkere thema',
      thmSystemTitle: 'Thema: Automatisch (Systeem)',
      thmSystemSub: 'Synchroniseert het thema automatisch met je besturingssysteem',
      thmLayoutCompactTitle: 'Weergave wijzigen naar Compacte lijst',
      thmLayoutGridTitle: 'Weergave wijzigen naar Kaartraster',
      thmLayoutSub: 'Wisselt de indeling van notities op het Dashboard',
      thmSidebarShowTitle: 'Linkerzijbalk tonen',
      thmSidebarHideTitle: 'Linkerzijbalk verbergen',
      thmSidebarSub: 'Afleidingsvrije focusmodus',
      thmSortModTitle: 'Notities sorteren op: Laatst gewijzigd',
      thmSortModSub: 'Toont recent bewerkte notities eerst',
      thmSortCreTitle: 'Notities sorteren op: Aanmaakdatum',
      thmSortCreSub: 'Sorteert chronologisch op aanmaakdatum',
      thmSortNameTitle: 'Notities sorteren op: Titel (A-Z)',
      thmSortNameSub: 'Sorteert alle notities alfabetisch',
    },
    ai: {
      newChatTitle: 'Nieuwe chat',
      welcomeMessage: 'Hallo! Ik ben **Petardo AI**, je slimme assistent. Ik kan volledige notities opstellen, `.md`-bestanden maken, ideeën structureren, samenvatten en je teksten in realtime verbeteren.',
      backToChat: 'Terug naar chat',
      chatHistory: 'Chatgeschiedenis',
      activeProviderTooltip: 'Actieve provider',
      closeAiBar: 'AI-zijbalk sluiten',
      savedFor7Days: '7 dagen bewaard',
      noRecentChats: 'Geen recente gesprekken',
      conversationFallback: 'Gesprek',
      msgSingular: 'bericht',
      msgPlural: 'berichten',
      deleteBtn: 'Verwijderen',
      activeSyncedNote: 'Actieve gesynchroniseerde notitie',
      greetingPrefix: 'Hallo',
      partnerFallback: 'collega',
      greetingSub: 'Vertel me wat je nodig hebt en ik regel de rest.',
      cardCreateTitle1: 'Maak',
      cardCreateTitle2: 'Notitie .md',
      cardCreatePrompt: 'Maak een nieuwe gestructureerde notitie over een belangrijk onderwerp',
      cardSummarizeTitle1: 'Samenvatten',
      cardSummarizeTitle2: 'Inhoud',
      cardSummarizePrompt: 'Vat de belangrijkste ideeën en concepten samen in kernpunten',
      cardImproveTitle1: 'Verbeteren',
      cardImproveTitle2: 'Schrijfstijl',
      cardImprovePrompt: 'Verbeter de schrijfstijl en duidelijkheid van mijn tekst',
      youLabel: 'Jij',
      thoughtForSeconds: 'Dacht {s} seconden na',
      oneContextSource: '1 contextbron',
      copiedTooltip: 'Gekopieerd!',
      copyTooltip: 'Tekst kopiëren',
      insertTooltip: 'Invoegen in huidige notitie',
      insertBtn: 'Invoegen',
      createMdTooltip: 'Nieuw .md-bestand maken met dit antwoord',
      createMdBtn: 'Maak .md',
      helpfulTooltip: 'Nuttig antwoord',
      notHelpfulTooltip: 'Niet nuttig antwoord',
      thinkingAndWriting: 'Nadenken en schrijven...',
      removeContext: 'Context verwijderen',
      askAboutContextPlaceholder: 'Vraag over "{note}" of vraag om aanpassingen...',
      askAnythingPlaceholder: 'Vraag alles of laat een notitie opstellen...',
      toolsAndContext: 'Tools & context',
      pinCurrentNote: 'Huidige notitie vastzetten',
      requestVisualDiagram: 'Visueel diagram vragen',
      summarizeNote: 'Notitie samenvatten',
      improveWriting: 'Schrijfstijl verbeteren',
      sendMessageAria: 'Bericht verzenden',
      recentLabel: 'Recent',
      newChatStartedToast: 'Nieuwe chat gestart',
      chatDeletedToast: 'Gesprek verwijderd uit geschiedenis',
      copiedClipboardToast: 'Gekopieerd naar klembord',
      insertedIntoNoteToast: 'Inhoud ingevoegd in notitie',
      notePinnedContextToast: 'Notitie vastgezet als context',
      noOpenNoteToAttachToast: 'Er is momenteel geen notitie geopend om bij te voegen',
      improveActionText: 'Verbeter de schrijfstijl en duidelijkheid van de huidige notitie',
      summarizeActionText: 'Vat de kernpunten van de huidige notitie samen',
      diagramPromptPrefix: 'Genereer een visueel diagram of beschrijvende illustratie van: ',
    },
  },
};

import { UI_TRANSLATIONS_PART2 } from '@/lib/i18nExtraPart2';

export const UI_TRANSLATIONS: Record<AppLanguage, UiTranslations> = {
  ...UI_TRANSLATIONS_PART1,
  ...UI_TRANSLATIONS_PART2,
};

export function getUiTranslations(lang?: AppLanguage | string): UiTranslations {
  if (lang && isSupportedLanguage(lang)) {
    return UI_TRANSLATIONS[lang];
  }
  return UI_TRANSLATIONS.es;
}

