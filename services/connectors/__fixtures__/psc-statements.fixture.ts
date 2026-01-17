import type { PSCStatementsResponse } from '../companies-house.types';

export const pscStatementsFixture: PSCStatementsResponse = {
  active_count: 1,
  ceased_count: 1,
  etag: 'psc-statements-etag',
  items: [
    {
      etag: 'statement1-etag',
      kind: 'persons-with-significant-control-statement#statement',
      links: {
        self: '/company/12345678/persons-with-significant-control-statements/statement1',
      },
      notified_on: '2020-01-15',
      statement: 'no-individual-or-entity-with-significant-control',
    },
    {
      ceased_on: '2021-06-20',
      etag: 'statement2-etag',
      kind: 'persons-with-significant-control-statement#statement',
      linked_psc_name: 'Mr John David Smith',
      links: {
        person_with_significant_control:
          '/company/12345678/persons-with-significant-control/individual/psc1',
        self: '/company/12345678/persons-with-significant-control-statements/statement2',
      },
      notified_on: '2020-01-15',
      restrictions_notice_withdrawal_reason: 'restrictions-notice-withdrawn-by-company',
      statement: 'restrictions-notice-issued-to-psc',
    },
  ],
  items_per_page: 25,
  kind: 'persons-with-significant-control-statement#list',
  links: {
    persons_with_significant_control: '/company/12345678/persons-with-significant-control',
    self: '/company/12345678/persons-with-significant-control-statements',
  },
  start_index: 0,
  total_results: 2,
};

export const emptyPscStatementsFixture: PSCStatementsResponse = {
  active_count: 0,
  ceased_count: 0,
  etag: 'empty-statements-etag',
  items: [],
  items_per_page: 25,
  kind: 'persons-with-significant-control-statement#list',
  links: {
    persons_with_significant_control: '/company/00000001/persons-with-significant-control',
    self: '/company/00000001/persons-with-significant-control-statements',
  },
  start_index: 0,
  total_results: 0,
};

export const statementsOnlyFixture: PSCStatementsResponse = {
  active_count: 2,
  ceased_count: 0,
  items: [
    {
      etag: 'steps-statement-etag',
      kind: 'persons-with-significant-control-statement#statement',
      links: {
        self: '/company/12345678/persons-with-significant-control-statements/steps1',
      },
      notified_on: '2023-01-01',
      statement: 'steps-to-find-psc-not-yet-completed',
    },
    {
      etag: 'psc-exists-statement-etag',
      kind: 'persons-with-significant-control-statement#statement',
      links: {
        self: '/company/12345678/persons-with-significant-control-statements/exists1',
      },
      notified_on: '2023-03-15',
      statement: 'psc-exists-but-not-identified',
    },
  ],
  items_per_page: 25,
  kind: 'persons-with-significant-control-statement#list',
  links: {
    persons_with_significant_control: '/company/12345678/persons-with-significant-control',
    self: '/company/12345678/persons-with-significant-control-statements',
  },
  start_index: 0,
  total_results: 2,
};
