/**
 * Type validation tests
 * Tests that TypeScript types are correctly defined and work as expected
 */

import type {
  Patient,
  Doctor,
  Visit,
  VisitStatus,
  VisitType,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  Service,
  Package,
  Expense,
  ExpenseCategory,
  Attachment,
  AttachmentEntityType,
  User,
  Settings,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
} from '../../src/types';

describe('Type Definitions', () => {
  describe('Patient Type', () => {
    it('should accept valid patient data', () => {
      const patient: Patient = {
        patientID: 1,
        mrn: 'MRN-2024-0001',
        firstName: 'John',
        lastName: 'Doe',
        phone: '03001234567',
        whatsApp: '03001234567',
        email: 'john@example.com',
        dateOfBirth: '1990-01-15',
        sex: 'Male',
        address: '123 Main St',
        city: 'Karachi',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '03009876543',
        emergencyContactRelation: 'Spouse',
        notes: 'Regular patient',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(patient.patientID).toBe(1);
      expect(patient.firstName).toBe('John');
      expect(patient.sex).toBe('Male');
    });

    it('should allow nullable fields', () => {
      const patient: Patient = {
        patientID: 1,
        mrn: 'MRN-2024-0001',
        firstName: 'John',
        lastName: null,
        phone: '03001234567',
        whatsApp: null,
        email: null,
        dateOfBirth: null,
        sex: null,
        address: null,
        city: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        notes: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(patient.lastName).toBeNull();
      expect(patient.email).toBeNull();
    });

    it('should accept all valid sex values', () => {
      const sexValues: Array<'Male' | 'Female' | 'Other' | null> = ['Male', 'Female', 'Other', null];

      sexValues.forEach((sex) => {
        const patient: Partial<Patient> = { sex };
        expect(['Male', 'Female', 'Other', null]).toContain(patient.sex);
      });
    });
  });

  describe('Doctor Type', () => {
    it('should accept valid doctor data', () => {
      const doctor: Doctor = {
        doctorID: 1,
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        education: 'DPT, PhD',
        designation: 'Senior Physiotherapist',
        specialization: 'Sports Medicine',
        sessionCharge: 2000,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        startTime: '09:00',
        endTime: '17:00',
        phone: '03001234567',
        email: 'sarah@clinic.com',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(doctor.doctorID).toBe(1);
      expect(doctor.availableDays).toContain('Monday');
      expect(doctor.sessionCharge).toBe(2000);
    });
  });

  describe('Visit Type', () => {
    it('should accept all valid visit statuses', () => {
      const statuses: VisitStatus[] = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoShow'];

      statuses.forEach((status) => {
        const visit: Partial<Visit> = { status };
        expect(statuses).toContain(visit.status);
      });
    });

    it('should accept all valid visit types', () => {
      const types: VisitType[] = ['Evaluation', 'FollowUp', 'TherapySession'];

      types.forEach((visitType) => {
        const visit: Partial<Visit> = { visitType };
        expect(types).toContain(visit.visitType);
      });
    });

    it('should accept valid visit with joined fields', () => {
      const visit: Visit = {
        visitID: 1,
        patientID: 1,
        doctorID: 1,
        visitDate: '2024-01-15',
        startTime: '10:00',
        endTime: '10:45',
        duration: 45,
        status: 'Completed',
        visitType: 'TherapySession',
        sessionIndex: 3,
        notes: 'Good progress',
        patientPackageID: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:45:00Z',
        patientName: 'John Doe',
        patientPhone: '03001234567',
        doctorName: 'Dr. Sarah Smith',
      };

      expect(visit.duration).toBe(45);
      expect(visit.patientName).toBe('John Doe');
    });
  });

  describe('Invoice Type', () => {
    it('should accept all valid invoice statuses', () => {
      const statuses: InvoiceStatus[] = ['Unpaid', 'PartiallyPaid', 'Paid', 'Void'];

      statuses.forEach((status) => {
        const invoice: Partial<Invoice> = { status };
        expect(statuses).toContain(invoice.status);
      });
    });

    it('should calculate totals correctly', () => {
      const invoice: Invoice = {
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        patientID: 1,
        doctorID: 1,
        visitID: 1,
        invoiceDate: '2024-01-15',
        subtotal: 2000,
        discountAmount: 200,
        taxAmount: 0,
        total: 1800,
        status: 'Unpaid',
        nextVisitDate: '2024-01-22',
        nextVisitTime: '10:00',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      expect(invoice.subtotal - invoice.discountAmount + invoice.taxAmount).toBe(invoice.total);
    });
  });

  describe('Payment Type', () => {
    it('should accept all valid payment methods', () => {
      const methods: PaymentMethod[] = ['Cash', 'Card', 'BankTransfer'];

      methods.forEach((method) => {
        const payment: Partial<Payment> = { method };
        expect(methods).toContain(payment.method);
      });
    });
  });

  describe('Expense Type', () => {
    it('should accept all valid expense categories', () => {
      const categories: ExpenseCategory[] = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Equipment', 'Other'];

      categories.forEach((category) => {
        const expense: Partial<Expense> = { category };
        expect(categories).toContain(expense.category);
      });
    });
  });

  describe('Attachment Type', () => {
    it('should accept all valid entity types', () => {
      const entityTypes: AttachmentEntityType[] = ['Patient', 'Visit'];

      entityTypes.forEach((entityType) => {
        const attachment: Partial<Attachment> = { entityType };
        expect(entityTypes).toContain(attachment.entityType);
      });
    });
  });

  describe('API Response Types', () => {
    it('should handle successful response', () => {
      const response: ApiResponse<Patient[]> = {
        success: true,
        data: [],
      };

      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });

    it('should handle error response', () => {
      const response: ApiResponse = {
        success: false,
        error: 'Database connection failed',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Database connection failed');
    });

    it('should handle paginated response', () => {
      const response: PaginatedResponse<Patient> = {
        items: [],
        total: 100,
        page: 1,
        pageSize: 10,
      };

      expect(response.total).toBe(100);
      expect(response.page).toBe(1);
    });
  });

  describe('Dashboard Stats Type', () => {
    it('should contain all required fields', () => {
      const stats: DashboardStats = {
        todayVisits: 10,
        scheduledVisits: 5,
        completedVisits: 5,
        monthRevenue: 50000,
        outstandingBalance: 10000,
        todaySchedule: [],
      };

      expect(stats.todayVisits).toBe(10);
      expect(stats.monthRevenue).toBe(50000);
      expect(Array.isArray(stats.todaySchedule)).toBe(true);
    });
  });

  describe('Service Type', () => {
    it('should accept valid service data', () => {
      const service: Service = {
        serviceID: 1,
        code: 'PT-SESSION',
        name: 'Physiotherapy Session',
        defaultPrice: 1000,
        category: 'Therapy',
        isActive: true,
      };

      expect(service.code).toBe('PT-SESSION');
      expect(service.defaultPrice).toBe(1000);
    });
  });

  describe('Package Type', () => {
    it('should accept valid package data', () => {
      const pkg: Package = {
        packageID: 1,
        name: '10 Session Package',
        totalSessions: 10,
        price: 8000,
        validityDays: 30,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(pkg.totalSessions).toBe(10);
      expect(pkg.price / pkg.totalSessions).toBe(800); // Per session cost
    });
  });

  describe('User Type', () => {
    it('should accept valid user roles', () => {
      const admin: User = {
        userID: 1,
        username: 'admin',
        role: 'Admin',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const user: User = {
        userID: 2,
        username: 'staff',
        role: 'User',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(admin.role).toBe('Admin');
      expect(user.role).toBe('User');
    });
  });

  describe('Settings Type', () => {
    it('should have correct default values concept', () => {
      const settings: Settings = {
        settingsID: 1,
        clinicName: 'My Clinic',
        logoPath: null,
        address: null,
        phone: null,
        whatsApp: null,
        email: null,
        website: null,
        invoicePrefix: 'INV',
        currency: 'Rs',
        taxPercent: 0,
        defaultVisitDuration: 45,
        exportPath: null,
        dataPath: '/data/clinic',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(settings.defaultVisitDuration).toBe(45);
      expect(settings.currency).toBe('Rs');
    });
  });
});
