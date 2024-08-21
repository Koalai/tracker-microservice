const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const bodyParser = require('body-parser');
const req = require('express/lib/request');

const uri = "mongodb+srv://dangkhoanguyen0812:dangkhoa@cluster0.rvl5f.mongodb.net/Track-User?retryWrites=true&w=majority&appName=Cluster0";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

const userSchema = new Schema({
  username: String,
})
;
const User = mongoose.model("User", userSchema)

const exerciseSchema = new Schema({
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date,
})
const Exercise = mongoose.model("Exercise", exerciseSchema)


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req,res) =>{
  const users = await User.find({}).select("_id username")
  if(!users){
    res.send("No user at all")
  }else{
    res.json(users)
  }
})

app.post('/api/users', async (req,res) => {
  const userObj = new User({
    username: req.body.username
  })
  try{
    const user = await userObj.save()
    res.json(user)
  }catch(err){
  console.log(err)
  }
})

app.get('/api/users/:_id/logs', async (req,res) => {
  const { from , to , limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id)
  if(!user){
    res.send("Could not find user at all")
  }
  let dateObj = {}
  if (from){
    dateObj["$gte"] = new Date(from)
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id : id
  }
  if(from || to){
    filter.date = dateObj
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500 )
  
  const log = exercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString(),
  }))
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})

app.post('/api/users/:_id/exercises',async (req,res) => {
  const id = req.params._id
  const {description, duration, date} = req.body

  try{
    const user = await User.findById(id)
    if(!user){
      res.send("Could not find user")
    }else{
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  }catch(err){
    console.log(err)
    res.send("Error when saving exercise")
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
