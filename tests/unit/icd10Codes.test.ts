/**
 * Unit tests for ICD-10 codes utility
 */

import {
  icd10Codes,
  searchICD10Codes,
  getICD10Categories,
  getCodesByCategory,
} from '../../src/data/icd10-codes';

describe('ICD-10 Codes utility', () => {
  describe('icd10Codes data', () => {
    it('has codes loaded', () => {
      expect(icd10Codes.length).toBeGreaterThan(0);
    });

    it('has expected code structure', () => {
      const code = icd10Codes[0];
      expect(code).toHaveProperty('code');
      expect(code).toHaveProperty('description');
      expect(code).toHaveProperty('category');
    });

    it('contains common PT-related codes', () => {
      const lowBackPain = icd10Codes.find((c) => c.code === 'M54.5');
      expect(lowBackPain).toBeDefined();
      expect(lowBackPain?.description).toContain('Low back pain');
    });

    it('contains cervicalgia code', () => {
      const cervicalgia = icd10Codes.find((c) => c.code === 'M54.2');
      expect(cervicalgia).toBeDefined();
      expect(cervicalgia?.description).toContain('Cervicalgia');
    });
  });

  describe('searchICD10Codes', () => {
    it('returns empty array for empty query', () => {
      expect(searchICD10Codes('')).toEqual([]);
    });

    it('returns empty array for single character query', () => {
      expect(searchICD10Codes('a')).toEqual([]);
    });

    it('searches by code', () => {
      const results = searchICD10Codes('M54.5');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.code === 'M54.5')).toBe(true);
    });

    it('searches by partial code', () => {
      const results = searchICD10Codes('M54');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.code.includes('M54'))).toBe(true);
    });

    it('searches by description', () => {
      const results = searchICD10Codes('low back');
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((r) => r.description.toLowerCase().includes('low back'))
      ).toBe(true);
    });

    it('searches by category', () => {
      const results = searchICD10Codes('shoulder');
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(
          (r) =>
            r.category.toLowerCase().includes('shoulder') ||
            r.description.toLowerCase().includes('shoulder')
        )
      ).toBe(true);
    });

    it('is case insensitive', () => {
      const lowerResults = searchICD10Codes('knee');
      const upperResults = searchICD10Codes('KNEE');
      const mixedResults = searchICD10Codes('Knee');

      expect(lowerResults.length).toEqual(upperResults.length);
      expect(lowerResults.length).toEqual(mixedResults.length);
    });

    it('limits results to 20', () => {
      // Search for something with many matches
      const results = searchICD10Codes('pain');
      expect(results.length).toBeLessThanOrEqual(20);
    });

    it('trims whitespace from query', () => {
      const results1 = searchICD10Codes('  knee  ');
      const results2 = searchICD10Codes('knee');
      expect(results1.length).toEqual(results2.length);
    });

    it('finds frozen shoulder', () => {
      const results = searchICD10Codes('frozen shoulder');
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((r) =>
          r.description.toLowerCase().includes('frozen shoulder') ||
          r.description.toLowerCase().includes('adhesive capsulitis')
        )
      ).toBe(true);
    });

    it('finds tennis elbow', () => {
      const results = searchICD10Codes('tennis elbow');
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((r) =>
          r.description.toLowerCase().includes('tennis elbow') ||
          r.description.toLowerCase().includes('lateral epicondylitis')
        )
      ).toBe(true);
    });
  });

  describe('getICD10Categories', () => {
    it('returns array of unique categories', () => {
      const categories = getICD10Categories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('includes common categories', () => {
      const categories = getICD10Categories();
      expect(categories).toContain('Spine');
      expect(categories).toContain('Shoulder');
      expect(categories).toContain('Knee');
    });

    it('returns sorted categories', () => {
      const categories = getICD10Categories();
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it('has no duplicates', () => {
      const categories = getICD10Categories();
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toEqual(uniqueCategories.length);
    });
  });

  describe('getCodesByCategory', () => {
    it('returns codes for Spine category', () => {
      const spineCodes = getCodesByCategory('Spine');
      expect(spineCodes.length).toBeGreaterThan(0);
      expect(spineCodes.every((c) => c.category === 'Spine')).toBe(true);
    });

    it('returns codes for Knee category', () => {
      const kneeCodes = getCodesByCategory('Knee');
      expect(kneeCodes.length).toBeGreaterThan(0);
      expect(kneeCodes.every((c) => c.category === 'Knee')).toBe(true);
    });

    it('returns empty array for non-existent category', () => {
      const codes = getCodesByCategory('NonExistent');
      expect(codes).toEqual([]);
    });

    it('returns all Shoulder codes', () => {
      const shoulderCodes = getCodesByCategory('Shoulder');
      expect(shoulderCodes.length).toBeGreaterThan(0);
      // Check that some shoulder-specific codes are included
      expect(
        shoulderCodes.some((c) => c.description.includes('shoulder'))
      ).toBe(true);
    });
  });
});
