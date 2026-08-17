/**
 * RENEW — UI message catalogs.
 *
 * English is the complete base and the guaranteed fallback: any key missing
 * from another language falls back to English, so the product is always fully
 * usable while catalogs are expanded toward every supported language. Keys are
 * dotted namespaces ("settings.region.title"); values may contain {named}
 * placeholders substituted by translate().
 */

export type MessageKey = keyof typeof EN;
export type Catalog = Partial<Record<MessageKey, string>>;

/** The English base — the single source of truth for available keys. */
export const EN = {
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.add": "Add",
  "common.done": "Done",
  "common.close": "Close",
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.saving": "Saving…",
  "common.search": "Search",
  "search.placeholder": "Search transactions, bills, goals…",
  "search.empty": "No matches",
  "search.hint": "Search across your whole account",

  "install.cta": "Install Renew",
  "install.ios.title": "Install Renew",
  "install.ios.body": "Tap the Share button, then choose “Add to Home Screen” to install Renew.",
  "install.ios.gotit": "Got it",

  "date.today": "Today",
  "date.tomorrow": "Tomorrow",
  "date.yesterday": "Yesterday",

  "nav.dashboard": "Overview",
  "nav.transactions": "Transactions",
  "nav.budget": "Budget",
  "nav.savings": "Savings",
  "nav.investments": "Investments",
  "nav.payments": "Bills",
  "nav.calendar": "Calendar",
  "nav.analytics": "Analytics",
  "nav.settings": "Settings",
  "nav.more": "More",

  "settings.title": "Settings",
  "settings.subtitle": "Make Renew feel like yours.",
  "settings.region.title": "Region & Language",
  "settings.region.language": "Language",
  "settings.region.region": "Country / region",
  "settings.region.currency": "Currency",
  "settings.region.timezone": "Timezone",
  "settings.region.weekStart": "Week starts on",
  "settings.region.weekStart.sunday": "Sunday",
  "settings.region.weekStart.monday": "Monday",
  "settings.region.hint":
    "Auto-detected from your device. Change anything — your choices are saved to your account.",
  "settings.region.saved": "Region & language updated",
} as const;

/** Non-English catalogs. Partial by design; English fills every gap. */
const CATALOGS: Record<string, Catalog> = {
  es: {
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.add": "Añadir",
    "common.done": "Hecho",
    "common.close": "Cerrar",
    "common.loading": "Cargando…",
    "common.retry": "Reintentar",
    "common.saving": "Guardando…",
    "common.search": "Buscar",
    "nav.dashboard": "Resumen",
    "nav.transactions": "Transacciones",
    "nav.budget": "Presupuesto",
    "nav.savings": "Ahorros",
    "nav.investments": "Inversiones",
    "nav.payments": "Facturas",
    "nav.calendar": "Calendario",
    "nav.analytics": "Análisis",
    "nav.settings": "Ajustes",
    "nav.more": "Más",
    "settings.region.title": "Región e idioma",
    "settings.region.language": "Idioma",
    "settings.region.region": "País / región",
    "settings.region.currency": "Moneda",
    "settings.region.timezone": "Zona horaria",
    "settings.region.weekStart": "La semana empieza en",
  },
  fr: {
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.edit": "Modifier",
    "common.delete": "Supprimer",
    "common.add": "Ajouter",
    "common.loading": "Chargement…",
    "nav.dashboard": "Aperçu",
    "nav.transactions": "Transactions",
    "nav.budget": "Budget",
    "nav.savings": "Épargne",
    "nav.investments": "Investissements",
    "nav.payments": "Factures",
    "nav.calendar": "Calendrier",
    "nav.analytics": "Analyses",
    "nav.settings": "Paramètres",
    "settings.region.title": "Région et langue",
    "settings.region.currency": "Devise",
    "settings.region.timezone": "Fuseau horaire",
  },
  de: {
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.delete": "Löschen",
    "nav.dashboard": "Übersicht",
    "nav.transactions": "Transaktionen",
    "nav.budget": "Budget",
    "nav.savings": "Ersparnisse",
    "nav.investments": "Investitionen",
    "nav.payments": "Rechnungen",
    "nav.settings": "Einstellungen",
    "settings.region.title": "Region & Sprache",
    "settings.region.currency": "Währung",
  },
  hi: {
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "nav.dashboard": "अवलोकन",
    "nav.transactions": "लेन-देन",
    "nav.budget": "बजट",
    "nav.savings": "बचत",
    "nav.investments": "निवेश",
    "nav.payments": "बिल",
    "nav.settings": "सेटिंग्स",
    "settings.region.title": "क्षेत्र और भाषा",
  },
  ar: {
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "nav.dashboard": "نظرة عامة",
    "nav.transactions": "المعاملات",
    "nav.budget": "الميزانية",
    "nav.savings": "المدخرات",
    "nav.investments": "الاستثمارات",
    "nav.payments": "الفواتير",
    "nav.settings": "الإعدادات",
    "settings.region.title": "المنطقة واللغة",
  },
};

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

/**
 * Resolve a message key for the given language, falling back to English.
 * `vars` substitutes {named} placeholders.
 */
export function translate(
  language: string,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const base = language.split("-")[0] ?? language;
  const localized = CATALOGS[base]?.[key];
  return interpolate(localized ?? EN[key] ?? key, vars);
}
