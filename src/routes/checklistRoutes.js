const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { checklistTemplateSchema } = require('../utils/validationSchemas');

const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  submitChecklist,
  getSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission
} = require('../controllers/checklistController');

// All routes require authentication
router.use(protect);

// --- Checklist Templates Routes ---
router.post('/templates', authorize('procurement_manager'), validate(checklistTemplateSchema), createTemplate);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.put('/templates/:id', authorize('admin', 'procurement_manager'), updateTemplate);
router.delete('/templates/:id', authorize('admin', 'procurement_manager'), deleteTemplate);

// --- Checklist Submissions Routes ---
router.post('/submissions', authorize('inspection_manager'), upload.single('halfLoadingImage'), submitChecklist);
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmissionById);
router.put('/submissions/:id', authorize('admin', 'inspection_manager'), upload.single('halfLoadingImage'), updateSubmission);
router.delete('/submissions/:id', authorize('admin'), deleteSubmission);

module.exports = router;
