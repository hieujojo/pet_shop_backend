import { Db } from 'mongodb';

export const getAllArticles = async (db: Db): Promise<any[]> => {
  try {
    const start = Date.now();
    const articles = await db.collection('articles').find().toArray();
    const serializedArticles = articles.map(article => ({
      ...article,
      _id: article._id.toString(),
    }));
    const duration = Date.now() - start;
    console.log(`Articles fetched successfully: [${serializedArticles.length} items] in ${duration}ms`, serializedArticles);
    return serializedArticles;
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

export const createArticle = async (
  db: Db,
  articleData: { title: string; description: string; name: string; image: string; category: string; created_at?: Date }
): Promise<any> => {
  try {
    const start = Date.now();
    const result = await db.collection('articles').insertOne({
      ...articleData,
      created_at: articleData.created_at || new Date(),
    });
    const newArticle = {
      ...articleData,
      _id: result.insertedId.toString(),
    };
    const duration = Date.now() - start;
    console.log(`Article created successfully in ${duration}ms`, newArticle);
    return newArticle;
  } catch (error: any) {
    console.error('Error creating article:', error);
    throw error;
  }
};

export const createArticles = async (
  db: Db,
  articlesData: Array<{ title: string; description: string; name: string; image: string; category: string; created_at?: Date }>
): Promise<any[]> => {
  try {
    const start = Date.now();
    const articlesToInsert = articlesData.map(article => ({
      ...article,
      created_at: article.created_at || new Date(),
    }));

    const result = await db.collection('articles').insertMany(articlesToInsert);
    const insertedIds = Object.values(result.insertedIds);
    const newArticles = articlesToInsert.map((article, index) => ({
      ...article,
      _id: insertedIds[index].toString(),
    }));

    const duration = Date.now() - start;
    console.log(`Articles created successfully: [${newArticles.length} items] in ${duration}ms`, newArticles);
    return newArticles;
  } catch (error: any) {
    console.error('Error creating articles:', error);
    throw error;
  }
};