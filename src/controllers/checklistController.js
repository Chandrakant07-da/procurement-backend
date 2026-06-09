const Checklist = require('../models/Checklist');
const Submission = require('../models/Submission');
const Order = require('../models/Order');

// ==========================================
// A. CHECKLIST TEMPLATES CRUD
// ==========================================

// 1. Create Checklist Template (PM or Admin only)
exports.createTemplate = async (req, res) => {
  try {
    const { title, fields } = req.body;
    const checklist = await Checklist.create({
      title,
      createdBy: req.user._id,
      fields
    });
    res.status(201).json({ success: true, data: checklist });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 2. Get all Checklist Templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Checklist.find()
      .populate('createdBy', 'email role mobile');
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Checklist Template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Checklist.findById(id)
      .populate('createdBy', 'email role mobile');

    if (!template) {
      return res.status(404).json({ error: 'Checklist template not found' });
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Update Checklist Template (PM or Admin only)
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fields } = req.body;

    const template = await Checklist.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Checklist template not found' });
    }

    // Authorization: Only admin or the creator of the template can update it
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this template' });
    }

    if (title !== undefined) template.title = title;
    if (fields !== undefined) template.fields = fields;

    await template.save();
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 5. Delete Checklist Template (PM or Admin only)
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Checklist.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Checklist template not found' });
    }

    // Authorization: Only admin or the creator of the template can delete it
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this template' });
    }

    await Checklist.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Checklist template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// B. CHECKLIST SUBMISSIONS CRUD
// ==========================================

// 1. Submit Inspection Answers (IM only)
exports.submitChecklist = async (req, res) => {
  try {
    const { orderId } = req.body;
    let submittedAnswers;

    if (!req.body.answers) {
       return res.status(400).json({ error: 'Answers payload is required' });
    }

    if (Array.isArray(req.body.answers)) {
      submittedAnswers = req.body.answers;
    } else if (typeof req.body.answers === 'string') {
      try {
        submittedAnswers = JSON.parse(req.body.answers);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid answers format. The "answers" field must be a valid JSON array string.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid answers format.' });
    }

    if (!Array.isArray(submittedAnswers)) {
      return res.status(400).json({ error: 'Answers must be an array.' });
    }

    const order = await Order.findById(orderId).populate('checklistTemplateId');
    if (!order || !order.checklistTemplateId) {
      return res.status(404).json({ error: 'Order or linked checklist not found' });
    }

    const templateFields = order.checklistTemplateId.fields;
    const finalAnswers = [];

    for (const field of templateFields) {
      const providedAnswer = submittedAnswers.find(a => a.questionLabel === field.label);
      let finalValue = null;

      if (field.type === 'file') {
        if (req.file) {
          finalValue = `/uploads/${req.file.filename}`;
        } else if (field.isRequired) {
           return res.status(400).json({ error: `File upload required for: ${field.label}` });
        }
      } else {
        if (!providedAnswer && field.isRequired) {
          return res.status(400).json({ error: `Missing required field: ${field.label}` });
        }
        finalValue = providedAnswer ? providedAnswer.value : null;
      }

      finalAnswers.push({
        questionLabel: field.label,
        type: field.type,
        value: finalValue
      });
    }

    const submission = await Submission.create({
      orderId,
      inspectionManagerId: req.user._id,
      answers: finalAnswers
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get all submissions (Admin/PM see all, IM sees their own)
exports.getSubmissions = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'inspection_manager') {
      filter.inspectionManagerId = req.user._id;
    } // Admin & PM see all submissions

    const submissions = await Submission.find(filter)
      .populate('orderId')
      .populate('inspectionManagerId', 'email role mobile');

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id)
      .populate('orderId')
      .populate('inspectionManagerId', 'email role mobile');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Authorization check
    if (req.user.role === 'inspection_manager' && submission.inspectionManagerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this submission' });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Update Submission (IM or Admin only)
exports.updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Authorization: Only the creator of the submission or admin can update it
    if (req.user.role !== 'admin' && submission.inspectionManagerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this submission' });
    }

    // Parse answers if provided in body
    if (req.body.answers) {
      let submittedAnswers;
      if (Array.isArray(req.body.answers)) {
        submittedAnswers = req.body.answers;
      } else if (typeof req.body.answers === 'string') {
        try {
          submittedAnswers = JSON.parse(req.body.answers);
        } catch (parseErr) {
          return res.status(400).json({ error: 'Invalid answers format.' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid answers format.' });
      }

      // Merge / Update answers
      const updatedAnswers = submission.answers.map(ans => {
        const matchingAnswer = submittedAnswers.find(sa => sa.questionLabel === ans.questionLabel);
        
        if (ans.type === 'file' && req.file) {
          return { ...ans, value: `/uploads/${req.file.filename}` };
        }
        
        if (matchingAnswer) {
          return { ...ans, value: matchingAnswer.value };
        }
        
        return ans;
      });

      submission.answers = updatedAnswers;
    } else if (req.file) {
      // If only file is uploaded, update the first 'file' field
      const updatedAnswers = submission.answers.map(ans => {
        if (ans.type === 'file') {
          return { ...ans, value: `/uploads/${req.file.filename}` };
        }
        return ans;
      });
      submission.answers = updatedAnswers;
    }

    await submission.save();
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 5. Delete Submission (Admin only)
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findByIdAndDelete(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.status(200).json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};