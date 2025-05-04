import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, 'reviews.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDb();
  }
});

const initializeDb = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT NOT NULL,
      reviewText TEXT NOT NULL,
      isVerified BOOLEAN NOT NULL DEFAULT true,
      emailNullifier TEXT UNIQUE NOT NULL, -- Ensure nullifier is unique
      serviceName TEXT,
      blueprintId TEXT,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5), -- Add rating column with constraint
      starknetVerified BOOLEAN DEFAULT false, -- Add Starknet verification flag
      starknetTxHash TEXT, -- Add Starknet transaction hash
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.run(sql, (err) => {
    if (err) {
      console.error('Error creating table', err.message);
    } else {
      console.log('Reviews table initialized successfully.');
      // Add index for faster nullifier lookups
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_nullifier ON reviews(emailNullifier)', (idxErr) => {
          if (idxErr) console.error("Error creating index:", idxErr.message);
      });
    }
  });
};

export default db;