"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getReviewsByProductId = getReviewsByProductId;
exports.getAllReviews = getAllReviews;
exports.updateProductStats = updateProductStats;
const mongodb_1 = require("mongodb");
const db_1 = require("../../config/db");
// Lưu đánh giá mới
async function createReview(reviewData) {
    const db = await (0, db_1.getDb)();
    const review = Object.assign(Object.assign({}, reviewData), { createdAt: new Date() });
    const result = await db.collection('reviews').insertOne(review);
    return Object.assign({ _id: result.insertedId }, review);
}
// Lấy danh sách đánh giá theo productId
async function getReviewsByProductId(productId) {
    const db = await (0, db_1.getDb)();
    const reviews = await db.collection('reviews').find({ productId }).toArray();
    // Lấy productTitle từ collection products
    const product = await db.collection('products').findOne({ _id: new mongodb_1.ObjectId(productId) });
    const productTitle = (product === null || product === void 0 ? void 0 : product.title) || 'Unknown Product';
    // Thêm productTitle vào mỗi review
    return reviews.map(review => (Object.assign(Object.assign({}, review), { productTitle })));
}
// Lấy tất cả đánh giá
async function getAllReviews() {
    const db = await (0, db_1.getDb)();
    const reviews = await db.collection('reviews').find().toArray();
    // Lấy danh sách productId duy nhất
    const productIds = [...new Set(reviews.map(review => review.productId))];
    const products = await db.collection('products').find({ _id: { $in: productIds.map(id => new mongodb_1.ObjectId(id)) } }).toArray();
    const productMap = new Map(products.map(p => [p._id.toString(), p.title]));
    // Thêm productTitle vào mỗi review
    return reviews.map(review => (Object.assign(Object.assign({}, review), { productTitle: productMap.get(review.productId) || 'Unknown Product' })));
}
// Cập nhật thống kê sản phẩm
async function updateProductStats(productId) {
    const db = await (0, db_1.getDb)();
    const reviews = await db.collection('reviews').find({ productId }).toArray();
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
    await db.collection('products').updateOne({ _id: new mongodb_1.ObjectId(productId) }, { $set: { averageRating, totalReviews } }, { upsert: true });
}
