var admin = require('firebase-admin');

var serviceAccount = require('./firebasecert.json');
serviceAccount['project_id'] = process.env.FB_PROJECT_ID ;
serviceAccount['private_key_id'] = process.env.FB_PRIVATE_ID ;
serviceAccount['client_email'] = process.env.FB_CLIENT_EMAIL ;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FBDB_URL
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
  },
  updateExpense: async (expenseId, userId, cat, cost, timestamp)=> {
    let postData = {
      userId : userId,
      category: cat,
      cost: parseInt(cost),
      timestamp : parseInt(timestamp)
    };
    return await userExpense.doc(expenseId).set(postData);
  },
  deleteExpense: async (expenseId)=> {

    return await userExpense.doc(expenseId).delete();
  }
};
