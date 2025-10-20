import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect); // All routes require authentication

// User routes can be added here as needed
// For now, user info is handled through auth.controller.ts (getMe)

export default router;
