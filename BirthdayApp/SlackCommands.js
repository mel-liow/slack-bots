var ERROR_EMAIL = PropertiesService.getScriptProperties().getProperty('ERROR_EMAIL');

function doPost(request){
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(GOOGLE_SHEET_NAME);

  try {
    if (request.parameter.command == "/listbirthdays") {
      return listBirthdays(sheet)
    } else if (request.parameter.command == "/addbirthday") {
      return addBirthday(sheet, request)
    } else {
      return
    }
  }
  catch(e) {
    MailApp.sendEmail(ERROR_EMAIL, "List Birthday Error: ", e);
  }
}

function addBirthday(sheet, request) {
  const params = request.parameter;
  const text = params.text;

  const data = text.split(" ");
  const firstName = data[0];
  const lastName = data[1];
  const day = data[2];
  const month = data[3];
  
  sheet.appendRow([firstName, lastName, day, month]);
  
  const response = {    
    "response_type": "ephemeral",
    "text": "Birthday for " + firstName + " " + lastName +" has been logged. Thanks!",
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function listBirthdays(sheet) {
  const date = new Date();
  const today = date.getDate();
  const todayMonth = date.getMonth()+1;
  const nextMonth = date.getMonth()+2;

  const data = getDataFromSheet(sheet);
  const upcomingBirthdays = []
  data.forEach(data => {
    if ((data.Month === todayMonth && data.Day > today) || data.Month === nextMonth) {
      upcomingBirthdays.push(data)
    }
  })

  upcomingBirthdays.sort(function (a, b) {
    return a.Month - b.Month || a.Day - b.Day;
  });

  const messageArray = ["Birthdays coming up: \n"]
  upcomingBirthdays.forEach(row => {
    messageArray.push(`${row.Name} ${row.LastName}: ${row.Day}/${row.Month}`)
  })
  var messageText = messageArray.join('\n');

  const response = {    
    "response_type": "ephemeral",
    "text": messageText,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}