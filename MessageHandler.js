const fbHelper = require('./firebaseHelper.js');

// Constant Value
const REPORT_EXP = /Report/i;
const HELP    = 'HELP';
const CATEGORY_MENU    = 'CATEGORIES';
const DEBT_MENU    = 'DEBT';
const MOD_DATE_STR = 'D';
const PREV_DATE_LIMIT = 3;
const MIN_YEAR_SUPPORT = 2000;
const TAG_SIGN = '#';
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
    else if (message.toUpperCase() == DEBT_MENU){
      return [{type: 'flex', altText: 'Debt' ,contents: {
        'type': 'bubble',
        'hero': {
          'type': 'image',
          'url': 'https://firebasestorage.googleapis.com/v0/b/fir-1-4004c.appspot.com/o/credit_card_logo.png?alt=media&token=0fe5811c-da59-4089-ac42-7fa011cdb8d2',
          'size': 'full',
          'aspectRatio': '20:13',
          'aspectMode': 'cover',
          'action': {
            'type': 'uri',
            'uri': 'https://liff.line.me/1653949405-VNlagD7p'
          }
        },
        'body': {
          'type': 'box',
          'layout': 'vertical',
          'contents': [
            {
              'type': 'text',
              'text': 'Debt',
              'weight': 'bold',
              'size': 'xl'
            }
          ]
        },
        'footer': {
          'type': 'box',
          'layout': 'vertical',
          'spacing': 'sm',
          'contents': [
            {
              'type': 'button',
              'style': 'link',
              'height': 'sm',
              'action': {
                'type': 'uri',
                'label': 'LINK',
                'uri': 'https://liff.line.me/1653949405-VNlagD7p'
              }
            },
            {
              'type': 'spacer',
              'size': 'sm'
            }
          ],
          'flex': 0
        }
      }}];
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
      let tag = '';
      let tagIdx = message.indexOf(TAG_SIGN);
      if (tagIdx > -1 ){
        tag = message.slice(tagIdx);
        message = message.slice(0,tagIdx);
      }
      let numberArr = message.match(/\d+(\.\d+)?/g);
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
      else if (numberArr && numberArr.length > 0 && numberArr.length == strArr.length){
        let ret_str = '';
        let expenses = {};
        let timestamp = getTimeAndExpense(strArr,numberArr,expenses);
        ret_str = 'Expense : ';
        let index = 0;
        for(let cat in expenses){
          let cost = expenses[cat];
          ret_str = ret_str + '\n' + cat + ': ' +  cost;
          await fbHelper.addExpense(userId,cat,cost,timestamp + index, tag);
          index++;
        }
        return [{type: 'text', text:ret_str}];
      }
      else{
        return [{type: 'text', text:'No Response from this message'}];
      }
    }

    return report;
    
  },
  report : async (userId, period, selectPeriod  )=>{
    let data = await getReportData(userId,period,selectPeriod, true);
    return data;
  },
  updateExpense : async (expenseId, userId, cat, cost, timestamp, tag='' )=>{
    let d = new Date(timestamp);
    let data = await fbHelper.updateExpense(expenseId, userId, cat, parseFloat(cost), d.getTime(), tag);
    return data;
  },
  deleteExpense : async (expenseId )=>{
    let data = await fbHelper.deleteExpense(expenseId);
    return data;
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
            '   You can select report from Bulletin' + 
            '3. To get Debt Report \n' +
            '   You can type Debt to get Link';
  return msg;
}
function getCategoriesMessage(){
  let msg = 'Categories : ';
  for (let cat in keyToCatTbl){
    msg +=  '\n   ' + cat + ' : ' + keyToCatTbl[cat];
  } 
  return msg;
}
async function getReportData(userId, type, target, isAPICalled){
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
    
    start.setMonth(0);
    end.setMonth(11);
  case REPORT_TYPE_MONTHY:
    if (target && target > 0 && target < 12){
      start.setMonth(target - 1);
      end.setMonth(target - 1);
    }
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    isRequireRaw = false;
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
  if (isAPICalled){
    isRequireRaw = true;
  }
  /* eslint-enable no-fallthrough */
  let data = await fbHelper.getUserExpense(userId,start.getTime() , end.getTime());

  let aggregatedData = aggregation(data,'category', 'cost', isRequireRaw);

  return aggregatedData;
}
async function getReport(userId, type, target){
  
  let aggregatedData = await getReportData(userId, type, target);
  let report = dataToMsg(aggregatedData);

  let replyMsg = [{type: 'text', text:report}];

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
      data.id = element.id;
      data.expense = element.data()[sumBy];
      data.category = element.data()[groupBy];
      data.tag = element.data()['tag'];
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
function dataToMsg(aggregatedData){
  let msg =   '===================\n' +
              '|  Expense Summary       |\n' + 
              '===================';
  let total = 0;
  for (let i in aggregatedData.sum){
    msg += '\n|' + aggregatedData.sum[i].label + ' : ' + parseFloat(aggregatedData.sum[i].value).toFixed(2);
    total += aggregatedData.sum[i].value;
  }
  msg += '\n Total : ' + total;
  if (aggregatedData.raw.length > 0){
    msg += '\n===================' +
           '\n|  Expense Data            |' + 
           '\n===================';       
    let prev_date = '';
    for (let i in aggregatedData.raw){
      let date = formatDate(aggregatedData.raw[i].timestamp) ;
      if (prev_date != date){
        msg += '\n- ' + date + ' -';
        prev_date = date;
      }
      msg += '\n' + aggregatedData.raw[i].category + ' : ' + aggregatedData.raw[i].expense;
      if (aggregatedData.raw[i].tag){
        msg += ' ' + aggregatedData.raw[i].tag;
      }
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