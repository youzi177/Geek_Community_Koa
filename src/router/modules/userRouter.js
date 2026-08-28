import Router from 'koa-router'
import UserController from '../../api/UserController.js'
import ContentController from '../../api/ContentController.js'
const router = new Router()
router.prefix('/user')
// 用户签到
router.get('/fav', UserController.userSign)
// 更新用户的基本信息接口
router.post('/basic', UserController.updateUserInfo)
// 修改密码
router.post('/changePassword', UserController.changePassword)
// 设置取消收藏
router.get('/set-collect', UserController.setCollect)
// 获取收藏列表
router.get('/collect', UserController.getCollectByUid)
// 获取发帖记录
router.get('/post', ContentController.getPostByUid)
// 删除发帖
router.get('/delet-post', ContentController.deletePostByUid)
// 获取历史消息
router.get('/getmsg', UserController.getMsg)
// 设置已读消息
router.get('/setmsg', UserController.setMsg)
export default router
