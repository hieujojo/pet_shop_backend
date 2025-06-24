"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArticleHandler = exports.getArticles = void 0;
const articleModel_1 = require("../../models/home/articleModel");
const getArticles = async (req, res) => {
    try {
        if (!req.db) {
            throw new Error('Database connection is not available');
        }
        const articles = await (0, articleModel_1.getAllArticles)(req.db);
        console.log('Controller received articles:', articles);
        if (!Array.isArray(articles)) {
            throw new Error('Articles data is not an array');
        }
        res.status(200).json(articles);
        console.log('Response sent for getArticles');
    }
    catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ error: 'Failed to fetch articles: ' + error.message });
    }
};
exports.getArticles = getArticles;
const createArticleHandler = async (req, res) => {
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
        const newArticles = await (0, articleModel_1.createArticles)(req.db, articlesData);
        res.status(201).json({ message: 'Articles created successfully', articles: newArticles });
        console.log('Response sent for createArticle');
    }
    catch (error) {
        console.error('Controller error in createArticle:', error);
        res.status(500).json({ error: 'Failed to create articles: ' + error.message });
    }
};
exports.createArticleHandler = createArticleHandler;
