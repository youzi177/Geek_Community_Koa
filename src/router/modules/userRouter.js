import Router from 'koa-router'
import UserController from '../../api/UserController.js'
const router = new Router()
router.prefix('/user')
// 用户签到
router.get('/fav', UserController.userSign)
// 更新用户的基本信息接口
router.post('/basic', UserController.updateUserInfo)
export default router
