import type { CompanySearchResponse } from '../companies-house.types';

export const searchFixture: CompanySearchResponse = {
  etag: 'abc123def456',
  items: [
    {
      company_number: '00000006',
      company_status: 'active',
      company_type: 'ltd',
      title: 'MARINE AND GENERAL MUTUAL LIFE ASSURANCE SOCIETY',
      address_snippet: 'Cms Cameron Mckenna Llp, Cannon Place, 78 Cannon Street, London, EC4N 6AF',
      address: {
        address_line_1: 'Cms Cameron Mckenna Llp',
        address_line_2: '78 Cannon Street',
        locality: 'London',
        postal_code: 'EC4N 6AF',
        premises: 'Cannon Place',
      },
      date_of_creation: '1852-07-01',
      kind: 'searchresults#company',
      links: {
        self: '/company/00000006',
      },
    },
    {
      company_number: '10203040',
      company_status: 'active',
      company_type: 'private-limited-guarant-nsc',
      title: 'MARINE ENTERPRISES LTD',
      address_snippet: '123 Ocean Drive, Southampton, SO14 2AB',
      address: {
        address_line_1: '123 Ocean Drive',
        locality: 'Southampton',
        postal_code: 'SO14 2AB',
      },
      date_of_creation: '2016-05-15',
      kind: 'searchresults#company',
      links: {
        self: '/company/10203040',
      },
    },
    {
      company_number: 'SC123456',
      company_status: 'dissolved',
      company_type: 'ltd',
      title: 'MARINE SCOTLAND TRADING LTD',
      address_snippet: '456 High Street, Edinburgh, EH1 1AA',
      address: {
        address_line_1: '456 High Street',
        locality: 'Edinburgh',
        postal_code: 'EH1 1AA',
      },
      date_of_creation: '2010-03-22',
      date_of_cessation: '2022-11-30',
      kind: 'searchresults#company',
      links: {
        self: '/company/SC123456',
      },
    },
  ],
  items_per_page: 20,
  kind: 'search#companies',
  start_index: 0,
  total_results: 3,
};

export const emptySearchFixture: CompanySearchResponse = {
  etag: 'xyz789',
  items: [],
  items_per_page: 20,
  kind: 'search#companies',
  start_index: 0,
  total_results: 0,
};
