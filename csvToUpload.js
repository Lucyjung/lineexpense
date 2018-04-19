const fbHelper = require('./firebaseHelper.js');
const fs = require('fs');
const d3 = require('d3-node')().d3;

const csvString = fs.readFileSync('DayCost.csv').toString();
const data = d3.csvParse(csvString);
const upload = async ()=> {
  for (let i = 0; i < data.length; i++){
    let transaction = data[i];
    let j = 0;
    let date;
    let cat;
    let expense;
    let timestamp;
    for (let key in transaction){
      cat = capitalizeFirstLetter(transaction.Category);
      expense = parseFloat(transaction.Money.match(/\d+(\.\d+)?$/g)[0]);
      if (j == 0){
        date = transaction[key];
        timestamp = new Date(date).getTime();
        break;
      }
      
    }
    console.log ('cat : ' + cat + ' value : ' + expense);
    await fbHelper.addExpense('U28bae1ada29dcce79109253c7083afd3',cat , expense,timestamp);
  }
};
upload();

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}