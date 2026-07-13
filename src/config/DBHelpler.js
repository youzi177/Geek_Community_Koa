import mongoose from 'mongoose';
import config from './index';

mongoose.connect(config.DB_URL).catch((err) => {
  console.error('MongoDB initial connection error:', err);
});
console.log('当前DB_URL:', config.DB_URL);
// 连接成功
mongoose.connection.on('connected', () => {
  console.log(`Mongoose connected to ${config.DB_URL}`);
});
// 连接异常
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

// 断开连接
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

export default mongoose;
