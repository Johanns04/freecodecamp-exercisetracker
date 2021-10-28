const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({extended:false}));

app.use(cors());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var userSchema = new mongoose.Schema({
  username: String
});

var logSchema = new mongoose.Schema({
  userid: String,
  description: String,
  duration: Number,
  date: Date
  
});

var user = mongoose.model('user', userSchema);
var log = mongoose.model('log', logSchema);

//Generating User
app.post('/api/users', (req, res)=>{

  try{
    user.create({username: req.body.username}, (err, data)=>{
      if(err){
        console.log(err, "<=Error");
      }else{

        try{
          var jsonuser = {
            'username': data.username,
            '_id': String(data._id)
          }

        }catch(err){console.log("Error in the json");}
        res.send(jsonuser);

      }
    });
  }catch(err){console.log("error error");}
});

app.get('/api/users', (req, res)=>{
  user.find({}, function(err, data){
    if(err){
      console.log("error in get user");
    }else{
      //var jsonUserArray = data;
      res.send(data);
    }
  });
});

//Generating Exercise and populating log
app.post('/api/users/:_id/exercises', (req, res)=>{
  

    var dateEx;


  if(!Boolean(req.body.date)){
    dateEx = new Date();
    console.log(dateEx);
  }else{
    try{
    dateEx = new Date(req.body.date); 

    }catch(err){
      console.log("date error");
      res.send({'error': 'Invalid Date'});
    }
  }

  if(!Boolean(req.body.description) || !Boolean(req.body.duration)){
    res.send({'error': 'Enter required fields'});
  }else{//if the description and duration are filled
		

      
    user.findById(req.params._id, (err, userData)=>{
        if(err){
          console.log("There is an error");
        }else{

          
          if(Boolean(userData)){
            
            log.find({userid: req.params._id}, (err,  ogData)=>{

                  if(err){
                    console.log()
                  }else if(ogData.length > 0){
                    let jsonlog = {
                      userid : req.params._id,
                      description: req.body.description,
                      duration: req.body.duration,
                      date: dateEx
                    };

                    log.create(jsonlog);

                  }else{
                    console.log("Inside here 3333");
                    
                    let addlog = new log({
                      userid : req.params._id,
                      description: req.body.description,
                      duration: req.body.duration,
                      date: dateEx
                    });

                    addlog.save(); 
                  }
            });
            res.send({
              username:userData.username,
              description: req.body.description,
              duration: Number(req.body.duration),
              date: dateEx.toDateString(),
              _id: req.params._id
            });

          }else{
            res.send({'error': 'Invalid User'});
          }
        }
    });
  }
});

//Geting the logs //helped by the people who asked questions in the forms and ect.
app.get('/api/users/:_id/logs', (req, res)=>{

  const fromd = req.query.from || new Date(0);
  const tod = req.query.to || new Date(Date.now());
  const limit = Number(req.query.limit) || 0;

  log.find({
    userid : req.params._id,
    date: {$gte: fromd, $lte: tod}
  })
  .select('-_id -userid -__v')
  .limit(limit)
  .exec((err, gdata)=>{

    user.findById(req.params._id, (err, udata)=>{

      var i = 0;
      var jsonlog = [];

      while(i<gdata.length){
        let wlog = {
          description: gdata[i].description,
          duration: Number(gdata[i].duration),
          date: new Date(gdata[i].date).toDateString()
        };
        jsonlog.push(wlog);
        i++;
      }

      let jsonSend = {
        username: udata.username,
        count: gdata.length,
        _id: req.params._id,
        log: jsonlog
      };

      res.send(jsonSend);

    });

  });

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

