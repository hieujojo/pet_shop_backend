"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductHandler = exports.getProductByIdHandler = exports.searchProductsHandler = exports.getProducts = void 0;
const productModel_1 = require("../../models/home/productModel");
const getProducts = async (req, res) => {
    try {
        if (!req.db) {
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        }
        const { category } = req.query;
        let products;
        if (category && typeof category === 'string') {
            products = await (0, productModel_1.getProductsByCategory)(req.db, category);
        }
        else {
            products = await (0, productModel_1.getAllProducts)(req.db);
        }
        res.status(200).json(products);
    }
    catch (error) {
        console.error('Lỗi controller:', error);
        res.status(500).json({ error: 'Không thể lấy danh sách sản phẩm: ' + error.message });
    }
};
exports.getProducts = getProducts;
const searchProductsHandler = async (req, res) => {
    try {
        if (!req.db) {
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        }
        const { search } = req.query;
        if (!search || typeof search !== 'string') {
            throw new Error('Vui lòng nhập từ khóa tìm kiếm');
        }
        const products = await (0, productModel_1.searchProducts)(req.db, search);
        res.status(200).json(products);
    }
    catch (error) {
        console.error('Lỗi controller:', error);
        res.status(500).json({ error: 'Không thể tìm kiếm sản phẩm: ' + error.message });
    }
};
exports.searchProductsHandler = searchProductsHandler;
const getProductByIdHandler = async (req, res) => {
    try {
        if (!req.db) {
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        }
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw new Error('ID sản phẩm là bắt buộc');
        }
        const product = await (0, productModel_1.getProductById)(req.db, id);
        res.status(200).json(product);
    }
    catch (error) {
        console.error('Lỗi controller:', error);
        if (error.message === 'Product not found') {
            res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }
        else {
            res.status(500).json({ error: 'Không thể lấy thông tin sản phẩm: ' + error.message });
        }
    }
};
exports.getProductByIdHandler = getProductByIdHandler;
const createProductHandler = async (req, res) => {
    try {
        if (!req.db) {
            throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
        }
        const productData = req.body;
        if (!productData.title || !productData.price || !productData.category) {
            throw new Error('Tiêu đề, giá và danh mục là bắt buộc');
        }
        const newProduct = await (0, productModel_1.createProduct)(req.db, productData);
        res.status(201).json(newProduct);
    }
    catch (error) {
        console.error('Lỗi controller:', error);
        res.status(500).json({ error: 'Không thể tạo sản phẩm: ' + error.message });
    }
};
exports.createProductHandler = createProductHandler;
