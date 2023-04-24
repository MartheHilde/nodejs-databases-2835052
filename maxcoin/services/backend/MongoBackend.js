/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty-function */
const { MongoClient } = require('mongodb');

const CoinAPI = require('../CoinAPI');

class MongoBackend {

  constructor() {
    this.coinAPI = new CoinAPI();
    this.mongoUrl = "mongodb://localhost:37017/maxcoin";
    this.client = null;
    this.collection = null;
  }

  async connect() {
    const mongoClient = new MongoClient(this.mongoUrl, { 
      useUnifiedTopology: true, 
      useNewUrlParser: true,
    });
    this.client = await mongoClient.connect();
    this.collection = this.client.db("maxcoin").collection("values");
    return this.client;
  }

// For disconnecting from the MongoDb
  // eslint-disable-next-line consistent-return
  async disconnect() {
    if (this.client) {
      return this.client.close();
    }
    return false;
  }

  async insert() {
    const data = await this.coinAPI.fetch();
    const documents = [];
    Object.entries(data.bpi).forEach((entry) => {
      documents.push({
        date: entry[0],
        value: entry[1],
      });
    });
    return this.collection.insertMany(documents);
  }

  async getMax() {
    // How to get the maximum value? USE SORTING! We will sort the value by desc order and get the one element, the highest value.
    return this.collection.findOne({}, {sort: {value: 1}})
  }

  // Max will call from the main script to get the maximum value

  async max() {
    console.info("Connecting to MongoDB")
    console.time("mongodb-connect")
    const client = await this.connect();
    if(client.isConnected()) {
      console.log("Successfully connected to MongoDB");
    } else {
      throw new Error("Connecting to MongoDB failed")
    }
    console.timeEnd("mongodb-connect");

    console.info("Inserting into MongoDB");
    console.time("mongodb-insert");
    const insertResult = await this.insert();
    console.timeEnd("mongodb-insert");

    console.info(`Inserted ${insertResult.result.n} documents into MongoDB`)

    console.info("Querying MongoDB");
    console.time("mongodb-find");
    const doc = await this.getMax();
    console.timeEnd("mongodb-find");

    console.info("Disconnecting from MongoDB")
    console.time("mongodb-disconnect")
    await this.disconnect();
    console.timeEnd("mongodb-disconnect");

    return {
      date: doc.date,
      value: doc.value,
    }
  }
}

module.exports = MongoBackend;