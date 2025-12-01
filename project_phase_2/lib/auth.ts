import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  UserID: number;
  Username: string;
  UserType: 'Admin' | 'JobApplicant' | 'Recruiter';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { UserID: user.UserID, Username: user.Username, UserType: user.UserType },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function signup(username: string, password: string, userType: 'JobApplicant' | 'Recruiter') {
  // Check if username exists
  const existing = await query(
    'SELECT UserID FROM Users WHERE Username = ?',
    [username]
  ) as any[];

  if (existing.length > 0) {
    throw new Error('Username already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Insert user
  const result = await query(
    'INSERT INTO Users (Username, PasswordHash, UserType) VALUES (?, ?, ?)',
    [username, hashedPassword, userType]
  ) as any;

  return { UserID: result.insertId, Username: username, UserType: userType };
}

export async function login(username: string, password: string): Promise<User> {
  // Get user
  const users = await query(
    'SELECT UserID, Username, PasswordHash, UserType FROM Users WHERE Username = ?',
    [username]
  ) as any[];

  if (users.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = users[0];

  // Verify password
  const isValid = await verifyPassword(password, user.PasswordHash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  return {
    UserID: user.UserID,
    Username: user.Username,
    UserType: user.UserType
  };
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
  if (!oldPassword || !newPassword) {
    throw new Error('Old password and new password are required');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  // Get user with password hash
  const users = await query(
    'SELECT UserID, PasswordHash FROM Users WHERE UserID = ?',
    [userId]
  ) as any[];

  if (users.length === 0) {
    throw new Error('User not found');
  }

  const user = users[0];

  // Verify old password
  const isValid = await verifyPassword(oldPassword, user.PasswordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await query(
    'UPDATE Users SET PasswordHash = ? WHERE UserID = ?',
    [newPasswordHash, userId]
  );
}

export async function createAdminByAdmin(adminUserId: number, username: string, password: string): Promise<void> {
  // Verify current user is admin
  const users = await query(
    'SELECT UserType FROM Users WHERE UserID = ?',
    [adminUserId]
  ) as any[];

  if (users.length === 0 || users[0].UserType !== 'Admin') {
    throw new Error('Only admins can create other admins');
  }

  // Check if username exists
  const existing = await query(
    'SELECT UserID FROM Users WHERE Username = ?',
    [username]
  ) as any[];

  if (existing.length > 0) {
    throw new Error('Username already exists');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Insert admin user
  await query(
    'INSERT INTO Users (Username, PasswordHash, UserType) VALUES (?, ?, ?)',
    [username, hashedPassword, 'Admin']
  );
}

