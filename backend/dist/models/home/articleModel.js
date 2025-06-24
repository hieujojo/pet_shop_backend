"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArticles = exports.createArticle = exports.getAllArticles = void 0;
const getAllArticles = async (db) => {
    try {
        const start = Date.now();
        const articles = await db.collection('articles').find().toArray();
        const serializedArticles = articles.map(article => (Object.assign(Object.assign({}, article), { _id: article._id.toString() })));
        const duration = Date.now() - start;
        console.log(`Articles fetched successfully: [${serializedArticles.length} items] in ${duration}ms`, serializedArticles);
        return serializedArticles;
    }
    catch (error) {
        console.error('Error fetching articles:', error);
        throw error;
    }
};
exports.getAllArticles = getAllArticles;
const createArticle = async (db, articleData) => {
    try {
        const start = Date.now();
        const result = await db.collection('articles').insertOne(Object.assign(Object.assign({}, articleData), { created_at: articleData.created_at || new Date() }));
        const newArticle = Object.assign(Object.assign({}, articleData), { _id: result.insertedId.toString() });
        const duration = Date.now() - start;
        console.log(`Article created successfully in ${duration}ms`, newArticle);
        return newArticle;
    }
    catch (error) {
        console.error('Error creating article:', error);
        throw error;
    }
};
exports.createArticle = createArticle;
const createArticles = async (db, articlesData) => {
    try {
        const start = Date.now();
        const articlesToInsert = articlesData.map(article => (Object.assign(Object.assign({}, article), { created_at: article.created_at || new Date() })));
        const result = await db.collection('articles').insertMany(articlesToInsert);
        const insertedIds = Object.values(result.insertedIds);
        const newArticles = articlesToInsert.map((article, index) => (Object.assign(Object.assign({}, article), { _id: insertedIds[index].toString() })));
        const duration = Date.now() - start;
        console.log(`Articles created successfully: [${newArticles.length} items] in ${duration}ms`, newArticles);
        return newArticles;
    }
    catch (error) {
        console.error('Error creating articles:', error);
        throw error;
    }
};
exports.createArticles = createArticles;
