module.exports = (req, res) => {
  const { method, url, query, params, body } = req;

  // Thêm CORS
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
        const { category } = query;
        let products;
        if (category && typeof category === 'string') {
          // Giả định getProductsByCategory là hàm từ models
          products = []; // Thay bằng await getProductsByCategory(db, category)
        } else {
          // Giả định getAllProducts là hàm từ models
          products = []; // Thay bằng await getAllProducts(db)
        }
        return res.status(200).json(products);
      } else if (method === 'POST') {
        const productData = body;
        if (!productData.title || !productData.price || !productData.category) {
          return res.status(400).json({ error: 'Tiêu đề, giá và danh mục là bắt buộc' });
        }
        // Giả định createProduct là hàm từ models
        const newProduct = {}; // Thay bằng await createProduct(db, productData)
        return res.status(201).json(newProduct);
      }
      break;

    case '/search':
      if (method === 'GET') {
        const { search } = query;
        if (!search || typeof search !== 'string') {
          return res.status(400).json({ error: 'Vui lòng nhập từ khóa tìm kiếm' });
        }
        // Giả định searchProducts là hàm từ models
        const products = []; // Thay bằng await searchProducts(db, search)
        return res.status(200).json(products);
      }
      break;

    case `/${params.id}`:
      if (method === 'GET') {
        const { id } = params;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'ID sản phẩm là bắt buộc' });
        }
        // Giả định getProductById là hàm từ models
        const product = {}; // Thay bằng await getProductById(db, id)
        return res.status(200).json(product);
      }
      break;

    default:
      return res.status(404).json({ message: 'Route not found' });
  }
};