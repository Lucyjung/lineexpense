const fbHelper = require('./firebaseHelper.js');
const output = require('./d3-output/');
const d3nPie = require('./d3-piechart/');
const sharp = require('sharp');
const svg_to_png = require('svg-to-png');
const fs = require('fs');

// Constant Value
const REPORT_EXP = /Report/i;
const HELP    = 'HELP';
const CATEGORY_MENU    = 'CATEGORIES';
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
  TV : 'Travel',
  ED : 'Education',
  MA : 'Maintenance',
  ME : 'Merit',
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
  handler : async (userId, message) => {
    let report;
    if (message.toUpperCase() == HELP){
      return [{type: 'text', text:getHelpMessage()}];
    }
    else if (message.toUpperCase() == CATEGORY_MENU){
      return [{type: 'text', text:getCategoriesMessage()}];
    }
    else if(message.match(REPORT_EXP)){ // input by menu 
      
      if (message.toUpperCase().indexOf(REPORT_TYPE_DAILY) != -1){
        report = await getReport(userId,REPORT_TYPE_DAILY);
      }
      else if (message.toUpperCase().indexOf(REPORT_TYPE_MONTHY) != -1){
        report = await getReport(userId,REPORT_TYPE_MONTHY);
      }
      else if (message.toUpperCase().indexOf(REPORT_TYPE_YEARLY) != -1){
        report = await getReport(userId,REPORT_TYPE_YEARLY);
      }
      else if (message.toUpperCase().indexOf(REPORT_TYPE_WEEKLY) != -1){
        report = await getReport(userId,REPORT_TYPE_WEEKLY);
      }
    }
    else{
      let numberArr = message.match(/\d+(\.\d+)?$/g);
      let strArr =  message.match(/[a-zA-Z]+/g);
  
      // start check for input by key 
      if(strArr[0].toUpperCase() == DAILY_REPORT_KEY){ 
        report = await getReport(userId,REPORT_TYPE_DAILY,numberArr[0]);
      }
      else if(strArr[0].toUpperCase() == MONTHLY_REPORT_KEY){ 
        report = await getReport(userId,REPORT_TYPE_MONTHY,numberArr[0]);
      }
      else if(strArr[0].toUpperCase() == YEARLY_REPORT_KEY){ 
        report = await getReport(userId,REPORT_TYPE_YEARLY,numberArr[0]);
      }
      // end check for input by key 
      else if (numberArr && numberArr.length > 0){
        let ret_str = '';
        let expenses = {};
        let timestamp = getTimeAndExpense(strArr,numberArr,expenses);
        ret_str = 'Expense : ';
        let index = 0;
        for(let cat in expenses){
          let cost = expenses[cat];
          ret_str = ret_str + '\n' + cat + ': ' +  cost;
          await fbHelper.addExpense(userId,cat,cost,timestamp + index);
          index++;
        }
        return [{type: 'text', text:ret_str}];
      }
      else{
        return [{type: 'text', text:'No Response from this message'}];
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
            '   e.g. f50 = Expense Food 50 \n' + 
            '   By default time record is Now \n' + 
            '   If you wish to modify date\n' +
            '   You can do by 3 options as below \n' + 
            '   => Rollback : e.g. f50d1 \n' + 
            '      = Expense for yesterday\n' + 
            '      (Maximum ' + PREV_DATE_LIMIT + ' )\n' + 
            ' => MMDD : e.g. f50d0403 \n' + 
            '      = Expense for April 3rd\n' + 
            ' => YYYYMMDD : e.g. f50d20180408\n' + 
            '      =  Expense for 2018-04-08\n' + 
            '2. To get Report \n' +
            '   You can select report from Bulletin';
  return msg;
}
function getCategoriesMessage(){
  let msg = 'Categories : \n';
  for (let cat in keyToCatTbl){
    msg +=  '   ' + cat + ' : ' + keyToCatTbl[cat] + '\n';
  } 
  return msg;
}
async function getReport(userId, type, target){
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
  let data = await fbHelper.getUserExpense(userId,start.getTime() , end.getTime());

  let aggregatedData = aggregation(data,'category', 'cost', isRequireRaw);
  let report = dataToMsg(aggregatedData, isRequireRaw);
  let options = {width: 400, height: 450, };
  await output('./data/' + userId, dataToChart(aggregatedData.sum));
  options = {compress: true};
  await svg_to_png.convert(__dirname + '/data', 'public',options); 
  await sharp('./public/' + userId + '.png')
    .resize(240, 240)
    .crop(sharp.strategy.entropy)
    .toFile('./public/' +  userId + '_preview.png');
  let replyMsg = [{type: 'text', text:report}];
  replyMsg.push({type: 'image',
    originalContentUrl: 'https://lucylinebot.herokuapp.com/' +  userId + '.png',
    previewImageUrl: 'https://lucylinebot.herokuapp.com/' +  userId + '_preview.png'
  });
  fs.unlinkSync('./data/' + userId + '.svg');
  return (replyMsg); 
}
function aggregation(queryData,groupBy, sumBy, isRequireRaw){
  let aggregated = {};
  let aggregatedArr = []; 
  let rawData = [];
  let total = 0;
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
    total +=  element.data()[sumBy];
  });
  for (let cat in aggregated){
    let label = cat + ' ( ' + parseFloat(aggregated[cat]/total*100).toFixed(2) + '% )';
    aggregatedArr.push({label : label, value : aggregated[cat]});
  }
  return {sum : aggregatedArr, raw : rawData};
}
function dataToMsg(aggregatedData,isRequireRaw){
  let msg = '== Expense Summary ==';
  let total = 0;
  for (let i in aggregatedData.sum){
    msg += '\n' + aggregatedData.sum[i].label + ' : ' + aggregatedData.sum[i].value;
    total += aggregatedData.sum[i].value;
  }
  msg += '\n Total : ' + total;
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
function dataToChart(sumData){

  sumData.push({columns: [ 'label', 'value' ]} );
  return d3nPie({ data: sumData });
}