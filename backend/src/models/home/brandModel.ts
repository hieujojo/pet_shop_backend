import { Db } from 'mongodb';

export const getAllBrands = async (db: Db): Promise<any[]> => {
  try {
    const start = Date.now();
    const brands = await db.collection('brands').find().toArray();
    const serializedBrands = brands.map(brand => ({
      ...brand,
      _id: brand._id.toString(),
    }));
    const duration = Date.now() - start;
    console.log(`Brands fetched successfully: [${serializedBrands.length} items] in ${duration}ms`, serializedBrands);
    return serializedBrands;
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    throw error;
  }
};