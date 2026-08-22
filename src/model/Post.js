import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema
const PostSchema = new Schema({
  uid: { type: String, ref: 'users' },
  title: { type: String },
  content: { type: String },
  created: { type: Date },
  catalog: { type: String },
  fav: { type: String },
  isEnd: { type: String, default: '0' },
  reads: { type: Number, default: 0 },
  answer: { type: Number, default: 0 },
  status: { type: String, default: '0' },
  isTop: { type: String, default: '0' },
  sort: { type: String, default: 0 },
  tags: {
    type: Array,
    default: [
      // {
      //   name: '',
      //   class: ''
      // }
    ]
  },
})
PostSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})

PostSchema.statics = {
  /**
   *获取文章列表数据
   * @param {Ooject} options 筛选条件
   * @param {String} sort 排序方式
   * @param {Number} page 分页页数
   * @param {Number} limit 分页条数
   * @returns
   */
  getList: function (options, sort, page, limit) {
    return this.find(options)
      .sort({ [sort]: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate({
        path: 'uid',
        select: 'name isVip pic'
      })
  },
  // 本周热议
  getTopWeek: function () {
    return this.find({
      created: {
        $gte: moment().subtract(7, 'days')
      }
    }, {
      // 需要给出的数据
      answer: 1,
      title: 1
    }).sort({ answer: -1 })
      .limit(15)
  },
  // 查询文章详情
  findByTid: function (id) {
    return this.findOne({ _id: id }).populate({
      path: 'uid',
      select: 'name pic isVip _id'
    })
  },
  // 获取用户发帖记录
  getListByUid: function (id, page, limit) {
    return this.find({ uid: id }).skip(page * limit).limit(limit).sort({ created: -1 })
  },
  // 发帖条数
  coutByUid: function (id) {
    return this.find({ uid: id }).countDocuments()
  }
}

const PostModel = mongoose.model('post', PostSchema)

export default PostModel
