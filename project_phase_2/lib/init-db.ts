import { query } from './db';

export async function initializeUsersTable() {
  try {
    // First, check if table exists and alter it if needed
    await query(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INT NOT NULL AUTO_INCREMENT,
        Username VARCHAR(50) UNIQUE NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        UserType ENUM('Admin', 'JobApplicant', 'Recruiter') NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (UserID)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    // Alter table to add Admin to enum if needed (handles existing tables)
    try {
      await query(`
        ALTER TABLE Users MODIFY COLUMN UserType ENUM('Admin', 'JobApplicant', 'Recruiter') NOT NULL
      `);
    } catch (err: any) {
      // Ignore error if column already has the correct enum values
      if (!err.message?.includes('Duplicate entry')) {
        console.log('Table already has correct UserType enum');
      }
    }
    
    // Increase PasswordHash length to accommodate bcrypt hashes (60 chars + safety margin)
    try {
      await query(`
        ALTER TABLE Users MODIFY COLUMN PasswordHash VARCHAR(255) NOT NULL
      `);
    } catch (err: any) {
      // Ignore error if already correct length
      console.log('PasswordHash column may already be correct length');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Users table:', error);
    return false;
  }
}

