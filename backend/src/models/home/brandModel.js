"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBrands = void 0;
const getAllBrands = async (db) => {
    try {
        const start = Date.now();
        const brands = await db.collection('brands').find().toArray();
        const serializedBrands = brands.map(brand => (Object.assign(Object.assign({}, brand), { _id: brand._id.toString() })));
        const duration = Date.now() - start;
        console.log(`Brands fetched successfully: [${serializedBrands.length} items] in ${duration}ms`, serializedBrands);
        return serializedBrands;
    }
    catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
    }
};
exports.getAllBrands = getAllBrands;
