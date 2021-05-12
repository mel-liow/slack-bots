var SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
var GOOGLE_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEET_NAME');
var ERROR_EMAIL = PropertiesService.getScriptProperties().getProperty('ERROR_EMAIL');

function notFeelingsGroups() {

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(GOOGLE_SHEET_NAME);

  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const data = {}

  headers.forEach((el,i) => {
    let vals = []
    values.forEach(row => {
      if (row[i]) {
        vals.push(row[i])
      }
    })
    data[el] = vals;
  })
  
  const participants = data.Members;
  const randomGroups = populateGroups(participants)
 Logger.log(randomGroups)

  const payload = buildSlackMessage(randomGroups, data.MeetLinks);

  sendAlert(payload);
}


/**
 * Using the modern version of Fisher-Yates shuffling algorithm by
 * swapping the value of the last number that hasn't been chosen 
 * with the kth index to reduce time complexity to O(n) compared to 
 * O(n^2) in the original
 */
function populateGroups(participants) {
  const total = participants.length
 
  let temp
  for (let i = total-1; i > 0 ; i--) {
    let randomIndex = Math.floor(Math.random() * Math.floor(i)); // Generate random index upto i

    temp = participants[i];
    participants[i] = participants[randomIndex]
    participants[randomIndex] = temp
  }
  
  return splitIntoGroup(participants)
}

/**
 * Split participants into 2 groups
 */
function splitIntoGroup(participants){
  const total = participants.length;

  let groups = []
  
  const middleIndex = Math.floor(total/2);

  groups.push(participants.splice(0,middleIndex));
  groups.push(participants)
  
  return groups
}

function buildSlackMessage(groups, meetLinks) {
  let payload = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":bell: *Not Feelings Groups* :bell:"
        }
      },
      {
        "type": "divider"
      },
    ]
  }

  groups.forEach((group, i) => {
    const parseGroup = group.join(', ')

    payload.blocks.push(
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Group ${i+1}:* ${parseGroup}`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "emoji": true,
            "text": "Go to meet"
          },
          "value": `${i}`,
          "url": `${meetLinks[i]}`,
				  "action_id": `button-action-${i}`
        }
		  }
    )
  })
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
  Logger.log(webhook)
  Logger.log(options.payload)
  try {
    UrlFetchApp.fetch(webhook, options);
  } catch(e) {
    MailApp.sendEmail(ERROR_EMAIL, "Not Feelings Scheduler Error: ", e);
  }
}