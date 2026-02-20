/**
 * Unit tests for patient export utility
 */

import {
  exportPatientToCSV,
  exportPatientListToCSV,
} from '../../src/renderer/utils/patientExport';
import {
  createMockPatient,
  createMockVisit,
  createMockInvoice,
  createMockPatientPackage,
} from '../utils/testUtils';

describe('patientExport utility', () => {
  describe('exportPatientToCSV', () => {
    it('exports patient basic info', () => {
      const data = {
        patient: createMockPatient({
          firstName: 'Ali',
          lastName: 'Hassan',
          phone: '03001234567',
          city: 'Lahore',
        }),
        visits: [],
        invoices: [],
        packages: [],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('Ali');
      expect(csv).toContain('Hassan');
      expect(csv).toContain('03001234567');
      expect(csv).toContain('Lahore');
    });

    it('includes visits section', () => {
      const data = {
        patient: createMockPatient(),
        visits: [
          createMockVisit({
            visitDate: '2024-01-15',
            startTime: '10:00',
            status: 'Completed',
            visitType: 'TherapySession',
          }),
        ],
        invoices: [],
        packages: [],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('VISIT HISTORY');
      expect(csv).toContain('Completed');
      expect(csv).toContain('Patient Name');
      expect(csv).toContain('Session #');
      expect(csv).toContain('Package');
    });

    it('includes invoices section', () => {
      const data = {
        patient: createMockPatient(),
        visits: [],
        invoices: [
          createMockInvoice({
            invoiceNo: 'INV-2024-0001',
            total: 2500,
            status: 'Paid',
          }),
        ],
        packages: [],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('INVOICE HISTORY');
      expect(csv).toContain('INV-2024-0001');
      expect(csv).toContain('2500');
      expect(csv).toContain('Paid');
    });

    it('includes packages section', () => {
      const data = {
        patient: createMockPatient(),
        visits: [],
        invoices: [],
        packages: [
          createMockPatientPackage({
            packageName: '10 Session Package',
            sessionsUsed: 5,
            totalSessions: 10,
            status: 'Active',
          }),
        ],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('PACKAGES');
      expect(csv).toContain('10 Session Package');
      expect(csv).toContain('Active');
    });

    it('handles empty data gracefully', () => {
      const data = {
        patient: createMockPatient(),
        visits: [],
        invoices: [],
        packages: [],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('PATIENT INFORMATION');
      expect(csv).toBeDefined();
    });

    it('calculates visit totals correctly', () => {
      const data = {
        patient: createMockPatient(),
        visits: [
          createMockVisit({ status: 'Completed' }),
          createMockVisit({ status: 'Completed' }),
          createMockVisit({ status: 'Scheduled' }),
        ],
        invoices: [],
        packages: [],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('Total Visits,3');
      expect(csv).toContain('Completed,2');
    });

    it('calculates invoice totals correctly', () => {
      const data = {
        patient: createMockPatient(),
        visits: [],
        invoices: [
          createMockInvoice({ total: 1000, paidAmount: 500 }),
          createMockInvoice({ total: 2000, paidAmount: 2000 }),
        ],
        packages: [],
      };

      const csv = exportPatientToCSV(data);

      expect(csv).toContain('Total Invoiced,3000');
      expect(csv).toContain('Total Paid,2500');
      expect(csv).toContain('Outstanding,500');
    });
  });

  describe('exportPatientListToCSV', () => {
    it('exports list with headers', () => {
      const patients = [
        {
          patientID: 1,
          mrn: 'MRN-2024-0001',
          firstName: 'Ali',
          lastName: 'Hassan',
          phone: '03001234567',
          city: 'Lahore',
          totalVisits: 5,
          completedVisits: 3,
          totalPaid: 5000,
          createdAt: '2024-01-01',
        },
      ];

      const csv = exportPatientListToCSV(patients);

      expect(csv).toContain('MRN');
      expect(csv).toContain('Name');
      expect(csv).toContain('Phone');
      expect(csv).toContain('City');
      expect(csv).toContain('Total Visits');
      expect(csv).toContain('Completed Sessions');
      expect(csv).toContain('Total Paid');
    });

    it('exports multiple patients', () => {
      const patients = [
        {
          patientID: 1,
          mrn: 'MRN-2024-0001',
          firstName: 'Ali',
          lastName: 'Hassan',
          phone: '03001234567',
          city: 'Lahore',
          totalVisits: 5,
          completedVisits: 3,
          totalPaid: 5000,
          createdAt: '2024-01-01',
        },
        {
          patientID: 2,
          mrn: 'MRN-2024-0002',
          firstName: 'Fatima',
          lastName: 'Bibi',
          phone: '03007654321',
          city: 'Karachi',
          totalVisits: 10,
          completedVisits: 8,
          totalPaid: 12000,
          createdAt: '2024-01-02',
        },
      ];

      const csv = exportPatientListToCSV(patients);

      expect(csv).toContain('Ali');
      expect(csv).toContain('Hassan');
      expect(csv).toContain('Fatima');
      expect(csv).toContain('Bibi');
    });

    it('handles empty patient list', () => {
      const csv = exportPatientListToCSV([]);

      // Should still have headers
      expect(csv).toContain('MRN');
      expect(csv).toContain('Name');
    });

    it('escapes commas in data', () => {
      const patients = [
        {
          patientID: 1,
          mrn: 'MRN-2024-0001',
          firstName: 'Ali, Jr',
          lastName: 'Hassan',
          phone: '03001234567',
          city: 'Lahore',
          totalVisits: 5,
          completedVisits: 3,
          totalPaid: 5000,
          createdAt: '2024-01-01',
        },
      ];

      const csv = exportPatientListToCSV(patients);

      // Name with comma should be quoted (combined with lastName)
      expect(csv).toContain('"Ali, Jr Hassan"');
    });

    it('handles null lastName', () => {
      const patients = [
        {
          patientID: 1,
          mrn: 'MRN-2024-0001',
          firstName: 'Ali',
          lastName: null as unknown as string,
          phone: '03001234567',
          city: 'Karachi',
          totalVisits: 0,
          completedVisits: 0,
          totalPaid: 0,
          createdAt: '2024-01-01',
        },
      ];

      const csv = exportPatientListToCSV(patients);

      // Should not throw and should contain patient data
      expect(csv).toContain('Ali');
    });

    it('includes all patient data fields', () => {
      const patients = [
        {
          patientID: 1,
          mrn: 'MRN-2024-0001',
          firstName: 'Test',
          lastName: 'Patient',
          phone: '03001234567',
          city: 'TestCity',
          totalVisits: 15,
          completedVisits: 12,
          totalPaid: 25000,
          createdAt: '2024-01-15',
        },
      ];

      const csv = exportPatientListToCSV(patients);

      expect(csv).toContain('MRN-2024-0001');
      expect(csv).toContain('Test Patient');
      expect(csv).toContain('03001234567');
      expect(csv).toContain('TestCity');
      expect(csv).toContain('15');
      expect(csv).toContain('12');
      expect(csv).toContain('25000');
    });
  });
});
