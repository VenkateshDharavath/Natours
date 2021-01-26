const express = require('express');
const {
  aliasTopTours,
  getAllTours,
  getTourStats,
  getMonthlyPlan,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getToursWithin,
  getDistances,
} = require('../controllers/tourController');
const { protect, accessOnlyTo } = require('../controllers/authController');
// const { createReview } = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// POST /tour/34grt543/reviews
// GET /tour/34grt543/reviews
// GET /tour/34grt543/reviews/344kh34j

// router
//   .route('/:tourId/reviews')
//   .post(protect, accessOnlyTo('user'), createReview);

// '/:tourId/reviews' this route is being passed to reviewRouter because it belongs there
router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours); // Aliasing | Adding a middleware to add query parameters
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, accessOnlyTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
// '/tours-within/:distance/center/:latlng/unit/:unit'
// '/tours-within/233/center/-40,45/unit/mi'

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, accessOnlyTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protect, accessOnlyTo('admin', 'lead-guide'), updateTour)
  .delete(protect, accessOnlyTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
