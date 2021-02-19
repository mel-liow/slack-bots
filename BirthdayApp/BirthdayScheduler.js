var SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
var GIPHY_API_KEY = PropertiesService.getScriptProperties().getProperty('GIPHY_API_KEY');
var GOOGLE_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEET_NAME');
var ERROR_EMAIL = PropertiesService.getScriptProperties().getProperty('ERROR_EMAIL');

function getBirthdays() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(GOOGLE_SHEET_NAME);

  const birthdayData = getDataFromSheet(sheet);
  let birthdays = getTodaysBirthdays(birthdayData)

  if (birthdays.length === 0) return;

  let parsedNames = parseNames(birthdays);
  let payload = buildSlackMessage(parsedNames);
  sendAlert(payload);
}

function getDataFromSheet(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(1,1,lastRow,lastCol).getValues();

  const headers = values.shift();

  let data = values.map((row) => {
    return headers.reduce((obj, val, index) => {
      obj[val] = row[index];
      return obj
    }, {})
  })
  return data
}

function getTodaysBirthdays(data) {
  const date = new Date();
  const todayMonth = date.getMonth()+1;
  const todayDay = date.getDate()

  let birthdays = data.filter(row => {
    return (row.Day === todayDay && row.Month === todayMonth)
  })
  return birthdays
}

function parseNames(data) {
  let parsedNames;

  for (let i = 0; i < data.length; i++) {
    let name = `${data[i].Name} ${data[i].LastName}`
    if (i == 0) {
      parsedNames = name;
    } else if (i > 0 && i < data.length - 1) {
      parsedNames = parsedNames + ', ' + name;
    } else {
      parsedNames = parsedNames + ' and ' + name;
    }
  }
  return parsedNames
}

function getGiphyUrl(){
  const url = 'http://api.giphy.com/v1/gifs/search?q=birthday%20&api_key=' + GIPHY_API_KEY;
  const response = JSON.parse(UrlFetchApp.fetch(url));
  const random_params = Math.floor(Math.random() * response["data"].length);
  return response["data"][random_params]["bitly_gif_url"];
}


function buildSlackMessage(names) {
  let gifUrl = getGiphyUrl()
  let payload = {
    "text": `🥳 Happy Birthday ${names}! 🎂 Hope you have a great day! \n ${gifUrl}`
  }
  return payload;
}

function sendAlert(payload) {
  const webhook = SLACK_WEBHOOK_URL;
  let options = {
    "method": "post", 
    "contentType": "application/json", 
    "muteHttpExceptions": true, 
    "payload": JSON.stringify(payload) 
  };
  
  try {
    UrlFetchApp.fetch(webhook, options);
  } catch(e) {
    MailApp.sendEmail(ERROR_EMAIL, "Birthday Scheduler Error: ", e);
  }
}
