const line = require('node-line-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const msgHelper = require('./MessageHandler.js');
// need raw buffer for signature validation
app.use(bodyParser.json({
  verify (req, res, buf) {
    req.rawBody = buf;
  }
}));
app.use(express.static('public'));
// init with auth
line.init({
  accessToken: process.env.LINE_BOT_CHANNEL_TOKEN,
  // (Optional) for webhook signature validation
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET
});
 
app.post('/webhook/', line.validator.validateSignature(), (req, res) => {
  // get content from request body
  const promises = req.body.events.map(event => {
    let replyPromise = msgHelper.handler(event.source.userId,event.message.text);
    // reply message
    Promise.resolve(replyPromise).then(replyMsg =>{
      return line.client
        .replyMessage({
          replyToken: event.replyToken,
          messages: replyMsg
        });
    });
    
  });
  Promise
    .all(promises)
    .then(() => res.json({success: true}));
});
 
app.listen(process.env.PORT || 80, () => {
  /* eslint-disable no-console */
  console.log('Example app listening on port 80!');
  /* eslint-enable no-console */
  
});