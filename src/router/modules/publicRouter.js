import Router from 'koa-router'
import PublicController from '../../api/PublicController.js'
import contentController from '../../api/ContentController'
const router = new Router()
router.prefix('/public')
// 获取图片验证码
router.get('/getCaptcha', PublicController.getCaptcha)
// 获取文章列表
router.get('/list', contentController.getPostList)
export default router
