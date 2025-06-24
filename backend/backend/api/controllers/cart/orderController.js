"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderHistoryHandler = exports.placeOrderHandler = exports.removeOrderItemHandler = exports.updateOrderItemHandler = exports.addToOrderHandler = exports.getOrderHandler = void 0;
const orderModel_1 = require("../../models/cart/orderModel");
const authModel_1 = require("../../models/auth/authModel");
const nodemailer_1 = __importDefault(require("nodemailer"));
const axios_1 = __importDefault(require("axios"));
const getOrderHandler = async (req, res) => {
    var _a;
    try {
        if (!req.db)
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email)
            throw new Error('Người dùng chưa xác thực');
        const result = await (0, orderModel_1.getOrder)(req.db, email);
        if (!result.orders.length) {
            return res.status(200).json({ message: 'Không tìm thấy giỏ hàng đang chờ xử lý', orders: [] });
        }
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        return res.status(500).json({ error: 'Không thể lấy giỏ hàng' });
    }
};
exports.getOrderHandler = getOrderHandler;
const addToOrderHandler = async (req, res) => {
    var _a;
    try {
        if (!req.db)
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email)
            throw new Error('Người dùng chưa xác thực');
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Không có sản phẩm nào được cung cấp');
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user)
            throw new Error('Không tìm thấy người dùng trong cơ sở dữ liệu');
        const userInfo = {
            name: user.name,
            address: user.address,
            phone: user.phone,
        };
        let orderCode;
        for (const item of items) {
            orderCode = await (0, orderModel_1.addToOrder)(req.db, email, item, userInfo);
        }
        const result = await (0, orderModel_1.getOrder)(req.db, email);
        return res.status(200).json({ message: 'Giỏ hàng đã được cập nhật', orders: result.orders, orderCode });
    }
    catch (error) {
        console.error('Lỗi khi cập nhật giỏ hàng:', error);
        return res.status(500).json({ error: 'Không thể cập nhật giỏ hàng' });
    }
};
exports.addToOrderHandler = addToOrderHandler;
const updateOrderItemHandler = async (req, res) => {
    var _a;
    try {
        if (!req.db)
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email)
            throw new Error('Người dùng chưa xác thực');
        const { productId, quantity } = req.body;
        if (!productId || quantity < 1) {
            throw new Error('productId hoặc số lượng không hợp lệ');
        }
        await (0, orderModel_1.updateOrderItem)(req.db, email, productId, quantity);
        const result = await (0, orderModel_1.getOrder)(req.db, email);
        return res.status(200).json({ message: 'Sản phẩm trong giỏ hàng đã được cập nhật', orders: result.orders });
    }
    catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm trong giỏ hàng:', error);
        return res.status(500).json({ error: 'Không thể cập nhật sản phẩm trong giỏ hàng' });
    }
};
exports.updateOrderItemHandler = updateOrderItemHandler;
const removeOrderItemHandler = async (req, res) => {
    var _a;
    try {
        if (!req.db)
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email)
            throw new Error('Người dùng chưa xác thực');
        const { productId } = req.params;
        await (0, orderModel_1.removeOrderItem)(req.db, email, productId);
        const result = await (0, orderModel_1.getOrder)(req.db, email);
        return res.status(200).json({ message: 'Sản phẩm đã được xóa khỏi giỏ hàng', orders: result.orders });
    }
    catch (error) {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
        return res.status(500).json({ error: 'Không thể xóa sản phẩm khỏi giỏ hàng' });
    }
};
exports.removeOrderItemHandler = removeOrderItemHandler;
const placeOrderHandler = async (req, res) => {
    var _a;
    try {
        if (!req.db)
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email)
            throw new Error('Người dùng chưa xác thực');
        const { items, address, phone, email: orderEmail, totalPrice } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Không có sản phẩm nào được cung cấp');
        }
        if (!address || !phone || !orderEmail) {
            throw new Error('Thiếu địa chỉ, số điện thoại hoặc email');
        }
        const user = await (0, authModel_1.findUserByEmail)(email);
        if (!user)
            throw new Error('Không tìm thấy người dùng trong cơ sở dữ liệu');
        const userInfo = {
            name: user.name,
            address: address,
            phone: phone,
        };
        const orderCode = await req.db.collection('order_products')
            .find({ order_code: { $regex: '^#PS\\d+$' } })
            .sort({ order_code: -1 })
            .limit(1)
            .toArray()
            .then(orders => {
            let sequenceNumber = 129;
            if (orders.length > 0) {
                const lastCode = orders[0].order_code;
                const match = lastCode.match(/^#PS(\d+)$/);
                if (match && match[1]) {
                    sequenceNumber = parseInt(match[1]) + 1;
                }
            }
            return `#PS${sequenceNumber}`;
        });
        for (const item of items) {
            await req.db.collection('order_products').insertOne({
                order_code: orderCode,
                total: (item.price * item.quantity).toFixed(3),
                status: 2,
                created_at: new Date(),
                updated_at: new Date(),
                user: {
                    id: email,
                    name: userInfo.name,
                    address: userInfo.address,
                    phone: userInfo.phone,
                },
                product: [{
                        id: item.productId,
                        name: item.title,
                        price: item.price,
                        quantity: item.quantity,
                    }],
            });
            // Lưu lịch sử đơn hàng
            await req.db.collection('order_history').insertOne({
                order_code: orderCode,
                total: (item.price * item.quantity).toFixed(3),
                status: 2,
                created_at: new Date(),
                updated_at: new Date(),
                user: {
                    id: email,
                    name: userInfo.name,
                    address: userInfo.address,
                    phone: userInfo.phone,
                },
                product: [{
                        id: item.productId,
                        name: item.title,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image || '/images/default-product.jpg',
                        brand: item.brand || 'Unknown Brand',
                    }],
            });
        }
        await req.db.collection('order_products').deleteOne({
            'user.id': email,
            status: 1,
        });
        try {
            const transporter = nodemailer_1.default.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            const attachments = [];
            for (const item of items) {
                if (item.image) {
                    try {
                        const response = await axios_1.default.get(item.image, {
                            responseType: 'arraybuffer',
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                            timeout: 5000,
                        });
                        const imageBuffer = Buffer.from(response.data, 'binary');
                        attachments.push({
                            filename: `${item.title}.jpg`,
                            content: imageBuffer,
                            cid: item.productId,
                        });
                    }
                    catch (error) {
                        console.error(`Không thể tải hình ảnh cho sản phẩm ${item.productId}:`, error);
                    }
                }
            }
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: orderEmail,
                subject: `Xác nhận đơn hàng ${orderCode}`,
                html: `
          <h1>Xác nhận đơn hàng</h1>
          <p>Cảm ơn bạn đã đặt hàng! Dưới đây là chi tiết đơn hàng của bạn:</p>
          <p><strong>Mã đơn hàng:</strong> ${orderCode}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${address}</p>
          <p><strong>Số điện thoại:</strong> ${phone}</p>
          <h2>Sản phẩm</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hình ảnh</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sản phẩm</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Số lượng</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Giá</th>
            </tr>
            ${items
                    .map((item) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">
                      ${item.image && attachments.some((a) => a.cid === item.productId)
                    ? `<img src="cid:${item.productId}" alt="${item.title}" style="width: 100px; height: auto; display: block;" />`
                    : 'Ảnh không khả dụng'}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.title}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.price.toLocaleString('vi-VN')}₫</td>
                  </tr>
                `)
                    .join('')}
          </table>
          <p><strong>Tổng cộng:</strong> ${totalPrice.toLocaleString('vi-VN')}₫</p>
          <p>Vui lòng kiểm tra thông tin và liên hệ chúng tôi nếu có thắc mắc!</p>
        `,
                attachments,
            };
            await transporter.sendMail(mailOptions);
        }
        catch (error) {
            console.error('Lỗi khi gửi email:', error.message);
            return res.status(200).json({
                message: 'Đặt hàng thành công, nhưng không thể gửi email',
                order: { order_code: orderCode },
                emailError: error.message,
            });
        }
        return res.status(200).json({ message: 'Đặt hàng thành công', order: { order_code: orderCode } });
    }
    catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        return res.status(500).json({ error: 'Không thể đặt hàng', details: error.message });
    }
};
exports.placeOrderHandler = placeOrderHandler;
const getOrderHistoryHandler = async (req, res) => {
    var _a;
    try {
        if (!req.db)
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        const email = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.email;
        if (!email)
            throw new Error('Người dùng chưa xác thực');
        const orders = await req.db.collection('order_history').find({ 'user.id': email }).toArray();
        if (!orders || orders.length === 0) {
            return res.status(200).json({ message: 'Không tìm thấy lịch sử đơn hàng', orders: [] });
        }
        const result = orders.map(order => ({
            order_code: order.order_code,
            total: parseFloat(order.total),
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at,
            user: {
                id: order.user.id,
                name: order.user.name,
                address: order.user.address,
                phone: order.user.phone,
            },
            products: order.product.map((item) => ({
                productId: item.id,
                title: item.name,
                brand: item.brand || 'Unknown Brand',
                image: item.image || '/images/default-product.jpg',
                price: item.price,
                quantity: item.quantity,
            })),
        }));
        return res.status(200).json({ message: 'Lấy lịch sử đơn hàng thành công', orders: result });
    }
    catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
        return res.status(500).json({ error: 'Không thể lấy lịch sử đơn hàng' });
    }
};
exports.getOrderHistoryHandler = getOrderHistoryHandler;
