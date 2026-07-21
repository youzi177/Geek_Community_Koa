import Router from 'koa-router'
import loginController from '../../api/loginController.js'
const router = new Router()
router.prefix('/login')
// 找回密码
router.post('/forget', loginController.forget)
// 注册
router.post('/reg', loginController.reg)
// 登录
router.post('/login', loginController.login)

export default router
