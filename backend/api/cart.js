module.exports = (req, res) => {
  const { method, url, body, params } = req;

  res.setHeader('Access-Control-Allow-Origin', 'https://pet-shop-urk12.vercel.app');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Xử lý OPTIONS (cho CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Giả định session không dùng trực tiếp, thay bằng token hoặc email từ body/header
  const sessionUser = { email: 'test@example.com' }; // Thay bằng logic xác thực

  if (!sessionUser.email) {
    return res.status(401).json({ error: 'Không được phép truy cập, vui lòng đăng nhập' });
  }

  // Giả định req.db không khả dụng trực tiếp, cần kết nối database qua env
  const db = {}; // Thay bằng logic kết nối (ví dụ: MongoDB từ process.env)

  switch (url) {
    case '/':
      if (method === 'GET') {
        // Giả định getOrder là hàm từ models
        const result = { orders: [] }; // Thay bằng logic thực tế
        if (!result.orders.length) {
          return res.status(200).json({ message: 'Không tìm thấy giỏ hàng đang chờ xử lý', orders: [] });
        }
        return res.status(200).json(result);
      } else if (method === 'POST') {
        const { items } = body;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'Không có sản phẩm nào được cung cấp' });
        }
        // Giả định addToOrder và getOrder là hàm từ models
        const user = { name: 'Test User', address: 'Test Address', phone: '123456789' }; // Thay bằng logic thực tế
        const orderCode = 'dummyCode'; // Thay bằng logic thực tế
        const result = { orders: [] }; // Thay bằng logic thực tế
        return res.status(200).json({ message: 'Giỏ hàng đã được cập nhật', orders: result.orders, orderCode });
      }
      break;

    case '/place':
      if (method === 'POST') {
        const { items, address, phone, email: orderEmail, totalPrice } = body;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'Không có sản phẩm nào được cung cấp' });
        }
        if (!address || !phone || !orderEmail) {
          return res.status(400).json({ error: 'Thiếu địa chỉ, số điện thoại hoặc email' });
        }
        // Giả định findUserByEmail và các logic database
        const user = { name: 'Test User' }; // Thay bằng logic thực tế
        const orderCode = '#PS130'; // Thay bằng logic tạo mã
        // Logic insert và email đã lược giản, bạn cần import nodemailer và axios
        return res.status(200).json({ message: 'Đặt hàng thành công', order: { order_code: orderCode } });
      }
      break;

    case '/history':
      if (method === 'GET') {
        // Giả định truy vấn order_history
        const orders = []; // Thay bằng logic thực tế
        if (!orders.length) {
          return res.status(200).json({ message: 'Không tìm thấy lịch sử đơn hàng', orders: [] });
        }
        const result = orders.map(order => ({
          order_code: order.order_code,
          total: parseFloat(order.total),
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at,
          user: order.user,
          products: order.product,
        }));
        return res.status(200).json({ message: 'Lấy lịch sử đơn hàng thành công', orders: result });
      }
      break;

    case `/${params.productId}`:
      if (method === 'DELETE') {
        // Giả định removeOrderItem là hàm từ models
        const result = { orders: [] }; // Thay bằng logic thực tế
        return res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng', orders: result.orders });
      }
      break;

    default:
      return res.status(404).json({ message: 'Route not found' });
  }
};