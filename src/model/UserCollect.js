import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema

const UserCollectSchema = new Schema({
  uid: { type: String, },
  tid: { type: String, }, // 被点赞用户的id
  title: { type: String, },
  created: { type: Date },
})
// 保存的时候创建时间
UserCollectSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})
// UserCollectSchema.post('save', function (error, doc, next) {
//   if (error.name === 'MongoError' && error.code === 11000) {
//     next(new Error('There was a duplicate key error'))
//   } else {
//     next(error)
//   }
// })
UserCollectSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    error.status = 400
    error.message = 'There was a duplicate key error'
  }
  next(error)
})
// 静态方法
UserCollectSchema.statics = {
  // 查询特定用户的收藏数据
  getListByUid: function (id, page, limit) {
    return this.find({ uid: id })
      .skip(limit * page)
      .limit(limit)
      .sort({ created: -1 })
  },
  // 查询收藏总数
  countByUid: function (id) {
    return this.find({ uid: id }).countDocuments()
  },
  deleteByPostId: function (tid) {
    return this.deleteMany({ tid })
  }

}

const UserCollect = mongoose.model('user_collect', UserCollectSchema)

export default UserCollect
