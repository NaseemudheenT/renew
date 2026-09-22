/**
 * "Life State" — the honest, deterministic read of a person's financial health
 * that drives the dashboard orb. NO prediction, NO AI, NO fabrication: it is a
 * pure function of real figures (this month's income vs spend, net worth, and
 * whether any bill is overdue). Same inputs always give the same state, so the
 * orb never lies or drifts.
 */

export type LifeStateKey = "attention" | "tight" | "stable" | "thriving" | "quiet";

export interface LifeStateInput {
  /** Income recorded this calendar month, in the display currency. */
  monthIncome: number;
  /** Spending recorded this calendar month. */
  monthExpense: number;
  /** Net worth = all income − all expense (savings are an earmark, not added). */
  netWorth: number;
  /** How many bills are past due right now. */
  overdueCount: number;
}

export interface LifeState {
  key: LifeStateKey;
  /** Short status word shown under the orb (e.g. "Stable"). */
  label: string;
  /** The orb's signature hue (hex) — also used for its glow. */
  tone: string;
  /** One honest, plain-language line about why. */
  blurb: string;
  /** Share of this month's income kept (0–1), or null when there's no income. */
  savingsRate: number | null;
}

const TONES: Record<LifeStateKey, string> = {
  attention: "#fb7185", // coral
  tight: "#f0b429", // amber
  stable: "#2dd4bf", // teal
  thriving: "#34d399", // emerald
  quiet: "#d4af6a", // champagne gold
};

/**
 * Resolve the current life state. Order matters: real problems (overdue bills,
 * negative net worth) are surfaced before anything reassuring.
 */
export function computeLifeState(input: LifeStateInput): LifeState {
  const { monthIncome, monthExpense, netWorth, overdueCount } = input;
  const savingsRate = monthIncome > 0 ? (monthIncome - monthExpense) / monthIncome : null;

  // 1) Something genuinely needs attention.
  if (overdueCount > 0) {
    return {
      key: "attention",
      label: "Needs attention",
      tone: TONES.attention,
      blurb:
        overdueCount === 1
          ? "One bill is past due — clearing it keeps you steady."
          : `${overdueCount} bills are past due — clearing them keeps you steady.`,
      savingsRate,
    };
  }
  if (netWorth < 0) {
    return {
      key: "attention",
      label: "Needs attention",
      tone: TONES.attention,
      blurb: "Spending has outpaced what's come in. Small trims add up.",
      savingsRate,
    };
  }

  // 2) No activity yet this month — stay honest, don't invent a status.
  if (monthIncome === 0 && monthExpense === 0) {
    return {
      key: "quiet",
      label: "All quiet",
      tone: TONES.quiet,
      blurb: "Nothing logged this month yet. Add a transaction to see your state.",
      savingsRate,
    };
  }

  // 3) Spent more than earned this month.
  if (monthIncome > 0 && monthExpense > monthIncome) {
    return {
      key: "tight",
      label: "Running tight",
      tone: TONES.tight,
      blurb: "You've spent more than you earned this month. Worth easing off.",
      savingsRate,
    };
  }

  // 4) Keeping a healthy share of income.
  if (savingsRate !== null && savingsRate >= 0.2) {
    return {
      key: "thriving",
      label: "Thriving",
      tone: TONES.thriving,
      blurb: "You're keeping a healthy share of what you earn. Great pace.",
      savingsRate,
    };
  }

  // 5) Positive, in control.
  return {
    key: "stable",
    label: "Stable",
    tone: TONES.stable,
    blurb:
      monthIncome > 0
        ? "You're earning more than you spend. Steady and in control."
        : "Your money's holding steady.",
    savingsRate,
  };
}
