import express from 'express';
import {
  startSession,
  endSession,
  getActiveSession,
  getSessionHistory,
  getSession,
} from '../controllers/session.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/start', startSession);
router.post('/:id/end', endSession);
router.get('/active', getActiveSession);
router.get('/history', getSessionHistory);
router.get('/:id', getSession);

export default router;
