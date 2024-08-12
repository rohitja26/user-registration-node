// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const moment = require('moment');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/userDB').then(() => console.log("Connected to MongoDb")).catch((err) => console.log(err));

// Define User Schema
const userSchema = new mongoose.Schema({
     firstName: String,
     lastName: String,
     mobileNo: {
          type: String,
          validate: {
               validator: (v) => validator.isMobilePhone(v, 'en-IN'),
               message: props => `${props.value} is not a valid mobile number!`
          }
     },
     email: {
          type: String,
          validate: [validator.isEmail, 'Invalid email']
     },
     address: {
          street: String,
          city: String,
          state: String,
          country: String
     },
     loginId: {
          type: String,
          validate: {
               validator: (v) => validator.isAlphanumeric(v) && v.length >= 8,
               message: props => `Login ID must be at least 8 characters and alphanumeric!`
          }
     },
     password: {
          type: String,
          validate: {
               validator: (v) => {
                    return validator.isLength(v, { min: 6, max: 8 }) &&
                         /[A-Z]/.test(v) && /[a-z]/.test(v) && /[^A-Za-z0-9]/.test(v);
               },
               message: props => `Password must be 6-8 characters with 1 uppercase, 1 lowercase, and 1 special character!`
          }
     },
     creationTime: Date,
     lastUpdatedTime: Date
});

// Pre-save middleware to hash the password and set timestamps
userSchema.pre('save', async function (next) {
     const user = this;
     if (user.isModified('password')) {
          user.password = await bcrypt.hash(user.password, 10);
     }
     if (!user.creationTime) {
          user.creationTime = moment().toDate();
     }
     user.lastUpdatedTime = moment().toDate();
     next();
});

const User = mongoose.model('User', userSchema);

// Route to render the form with potential error messages
app.get('/', (req, res) => {
     res.render('index', { errorMessage: null });
});

// API to save user data and handle errors with alerts
app.post('/api/users', async (req, res) => {
     try {
          const user = new User(req.body);
          await user.save();
          res.redirect('/users');
     } catch (error) {
          res.render('index', { errorMessage: error.message });
     }
});

// API to get all users
app.get('/api/users', async (req, res) => {
     try {
          const users = await User.find({});
          res.status(200).json(users);
     } catch (error) {
          res.status(500).send({ error: 'Server error' });
     }
});

// Route to render user data
app.get('/users', async (req, res) => {
     try {
          const users = await User.find({});
          res.render('users', { users });
     } catch (error) {
          res.status(500).send({ error: 'Server error' });
     }
});

app.listen(3000, () => {
     console.log('Server started on port 3000');
});
