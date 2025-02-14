const User = require('../models/user');
const {google} = require('googleapis');
const message_mailer = require('../mailers/message_mailer');
const approved_mailer = require('../mailers/approved_mailer');
const sendBtpRequest_mailer = require('../mailers/sendBtpRequest_mailer');
const sendIpRequest_mailer = require('../mailers/sendIpRequest_mailer');
const btpApproved_mailer = require('../mailers/btpApproved_mailer');
const ipApproved_mailer = require('../mailers/ipApproved_mailer');
const sendBtpMessage_mailer = require('../mailers/sendBtpMessage_mailer');
const sendIpMessage_mailer = require('../mailers/sendIpMessage_mailer');
const boysHostelNodues_mailer = require('../mailers/boysHostelNodues_mailer');
const girlsHostelNodues_mailer = require('../mailers/girlsHostelNodues_mailer');
const getAdminName = require('../data/getAdminName');
const getProffName=require("../data/getProffName");
const admins = require('../data/admins');
var XMLHttpRequest = require('xhr2');
var xhr = new XMLHttpRequest();
const axios = require('axios');
const {CURRENT_URL,NODEMAILER_EMAIL_ID}= require('../config/config');


function modifyAdminName(s) {
  if (s.substring(0, 9) == 'Academics') {
    return 'academics';
  }
  var arr = s.split(" ");
  var newName = arr[0].toLowerCase();
  for (var i=1; i<arr.length; i++) {
      if (arr[i]=='&' || arr[i]=='&amp;') {
          arr[i] = 'and';
      }
      newName = newName + arr[i][0].toUpperCase() + arr[i].substring(1,);
  }
  return newName;
}

updateBoysNoDuesSheet = async () => {
  var spreadsheetId = "1Tk6j9MmqSBOclnMr5XIQ1qGBa_pFXvjfKPmB9QCAG4o";
    var auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    });
    var client = await auth.getClient();
    var googleSheets = google.sheets({version: "v4", auth: client});
    var metadata = await googleSheets.spreadsheets.get({
        auth: auth,
        spreadsheetId: spreadsheetId
    })
    //console.log(metadata.data);
    var data = await googleSheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: spreadsheetId,
        range: "Sheet1"
    });
    //console.log("found the data =============>>>>>>>>>>>");
    var boyshosteldata = data.data.values;
    var newboyshosteldata = [];
    newboyshosteldata.push(boyshosteldata[0]);
    User.find({}, (err, users) => {
      if (err) {console.log('Error in loading all the users'); return;}
      for (var i=1; i<boyshosteldata.length; i++) {
        for (var j in users) {
          if (boyshosteldata[i][0]==users[j]['name'] && users[j]['hostel']==false) {
            newboyshosteldata.push(boyshosteldata[i]);
          }
        }
      }
      for (var i in users) {
        var c = 0;

        //checking if user in boyshosteldata
        for (var j=1; j<boyshosteldata.length; j++) {
          if (users[i]['name'] == boyshosteldata[j][0]) {c=c+1;}
        }
        if (c==0 && users[i]['type']!='Admin' && users[i]['type']!='Proff') {
          temp = [];
          temp.push(users[i]['name']);
          ind = users[i]['email'].indexOf('@');
          temp.push('20'+users[i]['email'].substring(ind-5,ind));
          temp.push(users[i]['email']);
          temp.push('');
          newboyshosteldata.push(temp);
        }
      }
    });

    var spreadsheetId = "1Tk6j9MmqSBOclnMr5XIQ1qGBa_pFXvjfKPmB9QCAG4o";
    var auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    });
    var client = await auth.getClient();
    var googleSheets = google.sheets({version: "v4", auth: client});
    var metadata = await googleSheets.spreadsheets.get({
        auth: auth,
        spreadsheetId: spreadsheetId
    })
    //console.log(metadata.data);
    await googleSheets.spreadsheets.values.clear({
        auth: auth,
        spreadsheetId: spreadsheetId,
        range: "Sheet1"
    });
    console.log(newboyshosteldata);
    await googleSheets.spreadsheets.values.append({
      auth: auth,
      spreadsheetId: spreadsheetId,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      resource: {
          values: newboyshosteldata
      }
  });
}

module.exports.home = (req, res) => {
  var obj = [];
  obj.push(req.user);
    return res.render('home', {
        title : 'Home Page',
        user : JSON.stringify(obj),
        name : req.user.name,
        image : req.user.image,
        admins: JSON.stringify(admins),
        url:JSON.stringify(CURRENT_URL)
    });
}

module.exports.adminHome = (req, res) => {
  var studentList = []
  User.find({}, (err, users) => {
    if (err) {console.log('Error in loading all the users'); return;}
    for (var i in users) {
      if (!users[i]['type']) {
        studentList.push(users[i]);
      }
    }
    return res.render('admin_home', {
      title : 'Admin - Home',
      studentList : JSON.stringify(studentList),
      adminName : getAdminName.adminNames[req.user.email],
      id : req.user._id,
      url: JSON.stringify(CURRENT_URL)
    });
  })
}

module.exports.superAdmin = (req, res) => {
  var studentList = []
  User.find({}, (err, users) => {
    if (err) {console.log('Error in loading all the users'); return;}
    for (var i in users) {
      if (!users[i]['type']) {
        studentList.push(users[i]);
      }
    }
    return res.render('admin_home', {
      title : 'Admin - Home',
      studentList : JSON.stringify(studentList),
      adminName : getAdminName.getAdminName(req.user.email),
      id : req.user._id
    })
  })
}

module.exports.studentList = (req, res) => {
    return res.render('student_list', {
        'title' : 'No-Dues List'
    });
}

module.exports.sendMessage = (req, res) => {
  var obj = JSON.parse(req.params.dues);
  console.log(obj);
  User.findOne({email : obj[0].email}, (err, user) => {
    if (err) {console.log('Error in finding student from email id'); return;}
    var id = user._id;
    var attribute = obj[0].admin + "Message";
    var updatedObject = {};
    updatedObject[attribute] = obj[0].message;
    console.log(id, attribute);
    User.findByIdAndUpdate(id, updatedObject, (err, user) => {
      user.save();
      console.log(user);
      return res.redirect('/admin_home');
    });
    message_mailer.newMessage(obj[0].message, obj[0].email, obj[0].admin);
  })
  return;
}

module.exports.approveDues = (req, res) => {
  var obj = JSON.parse(req.params.dues);
  User.findOne({email : obj[0].email}, (err, user) => {
    if (err) {console.log('Error in finding student from email id'); return;}
    var id = user._id;
    var updateObject = {};
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    updateObject[obj[0].admin] = true
    updateObject[obj[0].admin+'ApprovedAt'] = dateTime;
    User.findByIdAndUpdate(id, updateObject, (err, user) => {
      user.save();
      return res.redirect('/admin_home');
    });
    approved_mailer.approvedDues(obj[0].admin, obj[0].email);
    updateBoysNoDuesSheet();
  });
  return;
}

module.exports.approveManyDues = (req, res) => {
  var obj = JSON.parse(req.params.dues)[0];
  for (var i in obj) {
    var studentEmail = obj[i].studentEmail;
    var adminName = obj[i].adminName;
    var updateObject = {};
    updateObject[adminName] = true;
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    updateObject[adminName+'ApprovedAt'] = dateTime;
    User.findOneAndUpdate({email: studentEmail}, updateObject, (err, user) => {
      user.save();
      approved_mailer.approvedDues(adminName, studentEmail);
    });
  }
  updateBoysNoDuesSheet();
  return res.redirect('/admin_home');
}

module.exports.proffHome = (req, res) => {
  var studentList = []
  User.find({}, (err, users) => {
    if (err) {console.log('Error in loading all the users'); return;}
    for (var i in users) {
      if (!users[i]['type']) {
        studentList.push(users[i]);
      }
    }
    return res.render('proff_home', {
      title : 'Proff - Home',
      studentList : JSON.stringify(studentList),
      name: req.user.name,
      proffEmail : req.user.email,
      image : req.user.image,
      id : req.user._id,
      url: JSON.stringify(CURRENT_URL)
    })
  })
}

module.exports.sendBtpRequest = (req, res) => {
  var obj = JSON.parse(req.params.obj);
  User.findOne({email : obj[0]['studentEmail']}, (err, user) => {
    if (err) {console.log('Error in finding student in sendBtpRequest: ', err); return;}
    var id = user._id;
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    var updatedObject = {};
    updatedObject['btp'] = obj[0]['proffEmail'];
    updatedObject['btpAppliedAt'] = dateTime;
    updatedObject['btpProf']=getProffName.getProffName(obj[0]['proffEmail']);
    User.findByIdAndUpdate(id, updatedObject, (err, user) => {
      if (err) {console.log('Error in saving proffEmail in sendBtpRequest: ', err); return;}
      user.save();
    });
    sendBtpRequest_mailer.sendBtpRequest(obj[0]['proffEmail'], obj[0]['studentEmail']);
  })
  return res.redirect('/');
}

module.exports.sendIpRequest = (req, res) => {
  console.log(obj);
  var obj = JSON.parse(req.params.obj);
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  var updatedObject = {};
  updatedObject['ip'] = obj[0]['proffEmail'];
  updatedObject['ipAppliedAt'] = dateTime;
  updatedObject['ipProf']=getProffName.getProffName(obj[0]['proffEmail']);
  console.log(updatedObject['ipProf']);
  User.findOneAndUpdate({email : obj[0]['studentEmail']}, updatedObject, (err, user) => {
    if (err) {console.log('Error in finding student in sendBtpRequest: ', err); return;}
    user.save();
    sendIpRequest_mailer.sendIpRequest(obj[0]['proffEmail'], obj[0]['studentEmail'])
  });
  return res.redirect('/');
}

module.exports.sendMessageBtp = (req, res) => {
  var obj = JSON.parse(req.params.dues);
  var studentEmail = obj[0]['email'];
  var proffEmail = obj[0]['proffEmail'];
  var message = obj[0]['message'];
  User.findOneAndUpdate({email : studentEmail}, {'btpMessage': message}, (err, user) => {
    if (err) {console.log('Error in finding student in sendMessageBtp: ', err); return;}
    user.save();
    sendBtpMessage_mailer.sendBtpMessage_mailer(message, studentEmail, proffEmail);
    return res.redirect('/proff_home');
  });
}

module.exports.sendMessageIp = (req, res) => {
  var obj = JSON.parse(req.params.dues);
  var studentEmail = obj[0]['email'];
  var proffEmail = obj[0]['proffEmail'];
  var message = obj[0]['message'];
  User.findOneAndUpdate({email : studentEmail}, {'ipMessage': message}, (err, user) => {
    if (err) {console.log('Error in finding student in sendMessageIp: ', err); return;}
    user.save();
    sendIpMessage_mailer.sendIpMessage_mailer(message, studentEmail, proffEmail);
    return res.redirect('/proff_home');
  });
}

module.exports.btpApproved = (req, res) => {
  var obj = JSON.parse(req.params.dues);
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  var updatedObject = {};
  updatedObject['btp'] = obj[0]['proffEmail'];
  updatedObject['btpApprovedAt'] = dateTime;
  updatedObject['btpApproved'] = true;
  User.findByIdAndUpdate(obj[0]['id'], updatedObject, (err, user) => {
    if (err) {console.log('Error finding user in btpApproved: ', err); return;}
    user.save();
    btpApproved_mailer.btpApproved_mailer(obj[0]['proffEmail'], obj[0]['email']);
    return res.redirect('/proff_home');
  });
}

module.exports.ipApproved = (req, res) => {
  var obj = JSON.parse(req.params.dues);
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  var updatedObject = {};
  updatedObject['ip'] = obj[0]['proffEmail'];
  updatedObject['ipApprovedAt'] = dateTime;
  updatedObject['ipApproved'] = true;
  User.findByIdAndUpdate(obj[0]['id'], updatedObject, (err, user) => {
    if (err) {console.log('Error finding user in ipApproved: ', err); return;}
    user.save();
    ipApproved_mailer.ipApproved_mailer(obj[0]['proffEmail'], obj[0]['email']);
    return res.redirect('/proff_home');
  });
}

module.exports.download = async (req, res) => {
  var admins_list;
  await axios.get(`${CURRENT_URL}/user/getAdmins`)
  .then(response => {
    admins_list = response.data;
  })
  .catch(error => {
    console.log(error);
  });
  var admins = [];
  for (var i=0; i<admins_list.length-2; i++) {
    admins.push(modifyAdminName(admins_list[i][0]));
  }
  var email = req.params.obj;
  User.findOne({email: email}, (err, user) => {
    if (err) {console.log('Error in finding user in download: ', err);return;}
   
    return res.render('pdf', {
      user: JSON.stringify(user),
      admins: JSON.stringify(admins)
    });
  })
};

module.exports.past = (req, res) => {
  var admin = JSON.parse(req.params.admin)[0]['admin'];
  var studentList = []
  User.find({}, (err, users) => {
    if (err) {console.log('Error in loading all the users'); return;}
    for (var i in users) {
      if (!users[i]['type']) {
        studentList.push(users[i]);
      }
    }
    return res.render('admin_past', {
      studentList : JSON.stringify(studentList),
      admin : admin,
      url: JSON.stringify(CURRENT_URL)
    })
  });
}

module.exports.sendBankDetails = (req, res) => {
  var obj = JSON.parse(req.params.bankDetails);
  console.log(obj);
  var updateObject = {};
  updateObject.bankName = obj.bankName;
  updateObject.bankBranch = obj.bankBranch;
  updateObject.bankAccountNo = obj.bankAccountNo;
  updateObject.bankIfscCode = obj.bankIfscCode;
  User.findOneAndUpdate({email : obj['email']}, updateObject, (err, user) => {
    if (err) {console.log('Error in finding student in sendBankDetails: ', err); return;}
    user.save();
  });
  return res.redirect('/');
}

module.exports.sendPersonalDetails = (req, res) => {
  var obj = JSON.parse(req.params.personalDetails);
  console.log(obj);
  var updateObject = {};
  updateObject.mobile = obj.personalMobile;
  updateObject.other_email = obj.personalEmail;
  updateObject.date_of_leaving = obj.leavingDate;
  updateObject.reason_of_leaving = obj.leavingReason;
  User.findOneAndUpdate({email : obj['email']}, updateObject, (err, user) => {
    if (err) {console.log('Error in finding student in sendPersonalDetails: ', err); return;}
    user.save();
  });
  return res.redirect('/');
}

module.exports.sheet = (req, res) => {
  return res.redirect('https://docs.google.com/spreadsheets/d/1zRLMi10k1zxMyv2uygSUhcxSEJsova76t8fBXi3GiSk/edit?usp=sharing');
}

module.exports.bankAccountDetails = (req, res) => {
  return res.redirect('https://docs.google.com/spreadsheets/d/1Fn5EplhqwEB5c0chYqhhWCal5Kzs7hT4zNFCwkAkZpE/edit?usp=sharing');
}

module.exports.sendMailToBoysHostelAdmin = async (req, res) => {
    //console.log("inside sendMailToBoysHostelAdmin =============>>>>>>>>>>>");
    updateBoysNoDuesSheet();
  boysHostelNodues_mailer.boysHostelNodues_mailer(`${NODEMAILER_EMAIL_ID}`);
  return res.redirect('/admin_home');
}

module.exports.sendMailToGirlsHostelAdmin = (req, res) => {
  updateGirlsNoDuesSheet();
  girlsHostelNodues_mailer.girlsHostelNodues_mailer(`${NODEMAILER_EMAIL_ID}`);
  return res.redirect('/admin_home');
}

module.exports.request = (req, res) => {
  var obj = JSON.parse(req.params.obj)[0];
  console.log(obj);
  var studentEmail = obj.studentEmail;
  var adminName = obj.adminName;
  console.log(studentEmail, adminName);
  var updateObject = {};
  updateObject[adminName+'Applied'] = true;
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  updateObject[adminName+'AppliedAt'] = dateTime;
  User.findOneAndUpdate({email : obj['studentEmail']}, updateObject, (err, user) => {
    if (err) {console.log('Error in updating request status: ', err); return;}
    user.save();
  });
  return res.redirect('/');
}

module.exports.flowchart = (req, res) => {
  return res.render('flowchart');
}

module.exports.flowchart_nd = (req, res) => {
  return res.render('flowchart_nd');
}

module.exports.nd_controls = (req, res) => {
  return res.render('nd_controls');
}

module.exports.getFunction = (req, res) => {
  return res.status(200).json(getAdminName.adminNames);
}

module.exports.showSheet = (req, res) => {
  return res.render('showSheet',{
    url: JSON.stringify(CURRENT_URL)
  });
  

}