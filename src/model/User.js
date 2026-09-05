import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema
const UserSchema = new Schema({
  username: { type: String, index: { unique: true }, sparse: true },
  password: { type: String },
  name: { type: String },
  created: { type: Date },
  updated: { type: Date },
  favs: { type: Number, default: 100 },
  gender: { type: String, default: '' },
  roles: { type: Array, default: ['user'] },
  pic: { type: String, default: '/img/header.jpg' },
  mobile: { type: String, match: /^1[3-9](\d{9})$/, default: '' },
  status: { type: String, default: '0' },
  regmark: { type: String, default: '' },
  location: { type: String, default: '' },
  isVip: { type: String, default: '0' },
  count: { type: Number, default: 0 },
})
// 保存的时候创建时间
UserSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})
// 更新的时候
UserSchema.pre('update', function () {
  this.updated = moment().format('YYYY-MM-DD HH:mm:ss')
})
// 重复注册一个邮箱，在数据库层面阻止重复注册
// UserSchema.post('save', function (error, doc, next) {
//   if (error.name === 'MonError' && error.code === 11000) {
//     next(new Error('Error:Monngoose has a duplicate key'))
//   } else {
//     next(error)
//   }
// })

UserSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    error.status = 400
    error.message = '用户名已存在'
  }
  next(error)
})
UserSchema.statics = {
  // 通过用户ID查询用户信息
  findByID: function (id) {
    return this.findOne({ _id: id }, {
      // 不需要显示
      password: 0,
      username: 0,
      mobile: 0
    })
  },
  // 获取用户列表
  getList: function (options, sort, page, limit) {
    // 1. datepicker -> item: string, search -> array  startitme,endtime
    // 2. radio -> key-value $in
    // 3. select -> key-array $in
    let query = {}
    if (typeof options.search !== 'undefined') {
      if (typeof options.search === 'string' && options.search.trim() !== '') {
        if (['name', 'username'].includes(options.item)) {
          // 模糊匹配
          query[options.item] = { $regex: new RegExp(options.search) }
          // =》 { name: { $regex: /admin/ } } => mysql like %admin%
        } else {
          // radio
          query[options.item] = options.search
        }
      }
      if (options.item === 'roles') {
        query = { roles: { $in: options.search } }
      }
      if (options.item === 'created') {
        const start = options.search[0]
        const end = options.search[1]
        query = { created: { $gte: new Date(start), $lt: new Date(end) } }
      }
    }
    return this.find(
      query,
      {
        // 不需要显示
        password: 0,
        mobile: 0
      }
    )
      .sort({ [sort]: -1 })
      .skip(page * limit)
      .limit(limit)
  },
  countList: function (options) {
    return this.find(options).countDocuments()
  },
  // 签到记录
  getTotalSign: function (page, limit) {
    return this.find({ count: { $gt: 0 } })
      .skip(page * limit)
      .limit(limit)
      .sort({ count: -1 })
  },
  // 签到总数
  getTotalSignCount: function (page, limit) {
    return this.find({ count: { $gt: 0 } }).countDocuments()
  },
}
const UserModel = mongoose.model('users', UserSchema)

export default UserModel
