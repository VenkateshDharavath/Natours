const express = require('express');
const { protect, accessOnlyTo } = require('../controllers/authController');
const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });
// const router = express.Router();

router.use(protect); // Make all protected

router
  .route('/')
  .get(getAllReviews)
  .post(accessOnlyTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .delete(accessOnlyTo('user', 'admin'), deleteReview)
  .patch(accessOnlyTo('user'), updateReview);

module.exports = router;
