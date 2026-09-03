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

export default router
