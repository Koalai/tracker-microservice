const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./schema/user');
const Exercise = require('./schema/exercise');

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true },
};

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(process.env.URI, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('_id username');
  if (!users) {
    res.send('No user at all');
  } else {
    res.json(users);
  }
});

app.post('/api/users', async (req, res) => {
  if (!req.body.username) {
    return res.status(404).json('The username is required !');
  }
  const userObj = new User({
    username: req.body.username,
  });
  try {
    const user = await userObj.save();
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.send('Could not find user at all');
  }
  const dateObj = {};
  if (from) {
    dateObj['$gte'] = new Date(from);
  }
  if (to) {
    dateObj['$lte'] = new Date(to);
  }
  const filter = {
    user_id: id,
  };
  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(Number(limit) ?? 500);

  const log = exercises.map((ex) => {
    description, duration, date.toDateString();
  });

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log,
  });
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.json('These field are required !');
  }

  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
    if (isNaN(exerciseDate.getTime())) {
      return res.json('The date format is invalid');
    }
  } else {
    exerciseDate = new Date();
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      res.send('Could not find user');
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: exerciseDate,
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (err) {
    console.log(err);
    res.send('Error when saving exercise');
  }
});

const listener = app.listen(3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
