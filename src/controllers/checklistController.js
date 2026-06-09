const Checklist = require('../models/Checklist');
const Submission = require('../models/Submission');
const Order = require('../models/Order');

// 1. PM Creates the Template (The "Question Paper")
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

// 2. IM Submits the Answer
exports.submitChecklist = async (req, res) => {
  try {
    const { orderId } = req.body;
    let submittedAnswers;

    // Parse the answers payload.
    // When sent via multipart/form-data (Multer), req.body.answers arrives as a JSON string.
    // When sent via application/json, it may already be a parsed array.
    if (!req.body.answers) {
       return res.status(400).json({ error: 'Answers payload is required' });
    }

    if (Array.isArray(req.body.answers)) {
      // Already parsed (e.g. sent as application/json)
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

    // Design Pattern: Data Transfer Object (DTO) Mapping / Validation
    // Validate incoming answers against the template requirements
    for (const field of templateFields) {
      const providedAnswer = submittedAnswers.find(a => a.questionLabel === field.label);
      
      let finalValue = null;

      if (field.type === 'file') {
        // If it's a file, check if multer processed it
        if (req.file) {
          finalValue = `/uploads/${req.file.filename}`; // Link the file stream
        } else if (field.isRequired) {
           return res.status(400).json({ error: `File upload required for: ${field.label}` });
        }
      } else {
        if (!providedAnswer && field.isRequired) {
          return res.status(400).json({ error: `Missing required field: ${field.label}` });
        }
        finalValue = providedAnswer ? providedAnswer.value : null;
      }

      // Snapshot the question and answer together
      finalAnswers.push({
        questionLabel: field.label,
        type: field.type,
        value: finalValue
      });
    }

    // Save the snapshot (independent of future template updates)
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