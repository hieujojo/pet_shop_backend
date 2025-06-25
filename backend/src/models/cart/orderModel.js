"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOrderItem = exports.updateOrderItem = exports.addToOrder = exports.getOrder = void 0;
const getOrder = async (db, email) => {
    try {
        const orders = await db.collection('order_products').find({ 'user.id': email, status: 1 }).toArray();
        if (!orders || orders.length === 0) {
            return { orders: [] };
        }
        const result = [];
        for (const order of orders) {
            const items = [];
            let totalPrice = 0;
            for (const product of order.product) {
                const item = {
                    productId: product.id,
                    title: product.name,
                    brand: 'Unknown Brand',
                    image: '/images/default-product.jpg',
                    price: product.price,
                    quantity: product.quantity,
                };
                items.push(item);
                totalPrice += product.price * product.quantity;
            }
            result.push({
                userId: order.user.id,
                items,
                totalPrice,
                order_code: order.order_code,
            });
        }
        return { orders: result };
    }
    catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error);
        throw new Error('Không thể lấy đơn hàng');
    }
};
exports.getOrder = getOrder;
const getOrCreateOrderCode = async (db, email) => {
    const existingOrder = await db.collection('order_products').findOne({
        'user.id': email,
        status: 1,
    });
    if (existingOrder) {
        return existingOrder.order_code;
    }
    const lastOrder = await db.collection('order_products')
        .find({ order_code: { $regex: '^#PS\\d+$' } })
        .sort({ order_code: -1 })
        .limit(1)
        .toArray();
    let sequenceNumber = 129;
    if (lastOrder.length > 0) {
        const lastCode = lastOrder[0].order_code;
        const match = lastCode.match(/^#PS(\d+)$/);
        if (match && match[1]) {
            const number = parseInt(match[1]);
            if (!isNaN(number)) {
                sequenceNumber = number + 1;
            }
        }
    }
    return `#PS${sequenceNumber}`;
};
const addToOrder = async (db, email, item, userInfo) => {
    try {
        const orderCode = await getOrCreateOrderCode(db, email);
        const newProduct = {
            id: item.productId,
            name: item.title,
            price: item.price,
            quantity: item.quantity,
        };
        const existingOrder = await db.collection('order_products').findOne({
            'user.id': email,
            order_code: orderCode,
            status: 1,
        });
        if (existingOrder) {
            const productIndex = existingOrder.product.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                const updatedProduct = [...existingOrder.product];
                updatedProduct[productIndex].quantity += item.quantity;
                const newTotal = parseFloat(existingOrder.total) + (item.price * item.quantity);
                await db.collection('order_products').updateOne({ 'user.id': email, order_code: orderCode }, {
                    $set: {
                        product: updatedProduct,
                        total: newTotal.toFixed(3),
                        updated_at: new Date(),
                    },
                });
            }
            else {
                const newTotal = parseFloat(existingOrder.total) + (item.price * item.quantity);
                await db.collection('order_products').updateOne({ 'user.id': email, order_code: orderCode }, {
                    $push: {
                        product: newProduct,
                    },
                    $set: {
                        total: newTotal.toFixed(3),
                        updated_at: new Date(),
                    },
                });
            }
        }
        else {
            await db.collection('order_products').insertOne({
                order_code: orderCode,
                total: (item.price * item.quantity).toFixed(3),
                status: 1,
                created_at: new Date(),
                updated_at: new Date(),
                user: {
                    id: email,
                    name: userInfo.name,
                    address: userInfo.address,
                    phone: userInfo.phone,
                },
                product: [newProduct],
            });
        }
        return orderCode;
    }
    catch (error) {
        console.error('Lỗi khi thêm vào đơn hàng:', error);
        throw new Error('Không thể thêm vào đơn hàng');
    }
};
exports.addToOrder = addToOrder;
const updateOrderItem = async (db, email, productId, quantity) => {
    try {
        const order = await db.collection('order_products').findOne({
            'user.id': email,
            status: 1,
        });
        if (!order) {
            throw new Error('Không tìm thấy giỏ hàng');
        }
        const productIndex = order.product.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
        }
        const updatedProduct = [...order.product];
        const oldQuantity = updatedProduct[productIndex].quantity;
        updatedProduct[productIndex].quantity = Math.max(1, quantity);
        const pricePerUnit = updatedProduct[productIndex].price;
        const totalChange = (quantity - oldQuantity) * pricePerUnit;
        const newTotal = (parseFloat(order.total) + totalChange).toFixed(3);
        await db.collection('order_products').updateOne({ 'user.id': email, order_code: order.order_code }, {
            $set: {
                product: updatedProduct,
                total: newTotal,
                updated_at: new Date(),
            },
        });
    }
    catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm trong đơn hàng:', error);
        throw error;
    }
};
exports.updateOrderItem = updateOrderItem;
const removeOrderItem = async (db, email, productId) => {
    try {
        const order = await db.collection('order_products').findOne({
            'user.id': email,
            status: 1,
        });
        if (!order) {
            throw new Error('Không tìm thấy giỏ hàng');
        }
        const productIndex = order.product.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
        }
        const productToRemove = order.product[productIndex];
        const newProductArray = order.product.filter(p => p.id !== productId);
        const newTotal = (parseFloat(order.total) - (productToRemove.price * productToRemove.quantity)).toFixed(3);
        if (newProductArray.length === 0) {
            await db.collection('order_products').deleteOne({
                'user.id': email,
                order_code: order.order_code,
                status: 1,
            });
        }
        else {
            await db.collection('order_products').updateOne({ 'user.id': email, order_code: order.order_code }, {
                $set: {
                    product: newProductArray,
                    total: newTotal,
                    updated_at: new Date(),
                },
            });
        }
    }
    catch (error) {
        console.error('Lỗi khi xóa sản phẩm khỏi đơn hàng:', error);
        throw error;
    }
};
exports.removeOrderItem = removeOrderItem;
