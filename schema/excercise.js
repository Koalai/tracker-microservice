const mongoose = require('mongoose')
const {Schema} = mongoose

const exerciseSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise