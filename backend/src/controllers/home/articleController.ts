import { Request, Response } from 'express';
import { getAllArticles, createArticle, createArticles } from '../../models/home/articleModel';

interface CustomRequest extends Request {
  db: any;
}

export const getArticles = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Database connection is not available');
    }
    const articles = await getAllArticles(req.db);
    console.log('Controller received articles:', articles);
    if (!Array.isArray(articles)) {
      throw new Error('Articles data is not an array');
    }
    res.status(200).json(articles);
    console.log('Response sent for getArticles');
  } catch (error: any) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Failed to fetch articles: ' + error.message });
  }
};

export const createArticleHandler = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Database connection is not available');
    }

    const articlesData = Array.isArray(req.body) ? req.body : [req.body];

    for (const article of articlesData) {
      const { title, description, name, image, category } = article;
      if (!title || !description || !name || !image || !category) {
        throw new Error('Title, description, name, image, and category are required for each article');
      }
    }

    const newArticles = await createArticles(req.db, articlesData);
    res.status(201).json({ message: 'Articles created successfully', articles: newArticles });
    console.log('Response sent for createArticle');
  } catch (error: any) {
    console.error('Controller error in createArticle:', error);
    res.status(500).json({ error: 'Failed to create articles: ' + error.message });
  }
};