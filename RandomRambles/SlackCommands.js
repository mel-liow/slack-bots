var ERROR_EMAIL = PropertiesService.getScriptProperties().getProperty('ERROR_EMAIL');

function doPost(request){
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(GOOGLE_SHEET_NAME);

  try {
    switch (request.parameter.command) {
      case("/addrambler"):
        return addParticipant(request, sheet);
      case("/skiprandomrambles"):
        return removeParticipant(request, sheet);
      case("/addtopic"):
        return addTopic(request, sheet);
      case("/listtopics"):
        return listTopics(sheet);
      default:
        return
    }
  }
  catch(e) {
    MailApp.sendEmail(ERROR_EMAIL, "List Randon Rambles Error: ", e);
  }
}

function addParticipant(request, sheet) {
  const params = request.parameter;
  const name = params.text.trim();

  const lastRow = sheet.getRange("A1:A").getValues().filter(String).length + 1;
  sheet.getRange(`A${lastRow}`).setValue(name);
  
  const response = {    
    "response_type": "ephemeral",
    "text": `${name} has been added to random rambles. Thanks!`,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function removeParticipant(request, sheet) {
  const params = request.parameter;
  const name = params.text.trim();

  const lastRow = sheet.getRange("B1:B").getValues().filter(String).length + 1;
  sheet.getRange(`B${lastRow}`).setValue(name);
  
  const response = {    
    "response_type": "ephemeral",
    "text": `We're sad you can't join us 🥺, hopefully next time! ${name} has been taken off the list.`,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function addTopic(request, sheet) {
  const params = request.parameter;
  const topic = params.text.trim();

  const lastRow = sheet.getRange("C1:C").getValues().filter(String).length + 1;
  sheet.getRange(`C${lastRow}`).setValue(topic);
  
  const response = {    
    "response_type": "ephemeral",
    "text": `${topic} has been added to the list. Thanks!`,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function listTopics(sheet) {
  const data = sheet.getRange("C1:C").getValues().filter(String);

  const topics = [].concat.apply([], data); 
  topics.shift()

  const messageText = "Topics: \n" + topics.join('\n');
  const response = {    
    "response_type": "ephemeral",
    "text": messageText,
  };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}