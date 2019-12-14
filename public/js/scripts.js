

window.onload = function (e) {
  liff.init(function (data) {
    
  });
 
  for (let key in categories){
    let html = '<button class="btn btn-secondary btn-fix-size" type="button" data-symbol="' + key +'">' + categories[key].icon +
      '<span class="icon-center">' + categories[key].name  + '</span></button>';
    $('#btn-categories').append(html);
  }
  $('#btn-categories button').click(function() {
    $(this).addClass('active').siblings().removeClass('active');

  });

};



(function() {
  'use strict';


  $('#demo-external').datepicker({
    format: 'yyyy/mm/dd',
  });
  $('#demo-external').datepicker('setValue', formatDate(null))
  // Shortcut to get elements
  var el = function(element) {
    if (element.charAt(0) === '#') { // If passed an ID...
      return document.querySelector(element); // ... returns single element
    }

    return document.querySelectorAll(element); // Otherwise, returns a nodelist
  };

  // Variables
  var viewer = el('#viewer'), // Calculator screen where result is displayed
  equals = el('#equals'), // Equal button
  nums = el('.num'), // List of numbers
  ops = el('.ops'), // List of operators
  theNum = '', // Current number
  oldNum = '', // First number
  resultNum, // Result
  operator, // Operator
  oldOperator; // Previous Operator 

  // When: Number is clicked. Get the current number selected
  var setNum = function() {
    if (resultNum) { // If a result was displayed, reset number
      theNum = this.getAttribute('data-num');
      resultNum = '';
    } else { // Otherwise, add digit to previous number (this is a string!)
      theNum += this.getAttribute('data-num');
    }

    viewer.innerHTML = theNum; // Display current number

  };

  // When: Operator is clicked. Pass number to oldNum and save operator
  var moveNum = function() {
    oldOperator = operator;
    if (oldNum != ''){
      displayNum(oldOperator);
    }
    
    oldNum = theNum;
    theNum = '';
    
    operator = this.getAttribute('data-ops');
    
    equals.setAttribute('data-result', ''); // Reset result in attr
  };

  // When: Equals is clicked. Calculate result
  var displayNum = function(ops) {
    if (typeof ops != "string"){
      ops = operator;
    }
    // Convert string input to numbers
    let oldNumFloat = parseFloat(oldNum);
    let theNumFloat = parseFloat(theNum);

    // Perform operation
    switch (ops) {
    case 'plus':
      resultNum = oldNumFloat + theNumFloat;
      break;

    case 'minus':
      resultNum = oldNumFloat - theNumFloat;
      break;

    case 'times':
      resultNum = oldNumFloat * theNumFloat;
      break;

    case 'divided by':
      resultNum = oldNumFloat / theNumFloat;
      break;

      // If equal is pressed without an operator, keep number and continue
    default:
      resultNum = theNum;
    }

    // If NaN or Infinity returned
    if (!isFinite(resultNum)) {
      resultNum = oldNumFloat;
    }

    // Display result, finally!
    viewer.innerHTML = resultNum;
    equals.setAttribute('data-result', resultNum);

    // Now reset oldNum & keep result
    oldNum = 0;
    theNum = resultNum;

  };

  // When: Clear button is pressed. Clear everything
  var clearAll = function() {
    oldNum = '';
    theNum = '';
    viewer.innerHTML = '0';
    equals.setAttribute('data-result', resultNum);
  };

  /* The click events */

  // Add click event to numbers
  for (var i = 0, l = nums.length; i < l; i++) {
    nums[i].onclick = setNum;
  }

  // Add click event to operators
  for (var i = 0, l = ops.length; i < l; i++) {
    ops[i].onclick = moveNum;
  }

  // Add click event to equal sign
  equals.onclick = displayNum;

  // Add click event to clear button
  el('#clear').onclick = clearAll;

  $('#btn-submit').click(function() {
    let cat = $('#btn-categories .active').data("symbol");
    let cost = $('#viewer').html();
    let dateStr = $('#demo-external').val();
    let search = '/';
    let dateArr = dateStr.split(search);
    dateStr = dateArr.join('');
    let msg = cat + cost + 'D' + dateStr;
    if (cat && cat != '' && cost != 0){
      liff.sendMessages([{
        type: 'text',
        text: msg
      }]).then(function () {
        $('#modal-msg').html('Message "' + msg + '" Sent');
        $('#modal-popup').modal('show');
        oldNum = '';
        theNum = '';
        viewer.innerHTML = '0';
        equals.setAttribute('data-result', resultNum);
      }).catch(function (error) {
        window.alert("Error sending message: " + error);
      });
    }
  
  });
  $('#btn-close').click(function() {
    liff.closeWindow();
  
  });
}());