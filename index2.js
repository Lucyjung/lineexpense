const msgHelper = require('./MessageHandler.js');
let prom = msgHelper.handler('U28bae1ada29dcce79109253c7083afd3','WeekReport');

Promise.resolve(prom).then(val =>{
  console.log(val):
});

