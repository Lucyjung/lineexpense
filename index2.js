const msgHelper = require('./MessageHandler.js');

const a = async ()=>{
  console.log(await msgHelper.handler('U28bae1ada29dcce79109253c7083afd3','WeekReport'));
};
a();

