import { Router } from 'express';
import controller from '../controllers/enrollmentController.js';
const router = Router();
router.route('/').get(controller.list).post(controller.create);
router.route('/:id').get(controller.find).put(controller.update).delete(controller.remove);
export default router;
