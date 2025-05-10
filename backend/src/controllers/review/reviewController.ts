import { Request, Response } from 'express';
import { createReview, getAllReviews, updateProductStats, Review } from '../../models/review/reviewModel';
import { getDb } from '../../config/db';
import { ObjectId } from 'mongodb';

// Lấy danh sách tất cả đánh giá
async function getReviews(req: Request, res: Response): Promise<void> {
  try {
    const reviews: Review[] = await getAllReviews();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
}

// Gửi đánh giá mới
async function postReview(req: Request, res: Response): Promise<void> {
  try {
    const { productId, email, username, rating, comment } = req.body as Omit<Review, '_id' | 'createdAt' | 'productTitle'>;

    // Kiểm tra dữ liệu
    if (!productId || !email || !username || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Dữ liệu không hợp lệ. Yêu cầu productId, email, username, và rating (1-5).' });
      return;
    }

    const review: Review = await createReview({
      productId,
      email,
      username,
      rating: Number(rating),
      comment: comment || '',
    });

    // Cập nhật thống kê sản phẩm
    await updateProductStats(productId);

    // Thêm productTitle vào response
    const db = await getDb();
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    review.productTitle = product?.title || 'Unknown Product';

    res.json(review);
  } catch (err) {
    res.status(400).json({ error: 'Lỗi khi gửi đánh giá' });
  }
}

export { getReviews, postReview };