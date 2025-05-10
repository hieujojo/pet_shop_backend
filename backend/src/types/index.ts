import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  user_code: string;
  avatar: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  password?: string;
  createdAt?: Date;
}

export interface IVerificationCode {
  _id?: ObjectId;
  email: string;
  code: string;
  createdAt: Date;
}