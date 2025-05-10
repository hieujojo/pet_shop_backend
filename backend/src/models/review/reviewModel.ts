import { Db, ObjectId } from 'mongodb';
import { getDb } from '../../config/db';

interface Review {
  _id?: ObjectId;
  productId: string;
  email: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: Date;
  productTitle?: string;
}

// Lưu đánh giá mới
async function createReview(reviewData: Omit<Review, '_id' | 'createdAt' | 'productTitle'>): Promise<Review> {
  const db: Db = await getDb();
  const review: Review = {
    ...reviewData,
    createdAt: new Date(),
  };
  const result = await db.collection<Review>('reviews').insertOne(review);
  return { _id: result.insertedId, ...review };
}

// Lấy danh sách đánh giá theo productId
async function getReviewsByProductId(productId: string): Promise<Review[]> {
  const db: Db = await getDb();
  const reviews = await db.collection<Review>('reviews').find({ productId }).toArray();

  // Lấy productTitle từ collection products
  const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
  const productTitle = product?.title || 'Unknown Product';

  // Thêm productTitle vào mỗi review
  return reviews.map(review => ({
    ...review,
    productTitle,
  }));
}

// Lấy tất cả đánh giá
async function getAllReviews(): Promise<Review[]> {
  const db: Db = await getDb();
  const reviews = await db.collection<Review>('reviews').find().toArray();

  // Lấy danh sách productId duy nhất
  const productIds = [...new Set(reviews.map(review => review.productId))];
  const products = await db.collection('products').find({ _id: { $in: productIds.map(id => new ObjectId(id)) } }).toArray();
  const productMap = new Map(products.map(p => [p._id.toString(), p.title]));

  // Thêm productTitle vào mỗi review
  return reviews.map(review => ({
    ...review,
    productTitle: productMap.get(review.productId) || 'Unknown Product',
  }));
}

// Cập nhật thống kê sản phẩm
async function updateProductStats(productId: string): Promise<void> {
  const db: Db = await getDb();
  const reviews = await db.collection<Review>('reviews').find({ productId }).toArray();
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  await db.collection('products').updateOne(
    { _id: new ObjectId(productId) },
    { $set: { averageRating, totalReviews } },
    { upsert: true }
  );
}

export { Review, createReview, getReviewsByProductId, getAllReviews, updateProductStats };