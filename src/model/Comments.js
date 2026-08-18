import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  tid: { type: String, ref: 'post' },
  uid: { type: String, ref: 'users' }, // 文章作者ID
  cuid: { type: String, ref: 'users' }, // 评论用户的ID
  content: { type: String },
  created: { type: Date },
  hands: { type: Number, default: 0 },
  status: { type: String, default: '1' },
  isRead: { type: String, default: '0' },
  isBest: { type: String, default: '0' }
})
// 保存的时候创建时间
CommentsSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})
// CommentsSchema.post('save', function (error, doc, next) {
//   if (error.name === 'MongoError' && error.code === 11000) {
//     next(new Error('There was a duplicate key error'))
//   } else {
//     next(error)
//   }
// })
CommentsSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    error.status = 400
    error.message = 'There was a duplicate key error'
  }
  next(error)
})
// 静态方法
CommentsSchema.statics = {
  // 通过贴在查询评论数据
  findByTid: function (id) {
    return this.find({ tid: id })
  },
  // 查询文章评论列表
  getCommentsList: function (id, page, limit) {
    return this.find({
      tid: id
    }).populate({
      path: 'cuid',
      select: '_id name isVip pic',
      match: { status: { $eq: '0' } }// status-》是否禁用 判断eq，是否为0，是则查询出来
    }).populate({
      path: 'tid',
      select: '_id title status'
    }).skip(page * limit).limit(limit)
  },
  // 评论数量
  queryCount: function (id) {
    return this.find({ tid: id }).countDocuments()
  }
}

const Comments = mongoose.model('comments', CommentsSchema)

export default Comments
