import Router from 'koa-router'
import LoginController from '../../api/LoginController.js'
const router = new Router()
router.prefix('/login')
// 找回密码
router.post('/forget', LoginController.forget)
// 注册
router.post('/reg', LoginController.reg)
// 登录
router.post('/login', LoginController.login)
// 重置密码
router.post('/reset', LoginController.reset)
export default router
