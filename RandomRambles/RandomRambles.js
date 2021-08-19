var SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
var GOOGLE_SHEET_NAME = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEET_NAME');
var ERROR_EMAIL = PropertiesService.getScriptProperties().getProperty('ERROR_EMAIL');


/**
 * Used to remind the channel that they can decline the meeting and opt out - triggered function
 * 
 * If you want to use the functionality then add this to the list of triggers and set it to 9AM.
 */
function randomRambleReminder() {

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(GOOGLE_SHEET_NAME);
  sheet.getRange("B2:B").clearContent();

  let payload = {
    "text": `Happy Coffee morning! Stay tuned for your groups 🥳. Please opt yourself out by 12pm if you can't make it by using the command '/skipRandomRambles <your name>'`
  }
  return sendAlert(payload);
}


/**
 * Randomly groups users listed - triggered function
 * 
 * This function reads in the spreadsheet and creates an object keyed by the column headings.
 * It splits the list of participants into groups defined by the GroupNumber column then sends a message to the
 * slack channel notifiying them of the link they should attend.
 */
function randomRambleGroups() {

  try { 
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
  
    if (isScheduledDay(data.DayOfWeek[0])) {
      const participants = data.Members.filter( ( el ) => !data.Decliners.includes( el ) );

      const randomGroups = randomlyGroup(participants, data.NumberOfGroups)
  
      let topics =  !!data.ShouldShowTopics[0] ? getRandomTopic(data.Topics, randomGroups.length) : []
  
      const payload = buildSlackMessage(randomGroups, data.MeetLinks, topics);
    
      sendAlert(payload);
    } else {
      return
    }
    
  } catch(e) {
    MailApp.sendEmail(ERROR_EMAIL, "AtomBot: Random Ramble Scheduler Error", e);
  }
}

function isScheduledDay(dayToRun) {

  const dayList = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = new Date()
  const day = today.getDay()

  return dayList[day] === dayToRun
}


/**
 * Using the modern version of Fisher-Yates shuffling algorithm by
 * swapping the value of the last number that hasn't been chosen 
 * with the kth index to reduce time complexity to O(n) compared to 
 * O(n^2) in the original
 */
function randomlyGroup(participants, numberOfGroups) {
  const total = participants.length

  let temp
  for (let i = total-1; i > 0 ; i--) {
    let randomIndex = getRandomInt(i)
    temp = participants[i];
    participants[i] = participants[randomIndex]
    participants[randomIndex] = temp
  }

  return evenlyGroup(participants, numberOfGroups)
}

/**
 * Split participants into evenly sized groups
 * 
 * This function splits the participants into equal sized groups then 
 * distributes the remaining participants across them so that groups are
 * roughly the same size
 */
function evenlyGroup(participants, numberOfGroups){
  const total = participants.length;

  if (!numberOfGroups) {
    numberOfGroups = 2;
  }

  const remainder = total % numberOfGroups;
  const leftover = participants.splice(0, remainder)
  const groups = chunkArray(participants, numberOfGroups)

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

function chunkArray(participants, numberOfGroups){
  const size = Math.floor(participants.length / numberOfGroups);
  const results = [];

  while (participants.length) {
    results.push(participants.splice(0, size));
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

function buildSlackMessage(groups, meetLinks, topics) {
  let payload = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":coffee: *Happy coffee morning day* :coffee:"
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
          "text": `*Group ${i+1}:* ${parseGroup} ${!!topics.length ? `\n *Suggested Random Topic:* ${topics[i]}` : ''}`
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