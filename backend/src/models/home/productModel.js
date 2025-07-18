"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = exports.getProductsByCategory = exports.searchProducts = exports.getProductById = exports.getAllProducts = void 0;
const unidecode_1 = __importDefault(require("unidecode"));
// Hàm chuẩn hóa chuỗi tiếng Việt thành không dấu
const normalizeVietnamese = (str) => {
    return (0, unidecode_1.default)(str)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Loại bỏ ký tự đặc biệt
        .trim();
};
const normalizeImageField = (field) => {
    if (!field || (typeof field === 'string' && field.trim() === '')) {
        return '/images/default-product.jpg';
    }
    if (Array.isArray(field)) {
        return field.length > 0 && typeof field[0] === 'string' ? field[0] : '/images/default-product.jpg';
    }
    if (typeof field === 'string') {
        if (field.startsWith('/images/https://') || field.startsWith('/images/http://')) {
            return field.replace('/images/', '');
        }
        if (field.startsWith('http://') || field.startsWith('https://')) {
            return field;
        }
        if (field.startsWith('/')) {
            return field;
        }
        return `/images/${field}`;
    }
    return '/images/default-product.jpg';
};
const getAllProducts = async (db) => {
    try {
        const start = Date.now();
        const products = await db.collection('products').find().toArray();
        const serializedProducts = products.map(product => {
            const id = product._id ? product._id.toString() : `temp-${Date.now()}`;
            const image = normalizeImageField(product.image);
            const hoverImage = normalizeImageField(product.hoverImage);
            return Object.assign(Object.assign({}, product), { id,
                image,
                hoverImage, href: typeof product.href === 'string' && product.href
                    ? product.href
                    : `/products/${id}` });
        });
        const duration = Date.now() - start;
        console.log(`Products fetched successfully: [${serializedProducts.length} items] in ${duration}ms`, serializedProducts);
        return serializedProducts;
    }
    catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (db, id) => {
    try {
        const start = Date.now();
        const { ObjectId } = require('mongodb');
        let product;
        try {
            product = await db.collection('products').findOne({ _id: new ObjectId(id) });
        }
        catch (e) {
            product = await db.collection('products').findOne({ id });
        }
        if (!product) {
            throw new Error('Product not found');
        }
        const serializedProduct = Object.assign(Object.assign({}, product), { id: product._id ? product._id.toString() : product.id, image: normalizeImageField(product.image), hoverImage: normalizeImageField(product.hoverImage), href: typeof product.href === 'string' && product.href
                ? product.href
                : `/products/${id}` });
        const duration = Date.now() - start;
        console.log(`Product fetched successfully: [${id}] in ${duration}ms`, serializedProduct);
        return serializedProduct;
    }
    catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        throw error;
    }
};
exports.getProductById = getProductById;
const searchProducts = async (db, searchTerm) => {
    try {
        const start = Date.now();
        console.log(`Received search term: "${searchTerm}"`);
        // Chuẩn hóa từ khóa tìm kiếm
        const normalizedSearch = normalizeVietnamese(searchTerm);
        // Tìm kiếm sản phẩm
        const products = await db.collection('products').find({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } }, // Tìm kiếm có dấu ở bất kỳ vị trí
                { normalizedTitle: { $regex: normalizedSearch, $options: 'i' } }, // Tìm kiếm không dấu ở bất kỳ vị trí
                { brand: { $regex: searchTerm, $options: 'i' } }, // Tìm kiếm brand
            ],
        }).limit(10).toArray(); // Giới hạn 10 kết quả
        const serializedProducts = products.map(product => {
            const id = product._id ? product._id.toString() : `temp-${Date.now()}`;
            const image = normalizeImageField(product.image);
            const hoverImage = normalizeImageField(product.hoverImage);
            return Object.assign(Object.assign({}, product), { id,
                image,
                hoverImage, href: typeof product.href === 'string' && product.href
                    ? product.href
                    : `/products/${id}` });
        });
        const duration = Date.now() - start;
        console.log(`Search products for term "${searchTerm}": [${serializedProducts.length} items] in ${duration}ms`, serializedProducts);
        return serializedProducts;
    }
    catch (error) {
        console.error(`Error searching products for term "${searchTerm}":`, error);
        throw error;
    }
};
exports.searchProducts = searchProducts;
const getProductsByCategory = async (db, category) => {
    try {
        const start = Date.now();
        const products = await db.collection('products').find({ category }).toArray();
        const serializedProducts = products.map(product => {
            const id = product._id ? product._id.toString() : `temp-${Date.now()}`;
            const image = normalizeImageField(product.image);
            const hoverImage = normalizeImageField(product.hoverImage);
            return Object.assign(Object.assign({}, product), { id,
                image,
                hoverImage, href: typeof product.href === 'string' && product.href
                    ? product.href
                    : `/products/${id}` });
        });
        const duration = Date.now() - start;
        console.log(`Products fetched for category "${category}": [${serializedProducts.length}] items in ${duration}ms`, serializedProducts);
        return serializedProducts;
    }
    catch (error) {
        console.error(`Error fetching products for category "${category}":`, error);
        throw error;
    }
};
exports.getProductsByCategory = getProductsByCategory;
const createProduct = async (db, productData) => {
    try {
        const start = Date.now();
        const normalizedTitle = normalizeVietnamese(productData.title);
        const result = await db.collection('products').insertOne(Object.assign(Object.assign({}, productData), { normalizedTitle, createdAt: new Date() }));
        const newProduct = await db.collection('products').findOne({ _id: result.insertedId });
        if (!newProduct) {
            throw new Error('Failed to retrieve new product');
        }
        const serializedProduct = Object.assign(Object.assign({}, newProduct), { id: newProduct._id.toString(), image: normalizeImageField(newProduct.image), hoverImage: normalizeImageField(newProduct.hoverImage), href: `/products/${newProduct._id.toString()}` });
        const duration = Date.now() - start;
        console.log(`Product created successfully: [${serializedProduct.id}] in ${duration}ms`, serializedProduct);
        return serializedProduct;
    }
    catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};
exports.createProduct = createProduct;
