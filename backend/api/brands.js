module.exports = (req, res) => {
  const { method, url, body } = req;

  // Thêm CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://pet-shop-urk12.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Xử lý OPTIONS (cho CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Kiểm tra route
  if (!url.startsWith('/brands')) {
    return res.status(404).json({ message: 'Route not found' });
  }

  switch (method) {
    case 'GET':
      // Giả định dữ liệu mẫu thay vì database (cho test)
      const brands = [
        { id: '1', brand: 'Test Brand 1', image: '/images/test1.png', href: '/brands/1' },
        { id: '2', brand: 'Test Brand 2', image: '/images/test2.png', href: '/brands/2' },
      ];
      return res.status(200).json(brands);
    case 'POST':
      const { brand, image, href } = body || {};
      if (!brand || !image || !href) {
        return res.status(400).json({ error: 'Brand, image, and href are required' });
      }
      const newBrand = { id: Date.now().toString(), brand, image, href };
      return res.status(201).json({ message: 'Brand created', brand: newBrand });
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
};