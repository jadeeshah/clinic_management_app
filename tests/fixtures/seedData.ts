/**
 * Re-export seed data from src/database for tests
 * This ensures tests and production use the same seed data
 */

export {
  seedDoctors,
  seedPatients,
  seedPackages,
  seedServices,
  seedPatientPackages,
  seedVisits,
  seedInvoices,
  seedPayments,
  seedExpenses,
  seedDataSummary,
} from '../../src/database/seedData';
