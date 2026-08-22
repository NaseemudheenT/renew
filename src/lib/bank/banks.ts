/**
 * The banks, UPI apps and wallets a person can connect to Renew. This is a
 * presentation list only — a curated, searchable set with brand colours and a
 * short monogram for the tile. Which real data provider sits behind the connect
 * action is decided in ./provider (a realistic simulated feed today; a licensed
 * Account Aggregator / open-banking provider later — same interface).
 */

export type InstitutionKind = "bank" | "upi" | "wallet" | "card";

export interface Institution {
  id: string;
  name: string;
  /** 1–3 letter monogram for the brand tile. */
  short: string;
  /** Brand colour for the tile. */
  color: string;
  kind: InstitutionKind;
  /** ISO-3166 regions where this is offered; omitted = show everywhere. */
  regions?: string[];
}

export const INSTITUTIONS: Institution[] = [
  // India — banks
  { id: "hdfc", name: "HDFC Bank", short: "HD", color: "#004C8F", kind: "bank", regions: ["IN"] },
  { id: "icici", name: "ICICI Bank", short: "IC", color: "#AE282E", kind: "bank", regions: ["IN"] },
  { id: "sbi", name: "State Bank of India", short: "SBI", color: "#2D6DB4", kind: "bank", regions: ["IN"] },
  { id: "axis", name: "Axis Bank", short: "AX", color: "#97144D", kind: "bank", regions: ["IN"] },
  { id: "kotak", name: "Kotak Mahindra Bank", short: "KO", color: "#ED1C24", kind: "bank", regions: ["IN"] },
  { id: "bob", name: "Bank of Baroda", short: "BoB", color: "#F15A22", kind: "bank", regions: ["IN"] },
  { id: "pnb", name: "Punjab National Bank", short: "PNB", color: "#A6851F", kind: "bank", regions: ["IN"] },
  { id: "yes", name: "Yes Bank", short: "YB", color: "#00518F", kind: "bank", regions: ["IN"] },
  { id: "idfc", name: "IDFC First Bank", short: "ID", color: "#9C1D26", kind: "bank", regions: ["IN"] },
  { id: "indusind", name: "IndusInd Bank", short: "IIB", color: "#8A1B2E", kind: "bank", regions: ["IN"] },
  // India — UPI & wallets
  { id: "gpay", name: "Google Pay", short: "GP", color: "#1A73E8", kind: "upi", regions: ["IN"] },
  { id: "phonepe", name: "PhonePe", short: "Pe", color: "#5F259F", kind: "upi", regions: ["IN"] },
  { id: "paytm", name: "Paytm", short: "PT", color: "#00BAF2", kind: "wallet", regions: ["IN"] },
  { id: "amazonpay", name: "Amazon Pay", short: "aP", color: "#FF9900", kind: "wallet", regions: ["IN"] },

  // United States
  { id: "chase", name: "Chase", short: "CH", color: "#117ACA", kind: "bank", regions: ["US"] },
  { id: "bofa", name: "Bank of America", short: "BA", color: "#012169", kind: "bank", regions: ["US"] },
  { id: "wells", name: "Wells Fargo", short: "WF", color: "#D71E28", kind: "bank", regions: ["US"] },
  { id: "citi", name: "Citibank", short: "Ci", color: "#003B70", kind: "bank", regions: ["US"] },
  { id: "capitalone", name: "Capital One", short: "C1", color: "#004977", kind: "bank", regions: ["US"] },
  { id: "amex", name: "American Express", short: "AE", color: "#2E77BC", kind: "card", regions: ["US"] },

  // United Kingdom & Europe
  { id: "monzo", name: "Monzo", short: "Mo", color: "#FF3464", kind: "bank", regions: ["GB"] },
  { id: "revolut", name: "Revolut", short: "Re", color: "#0666EB", kind: "bank", regions: ["GB", "IE", "FR", "DE", "ES", "IT", "NL", "PT"] },
  { id: "barclays", name: "Barclays", short: "Ba", color: "#00AEEF", kind: "bank", regions: ["GB"] },
  { id: "lloyds", name: "Lloyds Bank", short: "Ll", color: "#024731", kind: "bank", regions: ["GB"] },
  { id: "hsbc", name: "HSBC", short: "HS", color: "#DB0011", kind: "bank", regions: ["GB", "HK", "SG", "AE"] },
  { id: "deutsche", name: "Deutsche Bank", short: "DB", color: "#0018A8", kind: "bank", regions: ["DE"] },
  { id: "bnp", name: "BNP Paribas", short: "BNP", color: "#00915A", kind: "bank", regions: ["FR"] },
  { id: "santander", name: "Santander", short: "Sa", color: "#EC0000", kind: "bank", regions: ["ES", "GB", "MX", "BR"] },
  { id: "ing", name: "ING", short: "ING", color: "#FF6200", kind: "bank", regions: ["NL", "DE", "BE"] },

  // Asia-Pacific & Middle East
  { id: "dbs", name: "DBS Bank", short: "DBS", color: "#FF3300", kind: "bank", regions: ["SG", "HK"] },
  { id: "ocbc", name: "OCBC Bank", short: "OC", color: "#E11931", kind: "bank", regions: ["SG"] },
  { id: "cba", name: "Commonwealth Bank", short: "CBA", color: "#FFCC00", kind: "bank", regions: ["AU"] },
  { id: "emirates", name: "Emirates NBD", short: "EN", color: "#00573F", kind: "bank", regions: ["AE"] },

  // Global / neobanks — shown everywhere
  { id: "wise", name: "Wise", short: "Wi", color: "#163300", kind: "wallet" },
  { id: "paypal", name: "PayPal", short: "PP", color: "#003087", kind: "wallet" },
];

/** Institutions for a region, most-relevant first, then the rest for search. */
export function institutionsForRegion(region: string): Institution[] {
  const local = INSTITUTIONS.filter((i) => i.regions?.includes(region));
  const global = INSTITUTIONS.filter((i) => !i.regions);
  const others = INSTITUTIONS.filter((i) => i.regions && !i.regions.includes(region));
  return [...local, ...global, ...others];
}

export function institutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find((i) => i.id === id);
}
