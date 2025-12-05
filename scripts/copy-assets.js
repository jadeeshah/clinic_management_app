const fs = require('fs');
const path = require('path');

// Ensure dist-main/database directory exists
const dbDir = path.join(__dirname, '..', 'dist-main', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Copy schema.sql if it exists
const schemaSource = path.join(__dirname, '..', 'src', 'database', 'schema.sql');
const schemaDest = path.join(dbDir, 'schema.sql');

if (fs.existsSync(schemaSource)) {
  fs.copyFileSync(schemaSource, schemaDest);
  console.log('Copied schema.sql to dist-main/database/');
} else {
  console.log('schema.sql not found, skipping...');
}
