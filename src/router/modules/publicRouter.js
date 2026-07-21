import Router from 'koa-router'
import publictController from '../../api/publicController.js'
const router = new Router()
router.prefix('/public')
// 获取图片验证码
router.get('/getCaptcha', publictController.getCaptcha)

export default router
