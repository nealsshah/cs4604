-- SQL script to manually create the first admin user
-- This must be run before using the application
-- The first admin can then create other admins through the application

-- Create the Users table if it doesn't exist (with Admin support)
CREATE TABLE IF NOT EXISTS Users (
    UserID INT NOT NULL AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    UserType ENUM('Admin', 'JobApplicant', 'Recruiter') NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IMPORTANT: To create the first admin user manually, you need to generate a bcrypt hash first
-- 
-- Use one of these methods to generate the bcrypt hash:
--
-- Method 1: Using Node.js (in your project directory):
--   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your_password_here', 10).then(h => console.log(h));"
--
-- Method 2: Using Python:
--   import bcrypt
--   password = b'your_password_here'
--   hashed = bcrypt.hashpw(password, bcrypt.gensalt())
--   print(hashed.decode('utf-8'))
--
-- Method 3: Using online bcrypt generator (use salt rounds: 10)
--   https://bcrypt-generator.com/
--
-- After generating the hash, replace 'ADMIN_USERNAME' and 'BCRYPT_HASH_HERE' below:
--
-- Example (DO NOT USE THESE - Generate your own):
-- INSERT INTO Users (Username, PasswordHash, UserType) 
-- VALUES ('admin', '$2a$10$YourGeneratedHashHere...', 'Admin');

-- Uncomment and modify the line below to create your first admin:
-- INSERT INTO Users (Username, PasswordHash, UserType) VALUES ('ADMIN_USERNAME', 'BCRYPT_HASH_HERE', 'Admin');

-- After creating the first admin, you can:
-- 1. Log in with the admin credentials
-- 2. Go to the Admin Dashboard
-- 3. Use "Create Admin" to create additional admin accounts through the application

