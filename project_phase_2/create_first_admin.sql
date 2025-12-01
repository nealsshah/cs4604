-- SQL script to manually create the first admin user
-- This must be run before using the application
-- The first admin can then create other admins through the application

-- Create the Users table if it doesn't exist
CREATE TABLE IF NOT EXISTS Users (
    UserID INT NOT NULL AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(64) NOT NULL,
    UserType ENUM('JobApplicant', 'Recruiter') NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create the first recruiter user (you can create more through the app)
-- Replace 'recruiter1' with your desired username
-- Replace 'recruiter123' with your desired password (minimum 6 characters)
-- The password will be hashed using bcrypt in the application

-- Note: For the Next.js app, passwords are hashed with bcrypt, not SHA256
-- You should create users through the signup page instead
-- This SQL is just for reference if you need to create a user manually

-- To create a user manually, you'll need to hash the password with bcrypt first
-- Example Python code to generate bcrypt hash:
-- import bcrypt
-- password = b'your_password_here'
-- hashed = bcrypt.hashpw(password, bcrypt.gensalt())
-- print(hashed.decode('utf-8'))

-- To create an admin with a different password, you can use Python to generate the hash:
-- import hashlib
-- print(hashlib.sha256('your_password_here'.encode()).hexdigest())
-- Then replace the PasswordHash value above with the generated hash

