import Router from 'koa-router'
import contentController from '../../api/ContentController'
const router = new Router()
router.prefix('/content')
// 上传图片
router.post('/upload', contentController.uploadImg)
// 发表新帖
router.post('/add', contentController.addPost)
// 更新贴子
router.post('/update', contentController.updatePost)
// 删除贴子，后台系统接口
router.get('/delete', contentController.deletePostByTid)
export default router
