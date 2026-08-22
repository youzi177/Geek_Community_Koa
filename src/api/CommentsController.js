import Comments from '../model/Comments'
import Post from '../model/Post'
import User from '../model/User'
import { cheackCode, getJWTPayload } from '../common/utils'
import CommentsHands from '../model/CommentsHands'
// 判断用户是否被禁言
const canReply = async (ctx) => {
  let result = false
  const obj = await getJWTPayload(ctx.header.authorization)
  if (typeof obj._id === 'undefined') {
    return result
  } else {
    const user = await User.findByID(obj._id)
    if (user.status === '0') {
      result = true
    }
    return result
  }
}
class CommentsController {
  // 获取评论列表
  async getComments (ctx) {
    const params = ctx.query
    const tid = params.tid
    const page = params.page ? params.page : 0
    const limit = params.limit ? params.limit : 0
    let result = await Comments.getCommentsList(tid, page, limit)
    // 判断用户是否已经登录，已经登录才去判断点赞信息
    const auth = ctx.header.authorization
    // console.log('🚀 ~ CommentsController ~ getComments ~ auth:', auth)
    const obj = auth ? await getJWTPayload(auth) : {}
    // console.log('🚀 ~ CommentsController ~ getComments ~ obj:', obj)
    if (obj._id) {
      result = result.map(item => item.toJSON())
      for (let i = 0; i < result.length; i++) {
        const item = result[i]
        item.handed = '0'
        const commentsHands = await CommentsHands.findOne({ cid: item._id, uid: obj._id })
        if (commentsHands && commentsHands.cid) {
          if (commentsHands.uid === obj._id) {
            item.handed = '1'
          }
        }
      }
    }
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
    const check = await canReply(ctx)
    if (!check) {
      ctx.body = {
        code: 500,
        msg: '用户已经被禁言'
      }
      return
    }
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
    // 更新评论数
    const updatePostresult = await Post.updateOne({ _id: body.tid }, {
      $inc: {
        answer: 1
      }
    })
    if (comment._id && updatePostresult.acknowledged) {
      ctx.body = {
        code: 200,
        data: comment,
        msg: '评论成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '评论失败'
      }
    }
  }

  // 更新评论
  async updateComment (ctx) {
    const check = await canReply(ctx)
    if (!check) {
      ctx.body = {
        code: 500,
        msg: '用户已经被禁言'
      }
      return
    }
    const { body } = ctx.request
    const result = await Comments.updateOne({ _id: body.cid }, { $set: body })
    ctx.body = {
      code: 200,
      data: result,
      msg: '修改成功'
    }
  }

  // 采纳最佳答案
  async setBest (ctx) {
    const params = ctx.query
    // 用户权限判断，判断是否有权采纳，否则谁都可以采纳自己都为最佳答案，post.uid -> header.id
    const obj = await getJWTPayload(ctx.header.authorization)
    if (typeof obj === 'undefined' && obj._id !== '') {
      ctx.body = {
        code: '401',
        msg: '用户未登录，或者未授权'
      }
      return
    }
    const post = await Post.findOne({ _id: params.tid })
    if (post.uid === obj._id && post.isEnd === '0') {
      // 是作者本人，并且没有结帖，可以设置isBest
      // 贴子更新为已结
      const result = await Post.updateOne({ _id: params.tid }, {
        $set: {
          isEnd: '1'
        }
      })
      // 评论更新为采纳
      const result1 = await Comments.updateOne({ _id: params.cid }, {
        $set: {
          isBest: '1'
        }
      })
      // console.log('result', result)
      // console.log('result1', result1)
      //  matchedCount是更新一条，acknowledged是否成功 api变化了，result.ok变成result.acknowledged返回的true
      if (result.acknowledged && result1.acknowledged) {
        // 把积分值给采纳的用户
        const comment = await Comments.findByCid(params.cid)
        const result2 = await User.updateOne({ _id: comment.cuid }, { $inc: { favs: parseInt(post.fav) } })
        if (result2.acknowledged) {
          ctx.body = {
            code: 200,
            msg: '采纳成功',
            data: result2
          }
        } else {
          ctx.body = {
            code: 500,
            msg: '设置最佳答案-更新用户失败'
          }
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '采纳失败',
          data: { ...result, ...result1 }
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '贴子已经结帖'
      }
    }
  }

  // 点赞评论
  async setHands (ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.header.authorization)
    // 判断用户是否已经点赞
    const temp = await CommentsHands.find({ cid: params.cid, uid: obj._id })
    // console.log('🚀 ~ CommentsController ~ setHands ~ temp:', temp)

    if (temp.length > 0) {
      ctx.body = {
        code: 500,
        msg: '您已经点赞，请勿重复点赞'
      }
      return
    }
    // 新增一条点赞记录
    const newHands = new CommentsHands({
      cid: params.cid,
      uid: obj._id
    })
    const data = await newHands.save()
    // 更新comments表中对应记录的hands信息+1
    const result = await Comments.updateOne({ _id: params.cid }, {
      $inc: {
        hands: 1
      }
    })
    if (result.acknowledged) {
      ctx.body = {
        code: 200,
        data,
        msg: '点赞成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '点赞失败'
      }
    }
  }

  // 获取用户最近的评论记录
  async getCommentPublic (ctx) {
    const params = ctx.query
    const result = await Comments.getCommetsPublic(params.uid, params.page, parseInt(params.limit))
    if (result.length > 0) {
      ctx.body = {
        code: 200,
        data: result,
        msg: '查询最近的评论记录成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '查询评论记录失败！'
      }
    }
  }
}

export default new CommentsController()
