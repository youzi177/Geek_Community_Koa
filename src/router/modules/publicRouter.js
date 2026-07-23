import Router from 'koa-router'
import PublicController from '../../api/PublicController.js'
import contentController from '../../api/ContentController'
const router = new Router()
router.prefix('/public')
// 获取图片验证码
router.get('/getCaptcha', PublicController.getCaptcha)
// 获取文章列表
router.get('/list', contentController.getPostList)
// 温馨通道
router.get('/tips', contentController.getTips)
// 友情链接
router.get('/links', contentController.getLinks)
// 本周热议
router.get('/topWeek', contentController.getTopWeek)
export default router
