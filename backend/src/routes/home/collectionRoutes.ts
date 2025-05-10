import express, { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { getCollections } from '../../controllers/home/collectionController';

interface CustomRequest extends Request {
  db: any;
}

const getCollectionsHandler: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await getCollections(customReq, res);
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

router.get('/', getCollectionsHandler);

export default router;