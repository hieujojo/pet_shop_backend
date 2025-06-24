"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const unidecode_1 = __importDefault(require("unidecode"));
// Hàm chuẩn hóa tiếng Việt
const normalizeVietnamese = (str) => {
    return (0, unidecode_1.default)(str)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
};
const updateProducts = async () => {
    try {
        // Lấy kết nối database từ db.ts
        const db = await (0, db_1.getDb)();
        const products = await db.collection('products').find().toArray();
        if (products.length === 0) {
            console.log('Không có sản phẩm nào để cập nhật.');
            return;
        }
        // Tạo danh sách các thao tác cập nhật hàng loạt
        const bulkOps = products.map(product => ({
            updateOne: {
                filter: { _id: product._id },
                update: { $set: { normalizedTitle: normalizeVietnamese(product.title) } },
            },
        }));
        // Thực hiện cập nhật hàng loạt
        const result = await db.collection('products').bulkWrite(bulkOps);
        console.log(`Đã cập nhật ${result.modifiedCount} sản phẩm với normalizedTitle`);
        // Ghi log chi tiết cho từng sản phẩm (tùy chọn, có thể bỏ nếu không cần)
        for (const product of products) {
            const normalizedTitle = normalizeVietnamese(product.title);
            console.log(`Updated product: ${product.title} -> normalizedTitle: ${normalizedTitle}`);
        }
        console.log('Cập nhật normalizedTitle hoàn tất');
    }
    catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm:', error);
        throw error; // Ném lỗi để xử lý ở cấp cao hơn nếu cần
    }
};
// Gọi hàm để chạy
updateProducts().catch(error => {
    console.error('Lỗi trong quá trình thực thi:', error);
    process.exit(1);
});
