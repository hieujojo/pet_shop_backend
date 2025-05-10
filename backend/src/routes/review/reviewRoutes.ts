import express from 'express';
import { getReviews, postReview } from '../../controllers/review/reviewController';

const router = express.Router();

router.get('/', getReviews);
router.post('/', postReview);

export default router;