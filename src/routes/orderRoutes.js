const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  linkChecklistToOrder,
  deleteOrder
} = require('../controllers/orderController');

// All order routes require authentication
router.use(protect);

router.post('/', authorize('procurement_manager'), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id', authorize('admin', 'procurement_manager'), updateOrder);
router.patch('/:id/status', authorize('admin', 'procurement_manager', 'inspection_manager'), updateOrderStatus);
router.post('/link-checklist', authorize('procurement_manager'), linkChecklistToOrder);
router.delete('/:id', authorize('admin', 'procurement_manager'), deleteOrder);

module.exports = router;
