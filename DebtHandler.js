const fbHelper = require('./firebaseHelper.js');

module.exports ={
  addDebt : async (req, res )=> {
    let success = true;
    let msg = 'Success';
    try {
      const {userId, name, category, duedate, frequency, tag} = req.body;
      await fbHelper.addDebt(userId, name, category, duedate, frequency, tag);
    } catch(e){
      success = false;
      msg = e.toString();
    }
    
    res.json({success, msg});
  },
  getDebt : async (req, res)=>{
    let success = true;
    let msg = 'Success';
    const result = [];
    try {
      let data = await fbHelper.getDebt(req.params.id);
      data.forEach(element =>{
        const tmpData = element.data();
        tmpData.id = element.id;
        result.push(tmpData);
      });
    } catch (e){
      success = false;
      msg = e.toString();
    }
    
    res.json({success, msg, result});
  },
  getDebtExpense : async (req, res) =>{
    let success = true;
    let msg = 'Success';
    const result = [];
    const request = [];
    try {
      let data = await fbHelper.getDebt(req.params.id);
      data.forEach( element =>{
        const tmpData = element.data();
				
        if (req.query.tag && req.query.tag.includes(tmpData.tag)){
          let d = new Date();
				
          if (req.query.select) {
            const sel = req.query.select.split('-');
            d.setMonth(Number(sel[0]) - 1);
            d.setFullYear(Number(sel[1]));
          }

          let start = new Date(d.getFullYear() + '-' + (d.getMonth()+1) + '-' + tmpData.duedate);
          let end = new Date(start.getTime());
          end.setMonth(end.getMonth() + 1);
				
          let startTime = start.getTime() ;
          let endTime = end.getTime()+ (1000*60*60*24);
          request.push(fbHelper.getAllDebtExpense(req.params.id, '#' + tmpData.tag,startTime,endTime));
        }
        
      });
			
      let responses = await Promise.all(request);
      for (let response of responses){
        response.forEach(item =>{
          const expense = item.data();
          result.push({category: expense.category, cost : expense.cost, tag : expense.tag});
        });
      }
      
    } catch (e){
      success = false;
      msg = e.toString();
    }
    
    res.json({success, msg, result});
  },
  updateDebt : async (req, res )=>{
    let success = true;
    let msg = 'Success';
    try {
      const {userId, name, category, duedate, frequency, tag} = req.body;
      await fbHelper.updateDebt(req.params.id, userId, name, category, duedate, frequency, tag);
    } catch(e){
      success = false;
      msg = e.toString();
    }
    res.json({success, msg});
  },
  deleteDebt : async (req, res )=>{
    let success = true;
    let msg = 'Success';
    try {
      await fbHelper.deleteDebt(req.params.id);
    } catch (e){
      success = false;
      msg = e.toString();
    }
    res.json({success, msg});
  },
};