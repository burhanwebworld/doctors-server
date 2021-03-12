const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const { ObjectID } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7wl9m.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const app = express();


app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
  res.send("<h1>Doctors Portal Server</h1>");
});

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   const appointmentCollection = client.db("doctorsPortal").collection("appointments");

// });


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctorsPortal").collection("appointments");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");

  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;

    // console.log(appointment.date);
    appointmentCollection.insertOne(appointment)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.post('/appointmentByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
        const filter = { date: date.date }
        if (doctors.length === 0) {
          filter.email = email;
        }
        appointmentCollection.find(filter)
          .toArray((err, documents) => {
            console.log(email, date.date, doctors, documents)
            res.send(documents);
          })
      })

  })

  app.get("/dailyAppointment", (req, res) => {
    client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((error) => {
      const appointmentCollection = client.db("doctorsPortal").collection("appointments");
      appointmentCollection.find().toArray((err, documents) => {
        if (err) {
          console.log(err);
          console.log(error)
          res.status(500).send({ message: err });
        } else {
          res.send(documents);
        }
      });
      client.close();
    });
  });





  app.patch('/updateStatus/:id', (req, res) => {
    appointmentCollection.updateOne({ _id: ObjectID(req.params.id) }, { $set: { status: req.body.update } })
      .then(data => {
        if (data.matchedCount > 0) {
          res.send(data.matchedCount > 0);
        }
      })

    console.log(req.params.id, req.body);


  })

  app.get('/allAppointments', (req, res) => {
    // client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((error) => {
      const appointmentCollection = client.db("doctorsPortal").collection("appointments");
      appointmentCollection.find().toArray((err, documents) => {
        if (err) {
          console.log(err);
          console.log(error)
          res.status(500).send({ message: err });
        } else {
          res.send(documents);
        }
      });
      client.close();
    });
  });

  app.put("/updatePrescription", (req, res) => {
    const id = req.body.id
    // client = new MongoClient(uri, { useNewUrlParser: true });
    client.connect((error) => {
      const appointmentCollection = client.db("doctorsPortal").collection("appointments");
      appointmentCollection.updateOne({ _id: ObjectId(id) }, { $set: { prescription: req.body.prescription } }, (err, result) => {
        if (err) {
          console.log(err);
          console.log(error)
          res.status(500).send({ message: err });
        }
      });
      client.close();
    });
  });

  app.get('/appointments', (req, res) => {


    appointmentCollection.find()
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/addDoctor', (req, res) => {
    const file = req.files.file;

    const name = req.body.name;
    const email = req.body.email;
    
    // const newImg = file.data;
    
    doctorCollection.insertOne({ name, email, image })
    .then(result => {
        res.send(result.insertedCount > 0);
    })

    file.mv(`${__dirname}/doctors/${file.name}`, err => {
      if (err) {
        console.log(err);
        return res.status(500).send({ msg: 'Failed to upload Image' });
      }
      return res.send({ name: file.name, path: `/${file.name}` });
    })
  })

  app.get('/doctors', (req, res) => {
    doctorCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });

  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0);
      })
  })

});

app.listen(process.env.PORT || port);