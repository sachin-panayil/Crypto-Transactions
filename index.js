const http = require('http')
const fs = require('fs');
const axios = require('axios');
const csvwriter = require('csv-writer');
const express = require("express");
const moment = require("moment");

const app = express();
var router = express.Router();

let port = process.env.PORT || 3000;
// const ADDRESS = "0xE8F57F739ca071C4B4265079E1cE70b8B31B9bc6";
const createCsvWriter = csvwriter.createObjectCsvWriter;

// csv header creation
const csvWriter = createCsvWriter({

  // output csv file name is transactions
  path: "transactions.csv",
  header: [
    // title of the columns
    { id: "Date", title: "Date" },
    { id: "RQ", title: "Received Quantity" },
    { id: "RC", title: "Received Currency" },
    { id: "SQ", title: "Sent Quantity" },
    { id: "SC", title: "Sent Currency" },
  ],

});

async function createCSVandJSON(ADDRESS) {

  // fetch transaction data from API
  const { data: transactionData } = await axios.get(
    `https://api.zapper.fi/v1/transactions/${ADDRESS}?api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241`);

  // write transaction data into json file
  fs.writeFileSync("./transactions.json", JSON.stringify(transactionData));

  // transform json data into csv writable data
  const results = transactionData.map((transactions) => {

    const row = { Date: moment(transactions.timeStamp * 1000).format("MM/DD/YYYY HH:mm:ss") }; // date for each row

    row.RQ = transactions.subTransactions
      .filter((subT) => subT.type == "incoming") // checks if type is incoming or outcoming
      .map((subT) => subT.amount) // puts down subTransactions numerical amount
      .reduce((sum, amount) => sum + amount, 0) || ''; // creates sum if there is multiple amounts

    row.RC = transactions.subTransactions
      .filter((subT) => subT.type == "incoming") // checks if type is incoming or outcoming
      .map((subT) => subT.symbol) // puts down subTransactions symbol
      .join("-"); // joins multiple symbols together

    row.SQ = transactions.subTransactions
      .filter((subT) => subT.type == "outgoing")
      .map((subT) => subT.amount)
      .reduce((sum, amount) => sum + amount, 0) || '';

    row.SC = transactions.subTransactions
      .filter((subT) => subT.type == "outgoing")
      .map((subT) => subT.symbol)
      .join("-");

    return row;

  });

  // creates a csv file
  await csvWriter
    .writeRecords(results)
    .then(()=> console.log('Data Uploaded into a CSV File Successfully!'));

};

app.get('/', (req, res) => {
  res.send("Please type in your address in the URL following /address/ ----- For Example: https://crypto-transactions.herokuapp.com/address/1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2")

})

app.get('/address/:id', function(req, res) {
    createCSVandJSON(req.params.id);
    const file = `${__dirname}/transactions.csv`;
    setTimeout(() => { res.download(file); }, 3000) ; // sets disposition and sends it with a 5 second delay
});

app.listen(port, () => {
  console.log(`Server is listening on port http://localhost:${port}`);
});

