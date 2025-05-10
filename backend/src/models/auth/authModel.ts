import { getDb } from '../../config/db'; // Điều chỉnh đường dẫn nếu cần
import { IUser } from '../../types';
import { OptionalId } from 'mongodb';

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email });
    return user as IUser | null;
  } catch (error) {
    console.error('Lỗi tìm user bằng email:', error);
    throw error;
  }
};

export const addUser = async (user: Partial<IUser>): Promise<IUser> => {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    // Kiểm tra các trường bắt buộc
    const requiredFields: (keyof IUser)[] = ['user_code', 'avatar', 'name', 'address', 'phone', 'email'];
    for (const field of requiredFields) {
      if (!user[field]) {
        throw new Error(`Trường bắt buộc ${field} không được để trống`);
      }
    }

    // Tạo newUser với các trường bắt buộc
    const newUser: OptionalId<IUser> = {
      user_code: user.user_code!,
      avatar: user.avatar!,
      name: user.name!,
      address: user.address!,
      phone: user.phone!,
      email: user.email!,
      password: user.password,
      createdAt: new Date(),
    };

    // Xóa _id nếu là undefined
    if (newUser._id === undefined) {
      delete newUser._id;
    }

    const result = await usersCollection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId } as IUser;
  } catch (error) {
    console.error('Lỗi thêm user:', error);
    throw error;
  }
};

// Thêm hàm updateUserByEmail để cập nhật thông tin người dùng
export const updateUserByEmail = async (email: string, updates: Partial<IUser>): Promise<void> => {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const result = await usersCollection.updateOne(
      { email },
      { $set: updates }
    );
    if (result.matchedCount === 0) {
      throw new Error('Không tìm thấy người dùng để cập nhật.');
    }
  } catch (error) {
    console.error('Lỗi cập nhật user:', error);
    throw error;
  }
};