const line = require('node-line-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const msgHelper = require('./MessageHandler.js');
const debtHandler = require('./DebtHandler.js');
// need raw buffer for signature validation
app.use(bodyParser.json({
  verify (req, res, buf) {
    req.rawBody = buf;
  }
}));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS, PATCH');
  next();
});

app.get('/report/:id',  async (req, res) => {

  let data = {msg: 'Parameter period and select are required'};
  if (req.query.period && req.query.select){
    data = await msgHelper.report(req.params.id, req.query.period, req.query.select);
  }
  
  res.json(data);
});
app.post('/expense/:id',  async (req, res) => {

  let data = {msg: 'Parameter(s) are required'};
  if (req.body.userId && req.body.cat && req.body.cost && req.body.timestamp){
    data = await msgHelper.updateExpense(req.params.id, req.body.userId, req.body.cat, req.body.cost, req.body.timestamp, req.body.tag);
  }
  
  res.json(data);
});

app.delete('/expense/:id',  async (req, res) => {

  let data = {msg: 'Parameter(s) are required'};
  data = await msgHelper.deleteExpense(req.params.id);
  
  res.json(data);
});

/* Debt Handler */
app.get('/debt/:id',  debtHandler.getDebt);
app.get('/debtExpense/:id',  debtHandler.getDebtExpense);
app.post('/debt',  debtHandler.addDebt);
app.put('/debt/:id',  debtHandler.updateDebt);
app.delete('/debt/:id',  debtHandler.deleteDebt);

app.use(express.static('public'));
// init with auth
line.init({
  accessToken: process.env.LINE_BOT_CHANNEL_TOKEN,
  // (Optional) for webhook signature validation
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET
});
 
app.post('/webhook/', line.validator.validateSignature(), async (req, res) => {
  // get content from request body
  await req.body.events.map(async (event) => {
    try {
      let replyMsg = await msgHelper.handler(event.source.userId,event.message.text);
      // reply message
      await line.client
        .replyMessage({
          replyToken: event.replyToken,
          messages: replyMsg
        });
    }catch(err){
      await line.client
        .replyMessage({
          replyToken: event.replyToken,
          messages: 'Process error'
        });
    }
    
  });
    
  res.json({success: true});
});
 
app.listen(process.env.PORT || 80, () => {
  /* eslint-disable no-console */
  console.log('Line Expense app listening on port 80!');
  /* eslint-enable no-console */
  
});