import express, { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { getArticles, createArticleHandler } from '../../controllers/home/articleController';

interface CustomRequest extends Request {
  db: any;
}

const getArticlesHandler: RequestHandler = async (req, res: Response, next: NextFunction) => {
  const customReq = req as CustomRequest;
  try {
    await getArticles(customReq, res);
    console.log('Finished handling GET /api/articles');
  } catch (error) {
    console.error('Error in getArticlesHandler:', error);
    next(error);
  }
};

const createArticleRouteHandler: RequestHandler = async (req, res: Response, next: NextFunction) => {
  const customReq = req as CustomRequest;
  try {
    await createArticleHandler(customReq, res);
    console.log('Finished handling POST /api/articles');
  } catch (error) {
    console.error('Error in createArticleRouteHandler:', error);
    next(error);
  }
};

const router = express.Router();

router.get('/', getArticlesHandler);
router.post('/', createArticleRouteHandler);

export default router;