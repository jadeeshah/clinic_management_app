import { useState, useCallback, useRef, useEffect } from 'react';
import type { Patient } from '../../types';

export interface PatientWithPackage extends Patient {
  // Active package info (if any)
  packageName?: string;
  sessionsUsed?: number;
  totalSessions?: number;
  expiryDate?: string;
}

export interface UsePatientSearchOptions {
  /** Minimum characters required to trigger search (default: 2) */
  minLength?: number;
  /** Maximum results to return (default: 10) */
  limit?: number;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Include package info in results (default: false) */
  includePackageInfo?: boolean;
}

export interface UsePatientSearchReturn {
  /** Search results */
  patients: PatientWithPackage[];
  /** Whether search is currently in progress */
  isSearching: boolean;
  /** Trigger a search */
  searchPatients: (query: string) => void;
  /** Clear search results */
  clearPatients: () => void;
  /** Current search query */
  searchQuery: string;
  /** Set search query (will auto-trigger search with debounce) */
  setSearchQuery: (query: string) => void;
}

/**
 * Custom hook for patient search functionality
 * Provides debounced search with loading state management
 */
export const usePatientSearch = (options: UsePatientSearchOptions = {}): UsePatientSearchReturn => {
  const {
    minLength = 2,
    limit = 10,
    debounceMs = 300,
    includePackageInfo = false,
  } = options;

  const [patients, setPatients] = useState<PatientWithPackage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchPatients = useCallback(async (query: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if query is too short
    if (query.length < minLength) {
      setPatients([]);
      setIsSearching(false);
      return;
    }

    // Debounce the search
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const operation = includePackageInfo ? 'search-patients-with-packages' : 'search-patients';
        const result = await window.electronAPI.database.execute<PatientWithPackage[]>(
          operation,
          { query, limit }
        );

        if (result.success && result.data) {
          setPatients(result.data);
        } else {
          setPatients([]);
        }
      } catch (error) {
        console.error('Patient search failed:', error);
        setPatients([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [minLength, limit, debounceMs, includePackageInfo]);

  const clearPatients = useCallback(() => {
    setPatients([]);
    setSearchQuery('');
  }, []);

  // Auto-search when searchQuery changes
  useEffect(() => {
    searchPatients(searchQuery);
  }, [searchQuery, searchPatients]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    patients,
    isSearching,
    searchPatients,
    clearPatients,
    searchQuery,
    setSearchQuery,
  };
};

export default usePatientSearch;
