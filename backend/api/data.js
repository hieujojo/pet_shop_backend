const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

module.exports = async (req, res) => {
  const { method, url } = req;

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
    case '/data':
      if (method === 'GET') {
        // Giả định getAllData là hàm từ models
        const data = await db.collection('data').find().toArray(); // Thay collection 'data' bằng collection thực tế
        return res.status(200).json(data);
      }
      break;

    default:
      return res.status(404).json({ message: 'Route not found' });
  }

  await client.close();
};