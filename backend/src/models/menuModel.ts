import { Db } from 'mongodb';

// Hàm getMenuItems nhận thêm tham số db để truy vấn MongoDB
const getMenuItems = async (db: Db, locale: string) => {
  try {
    const menuItems = await db
      .collection('menu_items')
      .find({ locale: locale }) // Tương đương WHERE locale = ?
      .toArray();
    return menuItems;
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    throw error; // Ném lỗi để controller xử lý
  }
};

export default { getMenuItems };