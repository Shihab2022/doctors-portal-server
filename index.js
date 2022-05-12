const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port =process.env.PORT || 5000;
require('dotenv').config()
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hbcgn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const serviceCollection = client.db("doctors-portal").collection("service");
        app.get('/service',async(req,res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const services=await cursor.toArray();
            res.send(services);
        })
    }
    finally{}
}
run().catch(console.dir);


// client.connect(err => {
//     console.log('mongo is connetcted')
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });


app.get('/',(req,res) => {
    console.log('start0')
    res.send('start doctors-portal-server')
})
app.listen(port,(req,res) => {
    console.log('Your server is running port number ',port)
})