export interface Address {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  country: string;
}

export interface Officer {
  name: string;
  role: string;
  appointedOn: string;
  resignedOn?: string;
  nationality: string;
  birthMonth?: number;
  birthYear?: number;
}

export interface PSC {
  name: string;
  natureOfControl: string[];
  notifiedOn: string;
  ceasedOn?: string;
  nationality: string;
}

export enum FlagSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export interface RiskFlag {
  id: string;
  title: string;
  severity: FlagSeverity;
  explanation: string;
  evidenceUrl?: string;
}

export interface ModernSlaveryStatement {
  url: string;
  signedBy: string;
  dateSigned: string;
  compliant: boolean;
}

export interface Company {
  companyNumber: string;
  name: string;
  status: string; // 'active', 'dissolved', 'liquidation', etc.
  type: string;
  incorporationDate: string;
  registeredOffice: Address;
  sicCodes: string[];
}

export interface Dossier {
  company: Company;
  officers: Officer[];
  pscs: PSC[];
  riskFlags: RiskFlag[];
  modernSlavery?: ModernSlaveryStatement;
  generatedAt: string;
}

export interface SearchResult {
  companyNumber: string;
  name: string;
  status: string;
  addressSnippet: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export interface DossierResponse {
  dossier: Dossier;
  report: {
    htmlUrl: string;
    pdfUrl: string;
  };
}