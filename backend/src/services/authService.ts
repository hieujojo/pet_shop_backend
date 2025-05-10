import { findUserByEmail, addUser } from '../models/auth/authModel';
import { getDb } from '../config/db';
import { sendVerificationEmail, validateVerificationCode } from '../utils/email';
import { IUser } from '../types';

const generateUserCode = async (): Promise<string> => {
  const db = await getDb();
  const usersCollection = db.collection('users');
  const lastUser = await usersCollection.findOne({}, { sort: { user_code: -1 } });
  if (!lastUser || !lastUser.user_code) return '#UPS001';
  const lastCode = parseInt(lastUser.user_code.replace('#UPS', ''));
  const newCode = lastCode + 1;
  return `#UPS${newCode.toString().padStart(3, '0')}`;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string, // Password đã được hash
  avatar: string,
  address: string,
  phone: string
): Promise<void> => {
  const user_code = await generateUserCode();
  await addUser({ user_code, avatar, name, address, phone, email, password });
};

export const validateUserVerificationCode = async (email: string, code: string): Promise<boolean> => {
  return await validateVerificationCode(email, code);
};

export const sendUserVerificationEmail = async (email: string): Promise<void> => {
  await sendVerificationEmail(email);
};