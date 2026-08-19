import Router from 'koa-router'
import commentsController from '../../api/CommentsController'
const router = new Router()
router.prefix('/comments')
// 添加评论
router.post('/reply', commentsController.addComments)
// 更新评论
router.post('/update', commentsController.updateComment)
// 采纳最佳答案
router.get('/accept', commentsController.setBest)
export default router
