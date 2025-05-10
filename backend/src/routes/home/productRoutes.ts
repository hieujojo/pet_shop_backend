import express, { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { getProducts, searchProductsHandler, getProductByIdHandler, createProductHandler } from '../../controllers/home/productController';

interface CustomRequest extends Request {
  db?: any;
}

const getProductsHandler: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await getProducts(customReq, res);
  } catch (error) {
    next(error);
  }
};

const searchProductsHandlerWrapper: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await searchProductsHandler(customReq, res);
  } catch (error) {
    next(error);
  }
};

const getProductByIdHandlerWrapper: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await getProductByIdHandler(customReq, res);
  } catch (error) {
    next(error);
  }
};

// Thêm wrapper cho createProductHandler
const createProductHandlerWrapper: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await createProductHandler(customReq, res);
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

router.get('/', getProductsHandler);
router.get('/search', searchProductsHandlerWrapper);
router.get('/:id', getProductByIdHandlerWrapper);
router.post('/', createProductHandlerWrapper); // Thêm route POST

export default router;