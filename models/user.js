const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    zip: {
      type: Number,
    },
    city: {
      type: String,
      trim: true
    }
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  VATnumber: {
    type: String,
    trim: true
  },
  bankAccountNo: {
    type: String,
    trim: true
  }
})

module.exports = mongoose.model('User', userSchema)
