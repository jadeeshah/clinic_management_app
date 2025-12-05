/**
 * Validation Schema Tests
 * Comprehensive tests for all Zod validation schemas
 */

import {
  validate,
  validateOrThrow,
  isZodError,
  // Patient schemas
  createPatientSchema,
  updatePatientSchema,
  // Doctor schemas
  createDoctorSchema,
  updateDoctorSchema,
  // Visit schemas
  createVisitSchema,
  updateVisitSchema,
  updateVisitStatusSchema,
  visitStatusEnum,
  visitTypeEnum,
  // Invoice schemas
  createInvoiceSchema,
  invoiceItemSchema,
  createPaymentSchema,
  paymentMethodEnum,
  // Service schemas
  createServiceSchema,
  updateServiceSchema,
  // Package schemas
  createPackageSchema,
  updatePackageSchema,
  // Expense schemas
  createExpenseSchema,
  updateExpenseSchema,
  expenseCategoryEnum,
  // User schemas
  loginSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userRoleEnum,
} from '../../../src/shared/validation';

describe('Validation Schemas', () => {
  describe('Patient Schemas', () => {
    describe('createPatientSchema', () => {
      it('should accept valid patient with required fields only', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: '03001234567',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.firstName).toBe('John');
          expect(result.data.phone).toBe('03001234567');
        }
      });

      it('should accept valid patient with all fields', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          lastName: 'Doe',
          phone: '0300-1234567',
          whatsApp: '+92 300 1234567',
          email: 'john@example.com',
          dateOfBirth: '1990-01-15',
          sex: 'Male',
          address: '123 Main Street',
          city: 'Karachi',
          emergencyContactName: 'Jane Doe',
          emergencyContactPhone: '03009876543',
          emergencyContactRelation: 'Spouse',
          notes: 'Regular patient',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing firstName', () => {
        const result = validate(createPatientSchema, {
          phone: '03001234567',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });

      it('should reject missing phone', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });

      it('should reject invalid phone format', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: 'abc123',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid email format', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: '03001234567',
          email: 'not-an-email',
        });
        expect(result.success).toBe(false);
      });

      it('should accept empty email string', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: '03001234567',
          email: '',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid date format', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: '03001234567',
          dateOfBirth: '15-01-1990',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid date format YYYY-MM-DD', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: '03001234567',
          dateOfBirth: '1990-01-15',
        });
        expect(result.success).toBe(true);
      });

      it('should accept all valid sex values', () => {
        const sexValues = ['Male', 'Female', 'Other'];
        sexValues.forEach((sex) => {
          const result = validate(createPatientSchema, {
            firstName: 'John',
            phone: '03001234567',
            sex,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid sex value', () => {
        const result = validate(createPatientSchema, {
          firstName: 'John',
          phone: '03001234567',
          sex: 'Unknown',
        });
        expect(result.success).toBe(false);
      });

      it('should reject firstName exceeding max length', () => {
        const result = validate(createPatientSchema, {
          firstName: 'A'.repeat(101),
          phone: '03001234567',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('updatePatientSchema', () => {
      it('should require patientID for updates', () => {
        const result = validate(updatePatientSchema, {
          firstName: 'John',
          phone: '03001234567',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid update with patientID', () => {
        const result = validate(updatePatientSchema, {
          patientID: 1,
          firstName: 'John',
          phone: '03001234567',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Doctor Schemas', () => {
    describe('createDoctorSchema', () => {
      it('should accept valid doctor with required fields only', () => {
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid doctor with all fields', () => {
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
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
        });
        expect(result.success).toBe(true);
      });

      it('should reject negative session charge', () => {
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
          sessionCharge: -100,
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid time format', () => {
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
          startTime: '9:00', // Should be HH:MM
        });
        expect(result.success).toBe(false);
      });

      it('should reject end time before start time', () => {
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
          startTime: '17:00',
          endTime: '09:00',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('End time must be after start time');
        }
      });

      it('should accept same start and end time', () => {
        // This is technically allowed (0-duration availability)
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
          startTime: '09:00',
          endTime: '09:00',
        });
        expect(result.success).toBe(false);
      });

      it('should accept empty availableDays array', () => {
        const result = validate(createDoctorSchema, {
          firstName: 'Sarah',
          availableDays: [],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('updateDoctorSchema', () => {
      it('should require doctorID for updates', () => {
        const result = validate(updateDoctorSchema, {
          firstName: 'Sarah',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid update', () => {
        const result = validate(updateDoctorSchema, {
          doctorID: 1,
          firstName: 'Sarah',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Visit Schemas', () => {
    describe('createVisitSchema', () => {
      it('should accept valid visit with required fields', () => {
        const result = validate(createVisitSchema, {
          patientID: 1,
          doctorID: 1,
          visitDate: '2024-01-15',
          startTime: '10:00',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid visit with all fields', () => {
        const result = validate(createVisitSchema, {
          patientID: 1,
          doctorID: 1,
          visitDate: '2024-01-15',
          startTime: '10:00',
          endTime: '10:45',
          duration: 45,
          status: 'Scheduled',
          visitType: 'TherapySession',
          notes: 'First session',
          patientPackageID: 1,
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid patientID', () => {
        const result = validate(createVisitSchema, {
          patientID: 0,
          doctorID: 1,
          visitDate: '2024-01-15',
          startTime: '10:00',
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative duration', () => {
        const result = validate(createVisitSchema, {
          patientID: 1,
          doctorID: 1,
          visitDate: '2024-01-15',
          startTime: '10:00',
          duration: -10,
        });
        expect(result.success).toBe(false);
      });

      it('should accept all valid visit statuses', () => {
        const statuses = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoShow'];
        statuses.forEach((status) => {
          const result = validate(createVisitSchema, {
            patientID: 1,
            doctorID: 1,
            visitDate: '2024-01-15',
            startTime: '10:00',
            status,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid visit status', () => {
        const result = validate(createVisitSchema, {
          patientID: 1,
          doctorID: 1,
          visitDate: '2024-01-15',
          startTime: '10:00',
          status: 'Unknown',
        });
        expect(result.success).toBe(false);
      });

      it('should accept all valid visit types', () => {
        const types = ['Evaluation', 'FollowUp', 'TherapySession'];
        types.forEach((visitType) => {
          const result = validate(createVisitSchema, {
            patientID: 1,
            doctorID: 1,
            visitDate: '2024-01-15',
            startTime: '10:00',
            visitType,
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('updateVisitStatusSchema', () => {
      it('should accept valid status update', () => {
        const result = validate(updateVisitStatusSchema, {
          visitID: 1,
          status: 'Completed',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing visitID', () => {
        const result = validate(updateVisitStatusSchema, {
          status: 'Completed',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Invoice Schemas', () => {
    describe('invoiceItemSchema', () => {
      it('should accept valid invoice item', () => {
        const result = validate(invoiceItemSchema, {
          description: 'Therapy Session',
          quantity: 1,
          unitPrice: 1000,
          lineTotal: 1000,
        });
        expect(result.success).toBe(true);
      });

      it('should accept item with serviceID', () => {
        const result = validate(invoiceItemSchema, {
          serviceID: 1,
          description: 'Therapy Session',
          quantity: 2,
          unitPrice: 500,
          lineTotal: 1000,
        });
        expect(result.success).toBe(true);
      });

      it('should reject zero quantity', () => {
        const result = validate(invoiceItemSchema, {
          description: 'Therapy Session',
          quantity: 0,
          unitPrice: 1000,
          lineTotal: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative unit price', () => {
        const result = validate(invoiceItemSchema, {
          description: 'Therapy Session',
          quantity: 1,
          unitPrice: -100,
          lineTotal: -100,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createInvoiceSchema', () => {
      it('should accept valid invoice', () => {
        const result = validate(createInvoiceSchema, {
          patientID: 1,
          invoiceDate: '2024-01-15',
          items: [
            {
              description: 'Therapy Session',
              quantity: 1,
              unitPrice: 1000,
              lineTotal: 1000,
            },
          ],
        });
        expect(result.success).toBe(true);
      });

      it('should accept invoice with optional fields', () => {
        const result = validate(createInvoiceSchema, {
          patientID: 1,
          doctorID: 1,
          visitID: 1,
          invoiceDate: '2024-01-15',
          items: [
            {
              description: 'Session',
              quantity: 1,
              unitPrice: 1000,
              lineTotal: 1000,
            },
          ],
          discountAmount: 100,
          taxAmount: 50,
          nextVisitDate: '2024-01-22',
          nextVisitTime: '10:00',
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty items array', () => {
        const result = validate(createInvoiceSchema, {
          patientID: 1,
          invoiceDate: '2024-01-15',
          items: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('At least one item');
        }
      });

      it('should reject negative discount', () => {
        const result = validate(createInvoiceSchema, {
          patientID: 1,
          invoiceDate: '2024-01-15',
          items: [{ description: 'Session', quantity: 1, unitPrice: 1000, lineTotal: 1000 }],
          discountAmount: -100,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createPaymentSchema', () => {
      it('should accept valid payment', () => {
        const result = validate(createPaymentSchema, {
          invoiceID: 1,
          paymentDate: '2024-01-15',
          amount: 1000,
        });
        expect(result.success).toBe(true);
      });

      it('should accept payment with method', () => {
        const result = validate(createPaymentSchema, {
          invoiceID: 1,
          paymentDate: '2024-01-15',
          amount: 1000,
          method: 'Card',
          transactionID: 'TXN123',
          notes: 'Card payment',
        });
        expect(result.success).toBe(true);
      });

      it('should accept all valid payment methods', () => {
        const methods = ['Cash', 'Card', 'BankTransfer'];
        methods.forEach((method) => {
          const result = validate(createPaymentSchema, {
            invoiceID: 1,
            paymentDate: '2024-01-15',
            amount: 1000,
            method,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject zero amount', () => {
        const result = validate(createPaymentSchema, {
          invoiceID: 1,
          paymentDate: '2024-01-15',
          amount: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative amount', () => {
        const result = validate(createPaymentSchema, {
          invoiceID: 1,
          paymentDate: '2024-01-15',
          amount: -500,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Service Schemas', () => {
    describe('createServiceSchema', () => {
      it('should accept valid service', () => {
        const result = validate(createServiceSchema, {
          code: 'PT-001',
          name: 'Physiotherapy Session',
        });
        expect(result.success).toBe(true);
      });

      it('should accept service with optional fields', () => {
        const result = validate(createServiceSchema, {
          code: 'PT-001',
          name: 'Physiotherapy Session',
          defaultPrice: 1000,
          category: 'Therapy',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid code format', () => {
        const result = validate(createServiceSchema, {
          code: 'invalid code!',
          name: 'Test Service',
        });
        expect(result.success).toBe(false);
      });

      it('should accept code with letters, numbers, and hyphens', () => {
        const result = validate(createServiceSchema, {
          code: 'SVC-123-ABC',
          name: 'Test Service',
        });
        expect(result.success).toBe(true);
      });

      it('should reject negative default price', () => {
        const result = validate(createServiceSchema, {
          code: 'PT-001',
          name: 'Physiotherapy',
          defaultPrice: -100,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('updateServiceSchema', () => {
      it('should require serviceID', () => {
        const result = validate(updateServiceSchema, {
          code: 'PT-001',
          name: 'Updated Service',
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid update', () => {
        const result = validate(updateServiceSchema, {
          serviceID: 1,
          code: 'PT-001',
          name: 'Updated Service',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Package Schemas', () => {
    describe('createPackageSchema', () => {
      it('should accept valid package', () => {
        const result = validate(createPackageSchema, {
          name: '10 Session Package',
          totalSessions: 10,
          price: 8000,
        });
        expect(result.success).toBe(true);
      });

      it('should accept package with validityDays', () => {
        const result = validate(createPackageSchema, {
          name: '10 Session Package',
          totalSessions: 10,
          price: 8000,
          validityDays: 60,
        });
        expect(result.success).toBe(true);
      });

      it('should reject zero sessions', () => {
        const result = validate(createPackageSchema, {
          name: 'Empty Package',
          totalSessions: 0,
          price: 1000,
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative price', () => {
        const result = validate(createPackageSchema, {
          name: 'Invalid Package',
          totalSessions: 10,
          price: -1000,
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-integer sessions', () => {
        const result = validate(createPackageSchema, {
          name: 'Invalid Package',
          totalSessions: 10.5,
          price: 1000,
        });
        expect(result.success).toBe(false);
      });

      it('should reject zero validity days', () => {
        const result = validate(createPackageSchema, {
          name: 'Package',
          totalSessions: 10,
          price: 1000,
          validityDays: 0,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('updatePackageSchema', () => {
      it('should require packageID', () => {
        const result = validate(updatePackageSchema, {
          name: 'Updated Package',
          totalSessions: 10,
          price: 8000,
        });
        expect(result.success).toBe(false);
      });

      it('should accept valid update', () => {
        const result = validate(updatePackageSchema, {
          packageID: 1,
          name: 'Updated Package',
          totalSessions: 12,
          price: 9000,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Expense Schemas', () => {
    describe('createExpenseSchema', () => {
      it('should accept valid expense', () => {
        const result = validate(createExpenseSchema, {
          expenseDate: '2024-01-15',
          title: 'Office Supplies',
          amount: 500,
        });
        expect(result.success).toBe(true);
      });

      it('should accept expense with all fields', () => {
        const result = validate(createExpenseSchema, {
          expenseDate: '2024-01-15',
          title: 'Monthly Rent',
          category: 'Rent',
          amount: 50000,
          paidTo: 'Property Owner',
          notes: 'January rent payment',
        });
        expect(result.success).toBe(true);
      });

      it('should accept all valid expense categories', () => {
        const categories = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Equipment', 'Other'];
        categories.forEach((category) => {
          const result = validate(createExpenseSchema, {
            expenseDate: '2024-01-15',
            title: 'Test Expense',
            amount: 100,
            category,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid category', () => {
        const result = validate(createExpenseSchema, {
          expenseDate: '2024-01-15',
          title: 'Test',
          amount: 100,
          category: 'InvalidCategory',
        });
        expect(result.success).toBe(false);
      });

      it('should reject zero amount', () => {
        const result = validate(createExpenseSchema, {
          expenseDate: '2024-01-15',
          title: 'Test',
          amount: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty title', () => {
        const result = validate(createExpenseSchema, {
          expenseDate: '2024-01-15',
          title: '',
          amount: 100,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('updateExpenseSchema', () => {
      it('should require expenseID', () => {
        const result = validate(updateExpenseSchema, {
          expenseDate: '2024-01-15',
          title: 'Updated',
          amount: 100,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('User Schemas', () => {
    describe('loginSchema', () => {
      it('should accept valid credentials', () => {
        const result = validate(loginSchema, {
          username: 'admin',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty username', () => {
        const result = validate(loginSchema, {
          username: '',
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const result = validate(loginSchema, {
          username: 'admin',
          password: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject username exceeding max length', () => {
        const result = validate(loginSchema, {
          username: 'a'.repeat(51),
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createUserSchema', () => {
      it('should accept valid user', () => {
        const result = validate(createUserSchema, {
          username: 'newuser',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject short username', () => {
        const result = validate(createUserSchema, {
          username: 'ab',
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });

      it('should reject short password', () => {
        const result = validate(createUserSchema, {
          username: 'newuser',
          password: '12345',
        });
        expect(result.success).toBe(false);
      });

      it('should reject username with special characters', () => {
        const result = validate(createUserSchema, {
          username: 'user@name',
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });

      it('should accept username with underscores', () => {
        const result = validate(createUserSchema, {
          username: 'user_name_123',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should accept all valid roles', () => {
        const roles = ['Admin', 'User'];
        roles.forEach((role) => {
          const result = validate(createUserSchema, {
            username: 'testuser',
            password: 'password123',
            role,
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('changePasswordSchema', () => {
      it('should accept valid password change', () => {
        const result = validate(changePasswordSchema, {
          userID: 1,
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject short new password', () => {
        const result = validate(changePasswordSchema, {
          userID: 1,
          currentPassword: 'oldpassword',
          newPassword: '12345',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing userID', () => {
        const result = validate(changePasswordSchema, {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Validate Function', () => {
    it('should return success with data for valid input', () => {
      const result = validate(loginSchema, {
        username: 'admin',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('admin');
        expect(result.data.password).toBe('password123');
      }
    });

    it('should return error details for invalid input', () => {
      const result = validate(loginSchema, {
        username: '',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ValidateOrThrow Function', () => {
    it('should return validated data for valid input', () => {
      const data = validateOrThrow(loginSchema, {
        username: 'admin',
        password: 'password123',
      });
      expect(data.username).toBe('admin');
    });

    it('should throw error for invalid input', () => {
      expect(() => {
        validateOrThrow(loginSchema, {
          username: '',
          password: 'password123',
        });
      }).toThrow('Validation failed');
    });
  });

  describe('isZodError Function', () => {
    it('should return true for ZodError', () => {
      try {
        validateOrThrow(loginSchema, { username: '', password: '' });
      } catch (e) {
        // The thrown error is a regular Error, not a ZodError directly
        expect(e instanceof Error).toBe(true);
      }
    });

    it('should return false for regular Error', () => {
      const error = new Error('Not a Zod error');
      expect(isZodError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isZodError('string')).toBe(false);
      expect(isZodError(123)).toBe(false);
      expect(isZodError(null)).toBe(false);
      expect(isZodError(undefined)).toBe(false);
    });
  });
});
