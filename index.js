const fs = require("fs");
const axios = require("axios");
const csvwriter = require("csv-writer");

const createCsvWriter = csvwriter.createObjectCsvWriter;
const ADDRESS = "0xE8F57F739ca071C4B4265079E1cE70b8B31B9bc6";

// unix time conversion function
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time; 
}

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

async function main() {

  // fetch transaction data from API
  const { data: transactionData } = await axios.get(
    `https://api.zapper.fi/v1/transactions/${ADDRESS}?api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241`);

  // write transaction data into json file
  fs.writeFileSync("./transactions.json", JSON.stringify(transactionData));

  // transform json data into csv writable data
  const results = transactionData.map((transactions) => {

    const row = { Date: timeConverter(transactions.timeStamp) }; // date for each row

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

main();
