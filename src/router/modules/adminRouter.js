import Router from 'koa-router'
// import adminController from '../../api/AdminController'
import contentController from '../../api/ContentController'
import UserController from '../../api/UserController'
const router = new Router()

router.prefix('/admin')
// 标签页面
// 获取标签列表
router.get('/getTags', contentController.getTags)

// 添加标签
router.post('/addTag', contentController.addTag)

// 删除标签
router.get('/removeTag', contentController.removeTag)

// 编辑标签
router.post('/editTag', contentController.updateTag)
// 用户管理
router.get('/users', UserController.getUsers)
// 删除用户
router.post('/delete-users', UserController.deleteUserById)
// 更新用户信息
router.post('/update-users', UserController.updateUserById)
// 异步校验用户名
router.get('/checkusername', UserController.checkUsername)
// 异步校验昵称
router.get('/checkname', UserController.checkName)
// 新增用户
router.post('/add-user', UserController.addUser)
export default router
