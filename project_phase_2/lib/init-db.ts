import { query } from './db';

export async function initializeUsersTable() {
  try {
    // Create Users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INT NOT NULL AUTO_INCREMENT,
        Username VARCHAR(50) UNIQUE NOT NULL,
        PasswordHash VARCHAR(64) NOT NULL,
        UserType ENUM('JobApplicant', 'Recruiter') NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (UserID)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    return true;
  } catch (error) {
    console.error('Failed to initialize Users table:', error);
    return false;
  }
}

