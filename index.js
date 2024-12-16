const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("JOB PORTAL SERVER");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0m3jt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobCollection = client.db("jobPortal").collection("jobs");
    const applyCollection = client.db("jobPortal").collection("apply-jobs");

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query = { hr_email: email };
      }

      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const jobInfo = req.body;
      const result = await jobCollection.insertOne(jobInfo);
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.get("/apply-jobs", async (req, res) => {
      const email = req.query.email;
      const query = {
        participantEmail: email,
      };
      const result = await applyCollection.find(query).toArray();

      for (const jobApplication of result) {
        const query2 = { _id: new ObjectId(jobApplication.jobId) };
        const job = await jobCollection.findOne(query2);

        jobApplication.company_logo = job.company_logo;
        jobApplication.company = job.company;
        jobApplication.title = job.title;
        jobApplication.location = job.location;
      }

      res.send(result);
    });

    app.get("/apply-jobs/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { jobId: id };
      const result = await applyCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/apply-jobs", async (req, res) => {
      const data = req.body;
      const result = await applyCollection.insertOne(data);

      // set job apply count
      const id = data.jobId;
      const query = { _id: new ObjectId(id) };
      const job = await jobCollection.findOne(query);
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          applicationCount: newCount,
        },
      };
      const result2 = await jobCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    app.patch("/apply-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };

      const result = await applyCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
