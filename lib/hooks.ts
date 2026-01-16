import { useQuery } from '@tanstack/react-query';
import { searchCompanies, getCompanyDossier } from './apiClient';

export const COMPANY_NUMBER_REGEX = /^[A-Z0-9]{6,8}$/;

export function useSearchCompanies(query: string) {
  const cleanQuery = query.trim();
  const isId = COMPANY_NUMBER_REGEX.test(cleanQuery.toUpperCase());
  
  return useQuery({
    queryKey: ['search', cleanQuery],
    queryFn: () => searchCompanies(cleanQuery),
    enabled: cleanQuery.length >= 2 && !isId,
  });
}

export function useCompanyDossier(id: string | undefined) {
  return useQuery({
    queryKey: ['dossier', id],
    queryFn: () => getCompanyDossier(id || ''),
    enabled: !!id,
    retry: 1,
  });
}