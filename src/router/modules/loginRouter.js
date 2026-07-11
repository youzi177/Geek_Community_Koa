import Router from 'koa-router';
import loginController from '../../api/loginController.js';
const router = new Router();
router.prefix('/login');
// 找回密码
router.post('/forget', loginController.forget);

export default router;
