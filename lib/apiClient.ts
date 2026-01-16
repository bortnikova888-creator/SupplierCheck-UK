import { DossierResponse, SearchResponse, FlagSeverity } from '../types';

const MOCK_MODE = true;

// --- Mock Data ---

const MOCK_SEARCH_RESULTS: SearchResponse['results'] = [
  {
    companyNumber: '01234567',
    name: 'ACME SOLUTIONS LTD',
    status: 'active',
    addressSnippet: '123 High St, London, SW1A 1AA',
  },
  {
    companyNumber: '99887766',
    name: 'DODGY BROTHERS ENTERPRISES LTD',
    status: 'active',
    addressSnippet: 'Unit 4, Dark Lane, Birmingham, B2 4QA',
  },
  {
    companyNumber: '11223344',
    name: 'GLOBAL MEGA CORP PLC',
    status: 'active',
    addressSnippet: '1 Canada Square, London, E14 5AB',
  },
];

const MOCK_DOSSIERS: Record<string, DossierResponse> = {
  '01234567': {
    dossier: {
      generatedAt: '2023-10-27T10:00:00Z',
      company: {
        companyNumber: '01234567',
        name: 'ACME SOLUTIONS LTD',
        status: 'active',
        type: 'ltd',
        incorporationDate: '2010-05-15',
        registeredOffice: {
          line1: '123 High St',
          town: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom',
        },
        sicCodes: ['62020 - Information technology consultancy activities'],
      },
      officers: [
        {
          name: 'SMITH, John',
          role: 'Director',
          appointedOn: '2010-05-15',
          nationality: 'British',
          birthMonth: 4,
          birthYear: 1980,
        },
        {
          name: 'JONES, Sarah',
          role: 'Secretary',
          appointedOn: '2015-01-20',
          nationality: 'British',
        },
      ],
      pscs: [
        {
          name: 'SMITH, John',
          natureOfControl: ['Ownership of shares – 75% or more'],
          notifiedOn: '2016-04-06',
          nationality: 'British',
        },
      ],
      riskFlags: [],
      modernSlavery: {
        url: 'https://example.com/ms-statement.pdf',
        signedBy: 'John Smith',
        dateSigned: '2023-01-15',
        compliant: true,
      },
    },
    report: {
      htmlUrl: 'javascript:alert("Downloading HTML report...")',
      pdfUrl: 'javascript:alert("Downloading PDF report...")',
    },
  },
  '99887766': {
    dossier: {
      generatedAt: '2023-10-27T10:05:00Z',
      company: {
        companyNumber: '99887766',
        name: 'DODGY BROTHERS ENTERPRISES LTD',
        status: 'active',
        type: 'ltd',
        incorporationDate: '2018-11-02',
        registeredOffice: {
          line1: 'Unit 4, Dark Lane',
          town: 'Birmingham',
          postcode: 'B2 4QA',
          country: 'United Kingdom',
        },
        sicCodes: ['41100 - Development of building projects'],
      },
      officers: [
        {
          name: 'DODGY, Del',
          role: 'Director',
          appointedOn: '2018-11-02',
          nationality: 'British',
          birthYear: 1975,
          birthMonth: 8,
        },
        {
          name: 'TROTTER, Rodney',
          role: 'Director',
          appointedOn: '2019-03-15',
          resignedOn: '2021-06-30',
          nationality: 'British',
          birthYear: 1982,
          birthMonth: 2,
        },
      ],
      pscs: [
        {
          name: 'DODGY, Del',
          natureOfControl: ['Ownership of shares – 25% to 50%'],
          notifiedOn: '2018-11-02',
          nationality: 'British',
        },
      ],
      riskFlags: [
        {
          id: 'F1',
          title: 'Director Disqualification',
          severity: FlagSeverity.HIGH,
          explanation: 'A current director has a matching name and birth details with a disqualified director record.',
          evidenceUrl: 'https://example.com/disqualification-register',
        },
        {
          id: 'F2',
          title: 'Late Accounts',
          severity: FlagSeverity.MEDIUM,
          explanation: 'Accounts are overdue by 3 months.',
        },
        {
          id: 'F3',
          title: 'Virtual Office Address',
          severity: FlagSeverity.LOW,
          explanation: 'Registered office appears to be a mail forwarding service.',
        },
      ],
    },
    report: {
      htmlUrl: 'javascript:alert("Downloading HTML report...")',
      pdfUrl: 'javascript:alert("Downloading PDF report...")',
    },
  },
};

// --- API Functions ---

export const searchCompanies = async (query: string): Promise<SearchResponse> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate latency
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return { query, results: [] };

    const results = MOCK_SEARCH_RESULTS.filter(
      (r) =>
        r.name.toLowerCase().includes(cleanQuery) ||
        r.companyNumber.includes(cleanQuery)
    );
    return { query, results };
  }

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
};

export const getCompanyDossier = async (companyNumber: string): Promise<DossierResponse> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate latency
    const data = MOCK_DOSSIERS[companyNumber];
    if (!data) {
       // Return a generic mock if ID not found in specific list, for better UX testing
       return {
         dossier: {
            ...MOCK_DOSSIERS['01234567'].dossier,
            company: {
                ...MOCK_DOSSIERS['01234567'].dossier.company,
                companyNumber,
                name: `MOCK COMPANY ${companyNumber}`,
            }
         },
         report: { 
            htmlUrl: 'javascript:void(0)', 
            pdfUrl: 'javascript:void(0)' 
         }
       }
    }
    return data;
  }

  const response = await fetch(`/api/company/${companyNumber}`);
  if (!response.ok) throw new Error('Failed to fetch dossier');
  return response.json();
};