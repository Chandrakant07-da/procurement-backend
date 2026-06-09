const express = require('express');
const router = express.Router();
const { login, registerUser } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema } = require('../utils/validationSchemas');

router.post('/login', login);
router.post('/register', validate(registerSchema), registerUser);

module.exports = router;
