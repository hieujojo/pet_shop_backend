import { Request, Response } from 'express';
import { getAllProducts, searchProducts, getProductsByCategory, getProductById, createProduct } from '../../models/home/productModel';

interface CustomRequest extends Request {
  db?: any;
}

export const getProducts = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
    }
    const { category } = req.query;
    let products;
    if (category && typeof category === 'string') {
      products = await getProductsByCategory(req.db, category);
    } else {
      products = await getAllProducts(req.db);
    }
    res.status(200).json(products);
  } catch (error: any) {
    console.error('Lỗi controller:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách sản phẩm: ' + error.message });
  }
};

export const searchProductsHandler = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
    }
    const { search } = req.query;
    if (!search || typeof search !== 'string') {
      throw new Error('Vui lòng nhập từ khóa tìm kiếm');
    }
    const products = await searchProducts(req.db, search);
    res.status(200).json(products);
  } catch (error: any) {
    console.error('Lỗi controller:', error);
    res.status(500).json({ error: 'Không thể tìm kiếm sản phẩm: ' + error.message });
  }
};

export const getProductByIdHandler = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
    }
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      throw new Error('ID sản phẩm là bắt buộc');
    }
    const product = await getProductById(req.db, id);
    res.status(200).json(product);
  } catch (error: any) {
    console.error('Lỗi controller:', error);
    if (error.message === 'Product not found') {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    } else {
      res.status(500).json({ error: 'Không thể lấy thông tin sản phẩm: ' + error.message });
    }
  }
};

export const createProductHandler = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Kết nối cơ sở dữ liệu không khả dụng');
    }
    const productData = req.body;
    if (!productData.title || !productData.price || !productData.category) {
      throw new Error('Tiêu đề, giá và danh mục là bắt buộc');
    }
    const newProduct = await createProduct(req.db, productData);
    res.status(201).json(newProduct);
  } catch (error: any) {
    console.error('Lỗi controller:', error);
    res.status(500).json({ error: 'Không thể tạo sản phẩm: ' + error.message });
  }
};