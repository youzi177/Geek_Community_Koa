import Router from 'koa-router'
import UserController from '../../api/UserController.js'
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
router.get('/collect', UserController.userSign)
export default router
