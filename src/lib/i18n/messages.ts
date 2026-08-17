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

  "notif.reminder.due": "Reminder due today",
  "notif.reminder.overdue": "Reminder overdue",
  "notif.task.due": "Task due today",
  "notif.task.overdue": "Task overdue",
  "notif.payment.due": "Bill due soon",
  "notif.payment.overdue": "Bill overdue",
  "notif.document.due": "Document expiring soon",
  "notif.document.overdue": "Document expired",
  "notif.budget.warn.title": "Budget almost reached",
  "notif.budget.warn.body": "You've used {percent}% of your {category} budget.",
  "notif.budget.over.title": "Budget exceeded",
  "notif.budget.over.body": "You've gone over your {category} budget this month.",
  "notif.savings.reached.title": "Savings goal reached",
  "notif.savings.reached.body": "You've reached your goal: {name}. 🎉",

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

  "settings.data.title": "Data",
  "settings.data.hint": "Download a copy of your financial data. It stays on your device — Renew never sells or shares it.",
  "settings.data.exportJson": "Export all (JSON)",
  "settings.data.exportCsv": "Export transactions (CSV)",
  "settings.data.exported": "Export ready — check your downloads",
  "settings.data.empty": "Nothing to export yet",
  "settings.data.import": "Import transactions (CSV)",
  "settings.data.import.title": "Import transactions",
  "settings.data.import.summary": "{valid} ready to import · {duplicates} duplicates skipped · {invalid} invalid rows",
  "settings.data.import.confirm": "Import {valid}",
  "settings.data.import.none": "No new transactions found in that file",
  "settings.data.import.done": "Imported {count} transactions",
  "settings.data.import.failed": "Couldn't read that file",
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
    "date.today": "Hoy",
    "date.tomorrow": "Mañana",
    "date.yesterday": "Ayer",
    "notif.reminder.due": "Recordatorio para hoy",
    "notif.reminder.overdue": "Recordatorio vencido",
    "notif.payment.due": "Factura por vencer",
    "notif.payment.overdue": "Factura vencida",
    "notif.budget.warn.title": "Presupuesto casi alcanzado",
    "notif.budget.warn.body": "Has usado el {percent}% de tu presupuesto de {category}.",
    "notif.budget.over.title": "Presupuesto superado",
    "notif.budget.over.body": "Has superado tu presupuesto de {category} este mes.",
    "notif.savings.reached.title": "Meta de ahorro alcanzada",
    "notif.savings.reached.body": "Has alcanzado tu meta: {name}. 🎉",
    "settings.region.title": "Región e idioma",
    "settings.region.language": "Idioma",
    "settings.region.region": "País / región",
    "settings.region.currency": "Moneda",
    "settings.region.timezone": "Zona horaria",
    "settings.region.weekStart": "La semana empieza en",
    "settings.region.weekStart.sunday": "Domingo",
    "settings.region.weekStart.monday": "Lunes",
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
    "nav.more": "Plus",
    "date.today": "Aujourd’hui",
    "date.tomorrow": "Demain",
    "date.yesterday": "Hier",
    "settings.region.weekStart.sunday": "Dimanche",
    "settings.region.weekStart.monday": "Lundi",
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
    "nav.more": "Mehr",
    "date.today": "Heute",
    "date.tomorrow": "Morgen",
    "date.yesterday": "Gestern",
    "settings.region.title": "Region & Sprache",
    "settings.region.currency": "Währung",
    "settings.region.weekStart.sunday": "Sonntag",
    "settings.region.weekStart.monday": "Montag",
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
    "nav.more": "और",
    "date.today": "आज",
    "date.tomorrow": "कल",
    "date.yesterday": "बीता कल",
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
    "nav.more": "المزيد",
    "date.today": "اليوم",
    "date.tomorrow": "غدًا",
    "date.yesterday": "أمس",
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
