import express from 'express';
import {
  getRooms,
  getRoom,
  verifyQRCode,
  getQRCodeImage,
} from '../controllers/room.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/verify-qr', protect, verifyQRCode);
router.get('/:id/qr-image', getQRCodeImage);

export default router;
