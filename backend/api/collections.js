module.exports = (req, res) => {
  const { method, url } = req;

  res.setHeader('Access-Control-Allow-Origin', 'https://pet-shop-urk12.vercel.app');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Xử lý OPTIONS (cho CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Giả định kết nối database qua env
  const db = {}; // Thay bằng kết nối MongoDB từ process.env.MONGODB_URI

  switch (url) {
    case '/':
      if (method === 'GET') {
        // Giả định getAllCollections là hàm từ models
        const collections = []; // Thay bằng await getAllCollections(db)
        return res.status(200).json(collections);
      }
      break;

    default:
      return res.status(404).json({ message: 'Route not found' });
  }
};