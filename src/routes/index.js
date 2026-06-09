const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate')

// Controllers
const { login, registerUser } = require('../controllers/authController');
const { createOrder, updateOrderStatus, linkChecklistToOrder } = require('../controllers/orderController');
const { createTemplate, submitChecklist } = require('../controllers/checklistController');

// --- Validation Scheman ---
const { registerSchema, checklistTemplateSchema } = require('../utils/validationSchemas');

// --- Auth Routes ---
router.post('/auth/login', login);
router.post('/auth/register', validate(registerSchema), registerUser);

// --- Order Routes ---
router.post('/orders', protect, authorize('procurement_manager'), createOrder);
router.patch('/orders/:orderId/status', protect, authorize('admin', 'procurement_manager', 'inspection_manager'), updateOrderStatus);
router.post('/orders/link-checklist', protect, authorize('procurement_manager'), linkChecklistToOrder);

// --- Checklist Routes ---
// PM creates the JSON template
router.post('/checklists/template', protect, authorize('procurement_manager'), validate(checklistTemplateSchema), createTemplate);

// IM submits answers (Uses Multer for the file upload requirement)
router.post('/checklists/submit', 
  protect, 
  authorize('inspection_manager'), 
  upload.single('halfLoadingImage'), // Intercepts the file stream
  submitChecklist
);

module.exports = router;