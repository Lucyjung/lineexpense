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
  CO :'Cosmetic',
  S : 'Social',
  M : 'Medical',
  E : 'Entertainment',
  EQ : 'Equipment',
  U : 'Utilities',
  TV : 'Travel',
  ED : 'Education',
  MA : 'Maintenance',
  ME : 'Merit',
  IN: 'Insurance',
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
      return [genFlexMessage(
        'Debt Report', 
        'Debt', 
        'https://liff.line.me/1653949405-VNlagD7p', 
        'LINK', 
        'https://firebasestorage.googleapis.com/v0/b/fir-1-4004c.appspot.com/o/credit_card_logo.png?alt=media&token=0fe5811c-da59-4089-ac42-7fa011cdb8d2')];
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
        let expenses = {};
        let timestamp = getTimeAndExpense(strArr,numberArr,expenses);
        let index = 0;
        let total = 0;
        for(let cat in expenses){
          let cost = expenses[cat];
          //ret_str = ret_str + '\n' + cat + ': ' +  cost;
          total += cost;
          //await fbHelper.addExpense(userId,cat,cost,timestamp + index, tag);
          index++;
        }
        let totalStr = numberWithCommas(total);
        return [genFlexExpenseMessage('Expense ' + totalStr, totalStr,expenses, timestamp, tag)];
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
  // let report = dataToMsg(aggregatedData);

  // let replyMsg = [{type: 'text', text:report}];

  return dataToFlex(aggregatedData); 
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
function dataToFlex(aggregatedData){
  let title = 'Summary';
  let header = '';
  let total = 0;
  let isRaw = aggregatedData.raw.length > 0;
  const detail = [];
  for (let i in aggregatedData.sum){
    if (isRaw){
      header += '\n' + aggregatedData.sum[i].label + ' : ' + numberWithCommas(parseFloat(aggregatedData.sum[i].value)) ;
    }
    total += aggregatedData.sum[i].value;
  }
  let totalStr = numberWithCommas(total);
  title += ' : ' + totalStr;
  if (isRaw){    
    let prev_date = '';
    for (let i in aggregatedData.raw){
      let date = formatDate(aggregatedData.raw[i].timestamp) ;
      if (prev_date != date){
        //msg += '\n- ' + date + ' -';
        let tmpDate = {};
        tmpDate[date] = '';
        detail.push(tmpDate);
        prev_date = date;
      }
      let tmpDetail = {};
      tmpDetail[aggregatedData.raw[i].category] = aggregatedData.raw[i].expense; 

      if (aggregatedData.raw[i].tag){
        tmpDetail[aggregatedData.raw[i].category] += ' ' + aggregatedData.raw[i].tag;
      }
      detail.push(tmpDetail);
    }
    
  } else{
    header += 'Total : ' + totalStr; 
  }
  let now = new Date();
  return genFlexExpenseMessage(title, header, detail, now.getTime());
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
function numberWithCommas(x) {
  return x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function genFlexMessage(title, message, link, linkMsg, img){
  const flex = {type: 'flex', altText: title ,contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: title,
          weight: 'bold',
          size: 'xl'
        },
        {
          'type': 'box',
          'layout': 'vertical',
          'margin': 'lg',
          'spacing': 'sm',
          'contents': [
            {
              'type': 'box',
              'layout': 'baseline',
              'spacing': 'sm',
              'contents': [
                {
                  'type': 'text',
                  'text': message,
                  'wrap': true,
                  'color': '#666666',
                  'size': 'sm',
                  'flex': 5
                }
              ]
            }
          ]
        }
      ]
    }
  }};
  if (link && linkMsg){
    flex.contents.footer = {
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
            'label': linkMsg,
            'uri': link
          }
        }
      ],
      'flex': 0
    };
  }
  if (img){
    flex.contents.hero = {
      'type': 'image',
      'url': img,
      'size': 'full',
      'aspectRatio': '20:13',
      'aspectMode': 'cover'
    };
    if (link){
      flex.hero.action = {
        'type': 'uri',
        'uri': link
      };
    }
  }
  return flex;
}
function genFlexExpenseMessage(title, header, detail, timestamp, tag){
  const contents = [];
  const footer = [];
  if (tag){
    footer.push(
      {
        'type': 'text',
        'text': tag,
        'color': '#aaaaaa',
        'size': 'xs',
        'flex': 0
      }
    );
  }
  footer.push(
    {
      'type': 'text',
      'text': formatDate(timestamp),
      'color': '#aaaaaa',
      'size': 'xs',
      'align': 'end'
    }
  );
  for(let key in detail){
    let cost = detail[key];
    let tmp = [{
      'type': 'text',
      'text': key,
      'size': 'sm',
      'color': '#555555',
      'flex': 0
    }];
    if (cost){
      tmp.push({
        'type': 'text',
        'text': '฿' + numberWithCommas(cost) ,
        'size': 'sm',
        'color': '#111111',
        'align': 'end'
      });
    }
    contents.push(
      {
        'type': 'box',
        'layout': 'horizontal',
        'contents': tmp
      },
    );
  }
  const flex = {type: 'flex', altText: title ,contents: {
    'type': 'bubble',
    'body': {
      'type': 'box',
      'layout': 'vertical',
      'contents': [
        {
          'type': 'text',
          'text': 'Expense',
          'weight': 'bold',
          'color': '#1DB446',
          'size': 'sm'
        },
        {
          'type': 'text',
          'text': header,
          'weight': 'bold',
          'size': 'xxl',
          'margin': 'md'
        },
        {
          'type': 'separator',
          'margin': 'xxl'
        },
        {
          'type': 'box',
          'layout': 'vertical',
          'margin': 'xxl',
          'spacing': 'sm',
          'contents': contents
        },
        {
          'type': 'separator',
          'margin': 'xxl'
        },
        {
          'type': 'box',
          'layout': 'horizontal',
          'margin': 'md',
          'contents': footer
        }
      ]
    },
    'styles': {
      'footer': {
        'separator': true
      }
    }
  }};
  return flex;
}