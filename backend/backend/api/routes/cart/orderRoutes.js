"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../../controllers/cart/orderController");
const router = (0, express_1.Router)();
const checkSession = (req, res, next) => {
    if (req.session.user) {
        next();
    }
    else {
        res.status(401).json({ error: 'Không được phép truy cập, vui lòng đăng nhập' });
    }
};
const wrapHandler = (handler) => {
    return (req, res, next) => {
        handler(req, res).catch(next);
    };
};
router.get('/', checkSession, wrapHandler(orderController_1.getOrderHandler));
router.post('/', checkSession, wrapHandler(orderController_1.addToOrderHandler));
router.put('/', checkSession, wrapHandler(orderController_1.updateOrderItemHandler));
router.delete('/:productId', checkSession, wrapHandler(orderController_1.removeOrderItemHandler));
router.post('/place', checkSession, wrapHandler(orderController_1.placeOrderHandler));
router.get('/history', checkSession, wrapHandler(orderController_1.getOrderHistoryHandler));
exports.default = router;
