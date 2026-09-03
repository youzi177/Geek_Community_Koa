import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  cid: { type: String, ref: 'comments' },
  commentAuth: { type: String, ref: 'users' }, // 被点赞用户的id
  uid: { type: String, ref: 'users' },
  created: { type: Date },
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
  // 通过贴在查询评论的点赞数据
  findByTid: function (id) {
    return this.find({ tid: id })
  },
  deleteByCommentId: function (cid) {
    return this.deleteMany({ cid })
  }
}

const CommentsHands = mongoose.model('comments_hands', CommentsSchema)

export default CommentsHands
