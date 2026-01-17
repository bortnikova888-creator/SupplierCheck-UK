import type { OfficersResponse } from '../companies-house.types';

export const officersFixture: OfficersResponse = {
  active_count: 2,
  etag: 'officers-etag-789',
  inactive_count: 0,
  items: [
    {
      address: {
        address_line_1: '123 Director Lane',
        locality: 'London',
        postal_code: 'SW1A 1AA',
        premises: 'Suite 100',
        country: 'United Kingdom',
      },
      appointed_on: '2020-01-15',
      country_of_residence: 'England',
      date_of_birth: {
        month: 6,
        year: 1985,
      },
      links: {
        officer: {
          appointments: '/officers/abc123def456/appointments',
        },
        self: '/company/12345678/appointments/abc123def456',
      },
      name: 'SMITH, John David',
      nationality: 'British',
      occupation: 'Company Director',
      officer_role: 'director',
    },
    {
      address: {
        address_line_1: '456 Finance Road',
        locality: 'Manchester',
        postal_code: 'M1 2CD',
        country: 'United Kingdom',
      },
      appointed_on: '2020-02-01',
      country_of_residence: 'England',
      date_of_birth: {
        month: 11,
        year: 1978,
      },
      links: {
        officer: {
          appointments: '/officers/xyz789ghi012/appointments',
        },
        self: '/company/12345678/appointments/xyz789ghi012',
      },
      name: 'JONES, Sarah Elizabeth',
      nationality: 'British',
      occupation: 'Finance Director',
      officer_role: 'director',
    },
    {
      address: {
        address_line_1: '789 Secretary Street',
        locality: 'Birmingham',
        postal_code: 'B1 1AA',
        country: 'United Kingdom',
      },
      appointed_on: '2020-01-15',
      resigned_on: '2023-06-30',
      links: {
        officer: {
          appointments: '/officers/former123/appointments',
        },
        self: '/company/12345678/appointments/former123',
      },
      name: 'BROWN, Michael',
      nationality: 'British',
      officer_role: 'secretary',
      former_names: [
        {
          forenames: 'Mike',
          surname: 'BROWN',
        },
      ],
    },
  ],
  items_per_page: 35,
  kind: 'officer-list',
  links: {
    self: '/company/12345678/officers',
  },
  resigned_count: 1,
  start_index: 0,
  total_results: 3,
};

export const emptyOfficersFixture: OfficersResponse = {
  active_count: 0,
  etag: 'empty-officers-etag',
  inactive_count: 0,
  items: [],
  items_per_page: 35,
  kind: 'officer-list',
  links: {
    self: '/company/00000001/officers',
  },
  resigned_count: 0,
  start_index: 0,
  total_results: 0,
};

export const corporateOfficerFixture: OfficersResponse = {
  active_count: 1,
  items: [
    {
      address: {
        address_line_1: '1 Corporate Plaza',
        locality: 'London',
        postal_code: 'EC2A 2BB',
        country: 'United Kingdom',
      },
      appointed_on: '2021-03-15',
      identification: {
        identification_type: 'uk-limited-company',
        legal_authority: 'Companies Act 2006',
        legal_form: 'Limited Company',
        place_registered: 'England and Wales',
        registration_number: '98765432',
      },
      links: {
        officer: {
          appointments: '/officers/corp456/appointments',
        },
        self: '/company/12345678/appointments/corp456',
      },
      name: 'CORPORATE SECRETARY LTD',
      officer_role: 'corporate-secretary',
    },
  ],
  items_per_page: 35,
  kind: 'officer-list',
  links: {
    self: '/company/12345678/officers',
  },
  start_index: 0,
  total_results: 1,
};
