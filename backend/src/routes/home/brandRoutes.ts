import express, { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { getBrands } from '../../controllers/home/brandController';

interface CustomRequest extends Request {
  db: any;
}

const getBrandsHandler: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await getBrands(customReq, res);
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

router.get('/', getBrandsHandler);

export default router;