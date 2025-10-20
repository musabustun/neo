import express from 'express';
import {
  getMenuItems,
  getMenuItem,
  getCategories,
} from '../controllers/menu.controller';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

export default router;
