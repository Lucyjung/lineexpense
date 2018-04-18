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
  addExpense: async (userId, cat, cost, timestamp)=> {
    let postData = {
      userId : userId,
      category: cat,
      cost: cost,
      timestamp : timestamp
    };
    return await userExpense.add(postData);
  },
  getUserExpense : async (userId, timestart, timeend)  => {
    const snapshot = await userExpense
      .where('userId', '==', userId)
      .where('timestamp', '>=', timestart)
      .where('timestamp', '<', timeend)
      .get();
    return snapshot;
  }
};
