var admin = require('firebase-admin');

var serviceAccount = require('./fir-1-4004c-firebase-adminsdk-4h3lp-5a73a43c71.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fir-1-4004c.firebaseio.com'
});
var db = admin.firestore();
var userExpense = db.collection('user-expenses');
// [START add expense]
module.exports ={
  addExpense: (userId, cat, cost, timestamp)=> {

    return new Promise((resolve, reject) => {
      let postData = {
        userId : userId,
        category: cat,
        cost: cost,
        timestamp : timestamp
      };
      userExpense.add(postData)
        .then((docRef)=> {
          return resolve(docRef);
        })
        .catch(function(error) {
          return reject(error);
        });
    });
  },
  getUserExpense : (userId, timestart, timeend) =>{

    return new Promise((resolve, reject) => {

      userExpense
        .where('userId', '==', userId)
        .where('timestamp', '>=', timestart)
        .where('timestamp', '<', timeend)
        .get()
        .then(snapshot => {
          return resolve(snapshot);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }
};
