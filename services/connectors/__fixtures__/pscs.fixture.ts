import type { PSCsResponse } from '../companies-house.types';

export const pscsFixture: PSCsResponse = {
  active_count: 2,
  ceased_count: 1,
  etag: 'pscs-etag-abc',
  items: [
    {
      address: {
        address_line_1: '123 Owner Street',
        locality: 'London',
        postal_code: 'SW1A 1AA',
        country: 'United Kingdom',
      },
      country_of_residence: 'England',
      date_of_birth: {
        month: 6,
        year: 1985,
      },
      etag: 'psc1-etag',
      kind: 'individual-person-with-significant-control',
      links: {
        self: '/company/12345678/persons-with-significant-control/individual/psc1',
      },
      name: 'Mr John David Smith',
      name_elements: {
        forename: 'John',
        middle_name: 'David',
        surname: 'Smith',
        title: 'Mr',
      },
      nationality: 'British',
      natures_of_control: [
        'ownership-of-shares-75-to-100-percent',
        'voting-rights-75-to-100-percent',
        'right-to-appoint-and-remove-directors',
      ],
      notified_on: '2020-01-15',
    },
    {
      address: {
        address_line_1: '456 Investor Lane',
        locality: 'Manchester',
        postal_code: 'M1 2AB',
        country: 'United Kingdom',
      },
      country_of_residence: 'England',
      date_of_birth: {
        month: 3,
        year: 1970,
      },
      etag: 'psc2-etag',
      kind: 'individual-person-with-significant-control',
      links: {
        self: '/company/12345678/persons-with-significant-control/individual/psc2',
      },
      name: 'Ms Jane Doe',
      name_elements: {
        forename: 'Jane',
        surname: 'Doe',
        title: 'Ms',
      },
      nationality: 'British',
      natures_of_control: ['ownership-of-shares-25-to-50-percent'],
      notified_on: '2021-06-20',
    },
    {
      address: {
        address_line_1: '789 Former Ave',
        locality: 'Birmingham',
        postal_code: 'B1 1CD',
        country: 'United Kingdom',
      },
      ceased_on: '2022-12-31',
      country_of_residence: 'England',
      date_of_birth: {
        month: 9,
        year: 1960,
      },
      etag: 'psc3-etag',
      kind: 'individual-person-with-significant-control',
      links: {
        self: '/company/12345678/persons-with-significant-control/individual/psc3',
      },
      name: 'Mr Robert Former',
      name_elements: {
        forename: 'Robert',
        surname: 'Former',
        title: 'Mr',
      },
      nationality: 'British',
      natures_of_control: ['ownership-of-shares-25-to-50-percent'],
      notified_on: '2020-01-15',
    },
  ],
  items_per_page: 25,
  kind: 'persons-with-significant-control#list',
  links: {
    persons_with_significant_control_statements:
      '/company/12345678/persons-with-significant-control-statements',
    self: '/company/12345678/persons-with-significant-control',
  },
  start_index: 0,
  total_results: 3,
};

export const corporatePscFixture: PSCsResponse = {
  active_count: 1,
  ceased_count: 0,
  items: [
    {
      address: {
        address_line_1: '1 Holding Company Plaza',
        locality: 'London',
        postal_code: 'EC1A 1AA',
        country: 'United Kingdom',
      },
      etag: 'corp-psc-etag',
      identification: {
        country_registered: 'England',
        legal_authority: 'Companies Act 2006',
        legal_form: 'Private Limited Company',
        place_registered: 'Companies House',
        registration_number: '11112222',
      },
      kind: 'corporate-entity-person-with-significant-control',
      links: {
        self: '/company/12345678/persons-with-significant-control/corporate-entity/corpsc1',
      },
      name: 'PARENT HOLDINGS LTD',
      natures_of_control: [
        'ownership-of-shares-75-to-100-percent',
        'voting-rights-75-to-100-percent',
      ],
      notified_on: '2019-04-01',
    },
  ],
  items_per_page: 25,
  kind: 'persons-with-significant-control#list',
  links: {
    self: '/company/12345678/persons-with-significant-control',
  },
  start_index: 0,
  total_results: 1,
};

export const emptyPscsFixture: PSCsResponse = {
  active_count: 0,
  ceased_count: 0,
  etag: 'empty-psc-etag',
  items: [],
  items_per_page: 25,
  kind: 'persons-with-significant-control#list',
  links: {
    persons_with_significant_control_statements:
      '/company/00000001/persons-with-significant-control-statements',
    self: '/company/00000001/persons-with-significant-control',
  },
  start_index: 0,
  total_results: 0,
};
