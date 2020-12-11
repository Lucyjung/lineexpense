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
var userDebt = db.collection('user-debt');
// [START add expense]
module.exports ={
  addExpense: async (userId, cat, cost, timestamp, tag='')=> {
    let postData = {
      userId : userId,
      category: cat,
      cost: cost,
      timestamp : timestamp
    };

    if (tag){
      postData['tag'] = tag;
    }
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
  updateExpense: async (expenseId, userId, cat, cost, timestamp, tag='')=> {
    let postData = {
      userId : userId,
      category: cat,
      cost: cost,
      timestamp : timestamp
    };

    if (tag){
      postData['tag'] = tag;
    }
    return await userExpense.doc(expenseId).set(postData);
  },
  deleteExpense: async (expenseId)=> {

    return await userExpense.doc(expenseId).delete();
  },
  addDebt: async (userId, name, cat, duedate, frequency, tag)=> {
    let postData = {
      userId : userId,
      category: cat,
      name: name,
      duedate,
      frequency,
      tag
    };
    return await userDebt.add(postData);
  },
  getDebtExpense : async (userId,tag, timestart, timeend)  => {
    const snapshot = await userExpense
      .where('userId', '==', userId)
      .where('tag', '==', tag)
      .where('timestamp', '>=', timestart)
      .where('timestamp', '<', timeend)
      .get();
    return snapshot;
  },
  getDebt : async (userId)  => {
    const snapshot = await userDebt
      .where('userId', '==', userId)
      .get();
    return snapshot;
  },
  getAllDebtExpense : async (userId,tag, timestart, timeend)  => {
    const snapshot = await userExpense
      .where('userId', '==', userId)
      .where('tag', '==', tag)
      .where('timestamp', '>=', timestart)
      .where('timestamp', '<', timeend)
      .get();
    return snapshot;
  },
  updateDebt: async (debtId, userId, name, cat, duedate, frequency, tag)=> {
    let postData = {
      userId : userId,
      category: cat,
      name: name,
      duedate,
      frequency,
      tag
    };
    return await userDebt.doc(debtId).set(postData);
  },
  deleteDebt: async (debtId)=> {

    return await userDebt.doc(debtId).delete();
  }
};
