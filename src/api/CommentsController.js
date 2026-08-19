import Comments from '../model/Comments'
// import Post from '../model/Post'
// import User from '../model/User'
import { cheackCode, getJWTPayload } from '../common/utils'
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

  // 添加评论
  async addComments (ctx) {
    const { body } = ctx.request
    // 验证码验证
    const sid = body.sid // 图片验证码K值
    const code = body.code // 图片验证码
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    if (!result) {
      ctx.body = {
        code: 401,
        msg: '图片验证码不正确，请检查'
      }
      return
    }
    const newComment = new Comments(body)
    const obj = await getJWTPayload(ctx.header.authorization)
    newComment.cuid = obj._id
    const comment = await newComment.save()
    ctx.body = {
      code: 200,
      data: comment,
      msg: '评论成功'
    }
  }

  // 更新评论
  async updateComment (ctx) {
    const { body } = ctx.request
    const result = await Comments.updateOne({ _id: body.cid }, { $set: body })
    ctx.body = {
      code: 200,
      data: result,
      msg: '修改成功'
    }
  }
}

export default new CommentsController()
