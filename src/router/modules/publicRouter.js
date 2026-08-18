import Router from 'koa-router'
import PublicController from '../../api/PublicController.js'
import contentController from '../../api/ContentController'
import UserController from '../../api/UserController.js'
import commentsController from '../../api/CommentsController.js'
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
// 确认修改邮件
router.get('/reset-email', UserController.updateUsername)
// 获取文章详情
router.get('/content/detail', contentController.getDetail)
// 获取评论列表
router.get('/comments', commentsController.getComments)
export default router
