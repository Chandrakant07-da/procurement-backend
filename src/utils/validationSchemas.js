const Joi = require('joi');

// Schema for User Registration
exports.registerSchema = Joi.object({
  role: Joi.string().valid('admin', 'procurement_manager', 'inspection_manager', 'client').required(),
  email: Joi.string().email().optional(),
  mobile: Joi.string().length(10).pattern(/^[0-9]+$/).optional(),
  password: Joi.string().min(6).required(),
  managerId: Joi.string().hex().length(24).optional() // Validate MongoDB ObjectId
}).or('email', 'mobile'); // Ensure at least one is provided

// Schema for creating a Checklist Template
exports.checklistTemplateSchema = Joi.object({
  title: Joi.string().required(),
  fields: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      type: Joi.string().valid('boolean', 'dropdown', 'checkbox', 'file', 'text').required(),
      options: Joi.array().items(Joi.string()).when('type', {
        is: Joi.valid('dropdown', 'checkbox'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      isRequired: Joi.boolean().default(true)
    })
  ).min(1).required()
});