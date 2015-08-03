'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PollSchema = new Schema({
  question: String,
  madeBy: String,
  options: {},
  votedBy: Array,
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  active: Boolean
});

module.exports = mongoose.model('Poll', PollSchema);