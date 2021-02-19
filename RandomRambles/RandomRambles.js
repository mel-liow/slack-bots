var SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
var GOOGLE_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEET_NAME');
var ERROR_EMAIL = PropertiesService.getScriptProperties().getProperty('ERROR_EMAIL');

function randomRambleReminder() {

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(GOOGLE_SHEET_NAME);
  sheet.getRange("B2:B").clearContent();

  let payload = {
    "text": `Happy Random Ramble day! Stay tuned for your groups 🥳. Please opt yourself out by 12pm if you can't make it by using the command '/skipRandomRambles <your name>'`
  }
  return sendAlert(payload);
}

function randomRambleGroups() {

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
  
  const participants = data.Members.filter( ( el ) => !data.Decliners.includes( el ) );

  const randomGroups = randomlyGroup(participants)

  const numGroups = randomGroups.length
  const topics = getRandomTopic(data.Topics, numGroups)
  const payload = buildSlackMessage(randomGroups, topics, data.MeetLinks);
  sendAlert(payload);
}


/**
 * Using the modern version of Fisher-Yates shuffling algorithm by
 * swapping the value of the last number that hasn't been chosen 
 * with the kth index to reduce time complexity to O(n) compared to 
 * O(n^2) in the original
 */
function randomlyGroup(participants) {
  const total = participants.length

  let temp
  for (let i = total-1; i > 0 ; i--) {
    let randomIndex = getRandomInt(i)
    temp = participants[i];
    participants[i] = participants[randomIndex]
    participants[randomIndex] = temp
  }
  return evenlyGroup(participants)
}

/**
 * Split participants into groups of a minimum size
 */
function evenlyGroup(participants){
  const total = participants.length;
  const minGroupSize = 4;

  if (total < minGroupSize * 2) { 
    return [participants]
  }

  const remainder = total % minGroupSize;
  const leftover = participants.splice(0, remainder)
  const groups = chunkArray(participants, minGroupSize)

  if (remainder > 0 ){
    if (leftover.length > groups.length) {
      groups[0].push(leftover[0])
      leftover.splice(0,1)
    }
    leftover.forEach((val, i) => {
      groups[i].push(val)
    })
  }
  return groups
}

function chunkArray(myArray, size){
    const results = [];
    while (myArray.length) {
        results.push(myArray.splice(0, size));
    }
    return results;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getRandomTopic(topics, num) {
  const randomTopics = []
  for (let i = 0; i < num; i++) {
    let randomIndex = getRandomInt(topics.length)
    randomTopics.push(topics[randomIndex])
  }
  return randomTopics
}

function buildSlackMessage(groups, topics, meetLinks) {
  let payload = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":bell: *Random Rambles Groups* :bell:"
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
          "text": `*Group ${i+1}:* ${parseGroup} \n *Suggested Random Topic:* ${topics[i]}`
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
  
  try {
    UrlFetchApp.fetch(webhook, options);
  } catch(e) {
    MailApp.sendEmail(ERROR_EMAIL, "Random Ramble Scheduler Error: ", e);
  }
}