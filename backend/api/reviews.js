const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

module.exports = async (req, res) => {
  const { method, url, body, query } = req;

  // Thêm CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://pet-shop-urk12.vercel.app');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Xử lý OPTIONS (cho CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Kết nối MongoDB Atlas
  const client = new MongoClient(process.env.MONGODB_URI);
  let db;
  try {
    await client.connect();
    db = client.db();
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi kết nối database' });
  }

  switch (url) {
    case '/':
      if (method === 'GET') {
        // Giả định getAllReviews là hàm từ models
        const reviews = await db.collection('reviews').find().toArray();
        return res.status(200).json(reviews);
      } else if (method === 'POST') {
        const { productId, email, username, rating, comment } = body;
        if (!productId || !email || !username || !rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Dữ liệu không hợp lệ. Yêu cầu productId, email, username, và rating (1-5).' });
        }
        const review = {
          productId,
          email,
          username,
          rating: Number(rating),
          comment: comment || '',
          createdAt: new Date(),
        };
        const result = await db.collection('reviews').insertOne(review);
        review._id = result.insertedId;

        // Cập nhật thống kê sản phẩm
        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        if (product) {
          const reviewsForProduct = await db.collection('reviews').find({ productId: new ObjectId(productId) }).toArray();
          const totalRating = reviewsForProduct.reduce((sum, r) => sum + r.rating, 0);
          const avgRating = totalRating / reviewsForProduct.length || 0;
          await db.collection('products').updateOne(
            { _id: new ObjectId(productId) },
            { $set: { avgRating, reviewCount: reviewsForProduct.length } }
          );
        }

        review.productTitle = product?.title || 'Unknown Product';
        return res.status(200).json(review);
      }
      break;

    default:
      return res.status(404).json({ message: 'Route not found' });
  }

  await client.close();
};