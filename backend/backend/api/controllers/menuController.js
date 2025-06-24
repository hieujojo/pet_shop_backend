"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const menuModel_1 = __importDefault(require("../models/menuModel"));
const getMenuItems = async (req, res) => {
    try {
        const { locale } = req.query;
        if (!locale) {
            return res.status(400).json({ error: 'Locale is required' });
        }
        const menuItems = await menuModel_1.default.getMenuItems(req.db, locale); // Truyền req.db
        res.status(200).json(menuItems);
    }
    catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ error: 'Failed to fetch menu items: ' + error.message });
    }
};
exports.default = { getMenuItems };
