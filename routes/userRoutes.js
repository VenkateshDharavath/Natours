const express = require('express');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  accessOnlyTo,
} = require('../controllers/authController');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require('../controllers/userController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);

// Only authenticated users only be able to access below routes.
router.use(protect);

router.get('/me', getMe, getUser);
router.patch('/resetPassword/:token', resetPassword);
router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', protect, deleteMe);

// Only Admins will have access to the routes below
router.use(accessOnlyTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
