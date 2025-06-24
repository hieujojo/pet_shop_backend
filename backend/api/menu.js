const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

module.exports = async (req, res) => {
  const { method, url, query } = req;

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
        const { locale } = query;
        if (!locale) {
          return res.status(400).json({ error: 'Locale is required' });
        }
        // Giả định getMenuItems là hàm từ models
        const menuItems = await db.collection('menu_items').find({ locale }).toArray(); // Thay logic theo model
        return res.status(200).json(menuItems);
      }
      break;

    default:
      return res.status(404).json({ message: 'Route not found' });
  }

  await client.close();
};