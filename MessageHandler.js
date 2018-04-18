const fbHelper = require('./firebaseHelper.js');
const output = require('d3node-output');
const d3nPie = require('./d3-piechart/');
const sharp = require('sharp');

// Constant Value
const REPORT_EXP = /Report/i;
const HELP    = 'HELP';
const MOD_DATE_STR = 'D';
const PREV_DATE_LIMIT = 3;
const MIN_YEAR_SUPPORT = 2000;
const keyToCatTbl = {
  F : 'Food',
  T : 'Traffic',
  C : 'Clothing',
  S : 'Social',
  M : 'Medical',
  E : 'Entertainment',
  U : 'Utilities',
  O : 'Other'
  // D : Reserverd for modify date
};
const REPORT_TYPE_DAILY = 'DAY';
const REPORT_TYPE_WEEKLY = 'WEEK';
const REPORT_TYPE_MONTHY = 'MONTH';
const REPORT_TYPE_YEARLY = 'YEAR';
const DAILY_REPORT_KEY = 'DR';
const MONTHLY_REPORT_KEY = 'MR';
const YEARLY_REPORT_KEY = 'YR';

module.exports ={
  handler : (userId, message) => {
    let report;
    if (message.toUpperCase() == HELP){
      return [{type: 'text', text:getHelpMessage()}];
    }
    else if(message.match(REPORT_EXP)){ // input by menu 
      
      if (message.toUpperCase().indexOf(REPORT_TYPE_DAILY) != -1){
        report = getReport(userId,REPORT_TYPE_DAILY);
      }
      else if (message.toUpperCase().indexOf(REPORT_TYPE_MONTHY) != -1){
        report = getReport(userId,REPORT_TYPE_MONTHY);
      }
      else if (message.toUpperCase().indexOf(REPORT_TYPE_YEARLY) != -1){
        report = getReport(userId,REPORT_TYPE_YEARLY);
      }
      else if (message.toUpperCase().indexOf(REPORT_TYPE_WEEKLY) != -1){
        report = getReport(userId,REPORT_TYPE_WEEKLY);
      }
    }
    else{
      let numberArr = message.match(/\d+/g);
      let strArr =  message.match(/[a-zA-Z]+/g);
  
      // start check for input by key 
      if(strArr[0].toUpperCase() == DAILY_REPORT_KEY){ 
        report = getReport(userId,REPORT_TYPE_DAILY,numberArr[0]);
      }
      else if(strArr[0].toUpperCase() == MONTHLY_REPORT_KEY){ 
        report = getReport(userId,REPORT_TYPE_MONTHY,numberArr[0]);
      }
      else if(strArr[0].toUpperCase() == YEARLY_REPORT_KEY){ 
        report = getReport(userId,REPORT_TYPE_YEARLY,numberArr[0]);
      }
      // end check for input by key 
      else if (numberArr && numberArr.length > 0){
        let ret_str = '';
        let promises = [];
        let expenses = {};
        let timestamp = getTimeAndExpense(strArr,numberArr,expenses);
        ret_str = 'Expense : ';
        let index = 0;
        for(let cat in expenses){
          let cost = expenses[cat];
          ret_str = ret_str + '\n' + cat + ': ' +  cost;
          promises.push(fbHelper.addExpense(userId,cat,cost,timestamp + index));
          index++;
        }
        Promise.all(promises);
        return [{type: 'text', text:ret_str}];
      }
      else{
        return [{type: 'text', text:''}];
      }
    }

    return report;
    
  }
};
function keyToCategory(input){
  let cat = input;
  for (let key in keyToCatTbl){
    if (input.toUpperCase() == key){
      cat = keyToCatTbl[key];
      break;
    }
  }
  return cat;
}
function getTimeAndExpense(strArr, numberArr,returnArr){
  let timestamp = new Date();
  for(let i = 0; i < numberArr.length ; i ++){
    let cost = parseFloat(numberArr[i]);
    let cat = keyToCategory(strArr[i]);
    if (cat.toUpperCase() ==  MOD_DATE_STR){
      if (cost < PREV_DATE_LIMIT){
        // minus date 
        timestamp.setDate(timestamp.getDate() - cost); 
      }else{
        // specific date 
        let date = cost % 100; 
        let month = Math.floor(cost / 100) % 100;
        let year = Math.floor(cost / 10000);

        if (date >= 1 && date <= 31 && 
          month >= 1 && month < 13){
          if (year < MIN_YEAR_SUPPORT ){
            year = timestamp.getFullYear();
          }
          timestamp = new Date(year + '-' + month + '-' + date);  
        }
      }
    }
    else if (cost > 0){
      if (returnArr[cat]){
        returnArr[cat] += cost;
      } 
      else{
        returnArr[cat] = cost;
      } 
    }
  }
  return timestamp.getTime();
}
function getHelpMessage(){
  let msg = 'Usage \n' + 
            '1. To add Expense \n ' + 
            '   Send [Category][Expense] \n' +
            '   Where Category are \n' ;
  for (let cat in keyToCatTbl){
    msg +=  '   ' + cat + ' : ' + keyToCatTbl[cat] + '\n';
  } 
  msg +=    '   e.g. f50 = Expense Food 50 \n' + 
            '   By default time record is Now \n' + 
            '   If you wish to modify date\n' +
            '   You can do by 3 options as below \n' + 
            '   => Rollback : e.g. f50d1 \n' + 
            '      = Expense for yesterday\n' + 
            '      (Maximum ' + PREV_DATE_LIMIT + ' )\n' + 
            ' => MMDD : e.g. f50d0403 = Food Expense 50 for April 3rd \n' + 
            '      = Expense for April 3rd\n' + 
            ' => YYYYMMDD : e.g. f50d20180408\n' + 
            '      =  Expense for 2018-04-08\n' + 
            '2. To get Report \n' +
            '   You can select report from Bulletin';
  return msg;
}
function getReport(userId, type, target){
  let start = new Date();
  let end = new Date();
  let isRequireRaw = true;
  if (target){
    target = parseFloat(target);
  }
  
  /* eslint-disable no-fallthrough */
  switch (type){
  
  case REPORT_TYPE_YEARLY:
    if (target && target > MIN_YEAR_SUPPORT){
      start.setFullYear(target);
      end.setFullYear(target);
    }
    isRequireRaw = false;
    start.setMonth(1);
    end.setMonth(12);
  case REPORT_TYPE_MONTHY:
    if (target && target > 0 && target < 12){
      start.setMonth(target - 1);
      end.setMonth(target - 1);
    }
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
  case REPORT_TYPE_DAILY:
    if (type == REPORT_TYPE_DAILY && 
      target && target > 0 && target < 31){
      start.setDate(target);
      end.setDate(target);
    }
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    break;
  case REPORT_TYPE_WEEKLY:
    start.setDate(start.getDate() - start.getDay() + (start.getDay() == 0 ? -6:1));
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    break;
  }
  /* eslint-enable no-fallthrough */
  let promise = fbHelper.getUserExpense(userId,start.getTime() , end.getTime());
  return new Promise((resolve)=>{
    promise.then(data => {
      let aggregatedData = aggregation(data,'category', 'cost', isRequireRaw);
      let report = dataToMsg(aggregatedData, isRequireRaw);
      aggregatedData.sum.push({columns: [ 'label', 'value' ]} );
      let options = {width: 400, height: 450, };
      output('./public/output', d3nPie({ data: aggregatedData.sum }),options, function(){
        sharp('./public/output.png')
          .resize(240, 240)
          .toFile('./public/preview.png', () => {
            let replyMsg = [{type: 'text', text:report}];
            replyMsg.push({type: 'image',
              originalContentUrl: 'https://lucylinebot.herokuapp.com/output.png',
              previewImageUrl: 'https://lucylinebot.herokuapp.com/preview.png'
            });
            resolve(replyMsg); 
          });
      });
      
    });
  
    
  });
}
function aggregation(queryData,groupBy, sumBy, isRequireRaw){
  let aggregated = {};
  let aggregatedArr = []; 
  let rawData = [];
  queryData.forEach(element => {
    if (isRequireRaw){
      let data = {};
      data.expense = element.data()[sumBy];
      data.category = element.data()[groupBy];
      let d = new Date(element.data().timestamp);
      data.timestamp = d;
      rawData.push(data);
    }
    
    if (aggregated[element.data()[groupBy]]){
      aggregated[element.data()[groupBy]] += element.data()[sumBy];
    }else{
      aggregated[element.data()[groupBy]] = element.data()[sumBy];
    }
  });
  for (let cat in aggregated){
    aggregatedArr.push({label : cat, value : aggregated[cat]});
  }
  return {sum : aggregatedArr, raw : rawData};
}
function dataToMsg(aggregatedData,isRequireRaw){
  let msg = '== Expense Summary ==';

  for (let i in aggregatedData.sum){
    msg += '\n' + aggregatedData.sum[i].label + ' : ' + aggregatedData.sum[i].value;
  }
  if (isRequireRaw){
    msg += '\n== Expense Data ==';
    let prev_date = '';
    for (let i in aggregatedData.raw){
      let date = formatDate(aggregatedData.raw[i].timestamp) ;
      if (prev_date != date){
        msg += '\n- ' + date + ' -';
        prev_date = date;
      }
      msg += '\n' + aggregatedData.raw[i].category + ' : ' + aggregatedData.raw[i].expense;
    }
  }
  return msg;
}
function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}