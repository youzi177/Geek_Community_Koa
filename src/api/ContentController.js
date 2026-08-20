import Post from '../model/Post'
import Links from '../model/Links'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import config from '../config'
import { dirExists, cheackCode, getJWTPayload } from '../common/utils'
import UserModel from '../model/User'
import PostModel from '../model/Post'

class ContentController {
  // 获取文章列表
  async getPostList (ctx) {
    const body = ctx.query
    const sort = body.sort ? body.sort : 'created'
    const page = body.sort ? parseInt(body.page) : 0
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

    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
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
    if (post._id && result.acknowledged) {
      // const result = rename(post.toJSON(), 'uid', 'user')// 把查询的uid改名为user
      ctx.body = {
        code: 200,
        data: post,
        msg: '成功获取文章详情'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '获取文章详情失败'
      }
    }
  }
}
export default new ContentController()
