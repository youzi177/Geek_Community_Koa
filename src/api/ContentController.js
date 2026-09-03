import Post from '../model/Post'
import Links from '../model/Links'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import config from '../config'
import { dirExists, cheackCode, getJWTPayload } from '../common/utils'
import UserModel from '../model/User'
import PostModel from '../model/Post'
import UserCollect from '../model/UserCollect'
import PostTags from '../model/PostTags'

class ContentController {
  // 获取文章列表
  async getPostList (ctx) {
    const body = ctx.query
    const sort = body.sort ? body.sort : 'created'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    const options = {}
    // 查 catlog
    if (typeof body.catalog !== 'undefined' && body.catalog !== '') {
      options.catalog = body.catalog
    }
    // 查 置顶
    if (typeof body.isTop !== 'undefined' && body.isTop !== '') {
      options.isTop = body.isTop
    }
    // 查 是否结帖，前端status表isend
    if (typeof body.status !== 'undefined' && body.status !== '') {
      options.isEnd = body.status
    }
    // 查 tag
    if (typeof body.tag !== 'undefined' && body.tag !== '') {
      options.tags = { $elemMatch: { name: body.tag } }
    }
    const result = await Post.getList(options, sort, page, limit)
    const total = await Post.countList(options)
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功',
      total
    }
  }

  // 获取友情链接
  async getLinks (ctx) {
    const result = await Links.find({ type: 'link' })

    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 获取温馨通道
  async getTips (ctx) {
    const result = await Links.find({ type: 'tips' })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 本周热议
  async getTopWeek (ctx) {
    const result = await Post.getTopWeek()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 上传图片的接口
  async uploadImg (ctx) {
    // 取文件
    const file = ctx.request.files.file
    // console.log('🚀 ~ ContentController ~ uploadImg ~ file:', file)
    // console.log('body:', ctx.request.body)
    // console.log('files:', ctx.request.files)
    // 图片名称，格式，存储位置,名称唯一
    // 返回前端一个可以读取的路径
    const ext = file.originalFilename.split('.').pop()// 文件后缀
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
      ctx.body = {
        code: 400,
        msg: '只允许上传 png、jpg、jpeg 格式的图片'
      }
      return
    }
    // console.log('🚀 ~ ContentController ~ uploadImg ~ ext:', ext)
    const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`// 文件夹
    // console.log('🚀 ~ ContentController ~ uploadImg ~ dir:', dir)
    // 判断路劲是否存在，不存在就创建
    await dirExists(dir)
    // 存储文件到指定路径
    // 存放文件，文件名唯一
    const picname = uuidv4()// 文件名
    const destPath = `${dir}/${picname}.${ext}`// 路径+名称+后缀
    const reader = fs.createReadStream(file.filepath)// 读
    const upStream = fs.createWriteStream(destPath)// 写入
    const filePath = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
    // method 1 写入文件
    try {
    // 关键：必须 await，等待流完全写完,比如大文件
      await new Promise((resolve, reject) => {
        reader.pipe(upStream)
        // 监听完成
        upStream.on('finish', resolve)
        // 监听错误（读写任何一方出错都要 reject）
        reader.on('error', reject)
        upStream.on('error', reject)
      })

      // 只有复制成功，才返回成功响应
      ctx.body = {
        code: 200,
        msg: '上传图片成功',
        data: filePath
      }
    } catch (error) {
    // 如果复制失败（比如磁盘满了），删除可能产生的残缺文件
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath)
      }
      ctx.status = 500
      ctx.body = {
        code: 500,
        msg: '文件存储失败：' + error.message
      }
    }
  }

  // 发表新帖
  async addPost (ctx) {
    const { body } = ctx.request
    // 验证码验证
    const sid = body.sid // 图片验证码K值
    const code = body.code // 图片验证码
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    if (result) {
      const obj = await getJWTPayload(ctx.header.authorization)
      // 判断用户的积分是否足够发帖，
      const user = await UserModel.findById({ _id: obj._id })
      if (user.favs < body.fav) {
        ctx.body = {
          code: 501,
          msg: '积分不足'
        }
      } else {
        // 减去积分
        await UserModel.updateOne(
          { _id: obj._id },
          {
            $inc: {
              favs: -body.fav
            }
          }
        )
        // 保存新帖
        const newPost = new PostModel(body)
        newPost.uid = obj._id
        const result = await newPost.save()
        ctx.body = {
          code: 200,
          data: result,
          msg: '成功保存文章'
        }
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查'
      }
    }
  }

  // 获取文章详情
  async getDetail (ctx) {
    const parms = ctx.query
    if (!parms.tid) {
      ctx.body = {
        code: 500,
        msg: '文章标题为空',
      }
      return
    }
    // 更新文章阅读计数
    const result = await Post.updateOne({ _id: parms.tid }, {
      $inc: { reads: 1 }
    })
    const post = await Post.findByTid(parms.tid)
    // 判断用户是否登录
    let isFav = false
    if (typeof ctx.header.authorization !== 'undefined' && ctx.header.authorization !== '') {
      const obj = await getJWTPayload(ctx.header.authorization)
      const userCollert = await UserCollect.findOne({
        uid: obj._id,
        tid: parms.tid
      })
      // 用户是否收藏
      if (userCollert && userCollert.tid) {
        isFav = true
      }
    }
    // 插入isFav
    const newpost = post.toJSON()
    newpost.isFav = isFav
    if (post._id && result.acknowledged) {
      // const result = rename(post.toJSON(), 'uid', 'user')// 把查询的uid改名为user
      ctx.body = {
        code: 200,
        data: newpost,
        msg: '成功获取文章详情'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '获取文章详情失败'
      }
    }
  }

  // 更新贴子V1，存在安全风险
  // async updatePost (ctx) {
  //   const { body } = ctx.request
  //   // 验证码验证
  //   const sid = body.sid // 图片验证码K值
  //   const code = body.code // 图片验证码
  //   // 验证图片验证码的时效性、正确性
  //   const result = await cheackCode(sid, code)
  //   if (result) {
  //     const obj = await getJWTPayload(ctx.header.authorization)
  //     // 判断贴子的作者是否为本人
  //     // 判断贴子是都结帖
  //     const post = await Post.findOne({ _id: body.tid })
  //     if (post.uid === obj._id && post.isEnd === '0') {
  //       // 存在风险
  //       const result = await Post.updateOne({ _id: body.tid }, body)
  //       if (result.acknowledged) {
  //         ctx.body = {
  //           code: 200,
  //           data: result,
  //           msg: '更新贴子成功'
  //         }
  //       } else {
  //         ctx.body = {
  //           code: 500,
  //           msg: '更新贴子失败'
  //         }
  //       }
  //     } else {
  //       ctx.body = {
  //         code: 401,
  //         msg: '没有操作的权限'
  //       }
  //     }
  //   } else {
  //     ctx.body = {
  //       code: 401,
  //       msg: '图片验证码错误，请检查'
  //     }
  //   }
  // }
  // 更新贴子V2
  async updatePost (ctx) {
    const { body } = ctx.request
    // 取出图片验证码 K 值和用户输入的验证码
    const sid = body.sid
    const code = body.code
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    if (!result) {
      ctx.body = { code: 401, msg: '图片验证码错误，请检查' }
      return
    }
    // 从 JWT 中解析当前登录用户信息
    const obj = await getJWTPayload(ctx.header.authorization)
    // 1. 只允许更新这些字段，防止批量赋值漏洞
    const allowedFields = ['title', 'content'] // 根据业务定义
    const updateData = {}
    for (const key of allowedFields) {
    // 只提取白名单中前端实际传了的字段
      if (body[key] !== undefined) {
        updateData[key] = body[key]
      }
    }
    // 如果白名单字段一个都没传，直接返回参数错误
    if (Object.keys(updateData).length === 0) {
      ctx.body = { code: 400, msg: '没有需要更新的字段' }
      return
    }
    // 2. 更新时同时校验帖子 id、作者 id、未结帖，避免竞态条件
    const updateResult = await Post.updateOne(
      {
        _id: body.tid,
        uid: obj._id,   // 只有作者本人才能改
        isEnd: '0'      // 只有未结帖才能改
      },
      { $set: updateData },
      { runValidators: true } // 触发 Mongoose Schema 校验
    )
    // 3. 匹配不到文档，说明更新失败
    if (updateResult.matchedCount === 0) {
    // 进一步区分：是帖子不存在，还是无权限/已结帖
      const postExists = await Post.exists({ _id: body.tid })
      if (!postExists) {
      // 帖子 id 无效或已删除
        ctx.body = {
          code: 404,
          msg: '帖子不存在'
        }
      } else {
      // 帖子存在，但条件不满足：不是作者或已经结帖
        ctx.body = {
          code: 401,
          msg: '没有操作的权限或帖子已结帖'
        }
      }
      return
    }
    // 4. 匹配到了帖子，但没有任何字段发生变化
    //    例如提交的内容和原内容完全一致
    if (updateResult.modifiedCount === 0) {
      ctx.body = {
        code: 200,
        data: updateResult,
        msg: '内容没有发生变化'
      }
      return
    }

    // 5. 真正更新成功
    ctx.body = {
      code: 200,
      data: updateResult,
      msg: '更新帖子成功'
    }
  }

  // 获取发帖记录
  async getPostByUid (ctx) {
    const params = ctx.query
    // 1：取用户ID
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await Post.getListByUid(obj._id, params.page, params.limit ? parseInt(params.limit) : 10)
    const total = await Post.coutByUid(obj._id)
    if (result.length > 0) {
      ctx.body = {
        code: 200,
        data: result,
        total,
        msg: '查询成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '查询失败，没有发表文章'
      }
    }
  }

  // 删除贴子
  async deletePostByUid (ctx) {
    const params = ctx.query
    // 1：取用户ID
    const obj = await getJWTPayload(ctx.header.authorization)
    const post = await Post.findOne({ uid: obj._id, _id: params.tid })
    // 3. 帖子不存在
    if (!post) {
      ctx.body = {
        code: 404,
        msg: '帖子不存在'
      }
      return
    }

    console.log(post)

    // 判断用户是不是这个贴子的作者，是的话才可以删除，已结帖的不允许删除
    if (post.id === params.tid && post.isEnd === '0') {
      // const result = await Post.deleteOne({ _id: params.tid })
      // 5. 删除帖子，同时删除评论、收藏、浏览历史等关联数据
      // deleteManyAndRef 设计的是批量条件，所以把它包装成数组
      const result = await Post.deleteManyAndRef({
        _id: { $in: [params.tid] }
      })
      if (result.acknowledged) {
        ctx.body = {
          code: 200,
          msg: '删除成功'
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '删除失败'
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败，无权限或者已结帖'
      }
    }
  }

  // 获取用户发贴记录
  async getPostPublic (ctx) {
    const params = ctx.query
    const result = await Post.getListByUid(
      params.uid,
      params.page,
      params.limit ? parseInt(params.limit) : 10
    )
    const total = await Post.coutByUid(params.uid)
    if (result.length > 0) {
      ctx.body = {
        code: 200,
        data: result,
        total,
        msg: '查询列表成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '查询列表失败'
      }
    }
  }

  // 删除贴子，后台系统接口
  async deletePostByTid (ctx) {
    const params = ctx.query
    // const result = await Post.deleteOne({ _id: params.tid })
    // 5. 删除帖子，同时删除评论、收藏、浏览历史等关联数据
    // deleteManyAndRef 设计的是批量条件，所以把它包装成数组
    const result = await Post.deleteManyAndRef({
      _id: { $in: [params.tid] }
    })
    if (result.acknowledged) {
      ctx.body = {
        code: 200,
        msg: '删除成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '删除失败'
      }
    }
  }

  // 更新贴子，后台系统接口
  async updatePostByTId (ctx) {
    const { body } = ctx.request
    const result = await Post.updateOne({ _id: body._id }, body)
    if (result.acknowledged) {
      ctx.body = {
        code: 200,
        data: result,
        msg: '更新贴子成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新贴子失败'
      }
    }
  }

  // 添加标签
  async addTag (ctx) {
    const { body } = ctx.request
    const tag = new PostTags(body)
    await tag.save()
    ctx.body = {
      code: 200,
      msg: '标签保存成功'
    }
  }

  // 添加标签
  async getTags (ctx) {
    const params = ctx.query
    const page = params.page ? parseInt(params.page) : 0
    const limit = params.limit ? parseInt(params.limit) : 10
    const result = await PostTags.getList({}, page, limit)
    const total = await PostTags.countList({})
    ctx.body = {
      code: 200,
      data: result,
      total,
      msg: '查询tags成功！'
    }
  }

  // 删除标签
  async removeTag (ctx) {
    const params = ctx.query
    const result = await PostTags.deleteOne({ id: params.ptid })

    ctx.body = {
      code: 200,
      data: result,
      msg: '删除成功'
    }
  }

  // 删除标签
  async updateTag (ctx) {
    const { body } = ctx.request
    const result = await PostTags.updateOne({ _id: body._id }, body)

    ctx.body = {
      code: 200,
      data: result,
      msg: '更新成功'
    }
  }
}
export default new ContentController()
