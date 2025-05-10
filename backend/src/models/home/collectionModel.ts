import { Db } from 'mongodb';

export const getAllCollections = async (db: Db): Promise<any[]> => {
  try {
    const start = Date.now();
    const collections = await db.collection('collections').find().toArray();
    const serializedCollections = collections.map(collection => ({
      ...collection,
      _id: collection._id.toString(),
    }));
    const duration = Date.now() - start;
    console.log(`Collections fetched successfully: [${serializedCollections.length} items] in ${duration}ms`, serializedCollections);
    return serializedCollections;
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};