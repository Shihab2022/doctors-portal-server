const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hbcgn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctors-portal").collection("service");
    const bookingCollection = client.db("doctors-portal").collection("booking");
    const userCollection = client.db("doctors-portal").collection("user");
    const doctorCollection = client.db("doctors-portal").collection("doctors");

const verifyAdmin=async(req,res,next)=>{
  const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next()
      }
      else{
        res.status(403).send({message : 'forbidden access . '})
      }
}

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).project({name : 1});
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, accessToken: token });
    });

    app.put("/user/admin/:email", verifyJWT,verifyAdmin, async (req, res) => {
      const email = req.params.email;
//nichar comment ar kaj ta akta fun ar modday koray si jaty ay ti bivinno jaigai use korty pari .

      // const requester = req.decoded.email;
      // const requesterAccount = await userCollection.findOne({
      //   email: requester,
      // });
      // if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      // } 
      // else {
      //   res.status(403).send({ message: "forbidden access" });
      // }
    });
    app.get('/admin/:email',async(req,res)=>{
      const email=req.params.email;
      const user =await userCollection.findOne({email:email});
      const isAdmin=user.role==='admin';
      res.send({admin : isAdmin})
    })

    app.get("/available", async (req, res) => {
      const date = req.query.date;
      // step 1: get get all services
      const services = await serviceCollection.find().toArray();

      //   step 2: get the booking of that day output

      const query = { date: date };
      const booking = await bookingCollection.find(query).toArray();

      //step 3:  for each service

      services.forEach((service) => {
        //step 4 : find booking for that service output

        const serviceBookings = booking.filter(
          (book) => book.treatment === service.name
        );
        //step 5 : select slots for the service bookings
        const bookedSlots = serviceBookings.map((book) => book.slot);

        //step 6 : select those slots that slots are not in bookSlots
        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        service.slots = available;
      });
      res.send(services);
    });
    app.get("/booking", verifyJWT, async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        data: booking.data,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      res.send({ success: true, result });
    });

    app.post('/doctor',verifyJWT,verifyAdmin,async(req,res)=>{
      const doctor=req.body
      const result =await doctorCollection.insertOne(doctor)
      res.send(result)
    })
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  console.log("start");
  res.send("start doctors-portal-server");
});
app.listen(port, (req, res) => {
  console.log("Your server is running port number ", port);
});
