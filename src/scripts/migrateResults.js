import { migrateResultsToNewFormat } from '../services/storage.js';

(async () => {
  try {
    console.log('Starting migration of test results...');
    const result = await migrateResultsToNewFormat();
    console.log('Migration completed:', result);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
