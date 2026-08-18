import Comments from '../model/Comments'
// import Post from '../model/Post'
// import User from '../model/User'

class CommentsController {
  // 获取评论列表
  async getComments (ctx) {
    const params = ctx.query
    const tid = params.tid
    const page = params.page ? params.page : 0
    const limit = params.limit ? params.limit : 0
    const result = await Comments.getCommentsList(tid, page, limit)
    const total = await Comments.queryCount(tid)
    ctx.body = {
      code: 200,
      data: result,
      total,
      msg: '获取评论列表成功'
    }
  }
}

export default new CommentsController()
