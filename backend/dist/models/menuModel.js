"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Hàm getMenuItems nhận thêm tham số db để truy vấn MongoDB
const getMenuItems = async (db, locale) => {
    try {
        const menuItems = await db
            .collection('menu_items')
            .find({ locale: locale }) // Tương đương WHERE locale = ?
            .toArray();
        return menuItems;
    }
    catch (error) {
        console.error('Error fetching menu items:', error);
        throw error; // Ném lỗi để controller xử lý
    }
};
exports.default = { getMenuItems };
