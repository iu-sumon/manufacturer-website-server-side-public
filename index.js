const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 5000;
const app = express()

require('dotenv').config()
app.use(cors())
app.use(express.json())

//========================jwt verify function
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {

        return res.status(401).send({ message: 'UnAuthorized access' });

    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {


        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }


        req.decoded = decoded;
        next();
    });
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4adv5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const brandsCollection = client.db('mountain-bicycle').collection('brands')
        const partsCollection = client.db('mountain-bicycle').collection('parts')
        const reviewsCollection = client.db('mountain-bicycle').collection('reviews')
        const ordersCollection = client.db('mountain-bicycle').collection('orders')
        const userCollection = client.db('mountain-bicycle').collection('users')
        const profilesCollection = client.db('my_profile').collection('profiles')


        //====================================== Get all brands loading API

        app.get('/brands', async (req, res) => {
            const query = {};
            const brands = await brandsCollection.find(query).toArray();
            res.send(brands)
        })

        //====================================== Get all Reviews loading API

        app.get('/reviews', async (req, res) => {
            const query = {};
            const reviews = await reviewsCollection.find(query).toArray()
            res.send(reviews)
        })
        //====================================== Get all Parts loading API

        app.get('/parts', async (req, res) => {
            const query = {};
            const parts = (await partsCollection.find(query).toArray()).reverse();
            res.send(parts)
        })
        //====================================== Get all Parts loading API

        app.get('/orders', async (req, res) => {
            const query = {};
            const orders =await ordersCollection.find(query).toArray()
            res.send(orders)
        })

        //======================================= Get all users  Loading Api

        app.get('/users', verifyJWT, async (req, res) => {

            const users = await userCollection.find().toArray();
            res.send(users);
        });

        //=======================================Single Parts data loading API

        app.get('/purchasePage/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const part = await partsCollection.findOne(query);
            res.send(part)


        })
        //===================================== Deleting Order API
        app.delete('/order/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result)

        })
        //===================================== Deleting Order API
        app.delete('/part/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsCollection.deleteOne(query);
            res.send(result)

        })
        //======================================Order added API
        app.post('/order', async (req, res) => {

            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        })

        //====================================== Review Added API

        app.post('/reviews', async (req, res) => {

            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result)
        })

        //====================================== Parts Added API

        app.post('/parts', async (req, res) => {

            const part = req.body;
            const result = await partsCollection.insertOne(part);
            res.send(result)
        })


        //====================================== update profile API

        app.put('/profile', async (req, res) => {

            const email = req.query.email;
            const updatedProfile = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: updatedProfile
            };
            const result = await profilesCollection.updateOne(filter, updatedDoc, options)
            res.send(result)

        })
        //====================================== My Order API 

        app.get('/order', verifyJWT, async (req, res) => {

            const email = req.query.email;
            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            return res.send(orders);
        })

        //======================================= Make a admin API

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {

            const email = req.params.email;
            const requester = req.decoded.email; // je onno user k admin banate chay  tar email neya hosche  
            const requesterAccount = await userCollection.findOne({ email: requester }); // sei email diye sei user k khuje ber kora hosche 

            if (requesterAccount.role === 'admin') { // admin requester user a jodi role property thake tahole se onno user k admin banate parbe

                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };

                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);

            }

            else {
                res.status(403).send({ message: 'forbidden' });
            }

        });



        //====================================New and old User checking api (JWT main API)

        app.put('/user/:email', async (req, res) => {

            const email = req.params.email;

            const user = req.body;
            const filter = { email: email };

            const options = { upsert: true };

            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token })
        });


    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Mountain Bike...........!')
})

app.listen(port, () => {
    console.log('Server is ok !', port)
})