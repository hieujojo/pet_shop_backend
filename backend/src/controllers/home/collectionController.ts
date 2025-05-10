import { Request, Response } from 'express';
import { getAllCollections } from '../../models/home/collectionModel';

interface CustomRequest extends Request {
  db: any; 
}

export const getCollections = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      console.log('req.db is undefined in getCollections');
      throw new Error('Database connection is not available');
    }
    console.log('req.db in getCollections:', req.db);
    const collections = await getAllCollections(req.db);
    res.status(200).json(collections);
  } catch (error: any) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Failed to fetch collections: ' + error.message });
  }
};