import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema
const SignSchema = new Schema({
  uid: { type: String, ref: 'users' },
  created: { type: Date },
  favs: { type: Number },
  // lastSign: { type: Date }
})

SignSchema.pre('save', function () {
  // this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  this.created = new Date()
})
/**
 * 根据用户 id 查询这个用户最近一次的签到记录
 */
SignSchema.statics = {
  findByUid: function (uid) {
    return this.findOne({ uid }).sort({ created: -1 })
  },
  getTopSign: function (page, limit) {
    return this.find({
      created: { $gte: moment().format('YYYY-MM-DD 00:00:00') }
    }).populate({
      path: 'uid',
      select: '_id name pic'
    })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: 1 })
  },
  getTopSignCount: function () {
    return this.find({
      created: { $gte: moment().format('YYYY-MM-DD 00:00:00') }
    }).countDocuments()
  },
  getLatestSign: function (page, limit) {
    return this.find({})
      .populate({
        path: 'uid',
        select: '_id name pic'
      })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })
  },
  getSignCount: function () {
    return this.find({}).countDocuments()
  },
}
const SignModel = mongoose.model('Sign', SignSchema)

export default SignModel
