# slack-bots
Various small Google App Script - Slack applications.

These apps use Slack's outgoing webhooks and slash commands to post messages from a Google app script. 

## Random Rambles
Randomly groups team members and can optionally assign 
The app reads and writes to a [Google spreadsheet](https://docs.google.com/spreadsheets/d/1DavAlt6IAHHZaplTEvHbBsXL01huuivndFEv8YftuhI). 

### API - Slack commands
**/addrambler:**
Adds a person to the team

**/skiprandomrambles:**
Allows a participant to remove themselves from this week's Random Rambles event

**/addtopic:**
Allows users to add a topic to the list of random topics

**/listtopics:**
Allows users to view the list of random topics


## Birthday App
Notifies the channel of any birthdays that day and posts a selected birthday GIF from Giphy.

### API - Slack commands
**/listbirthdays:**
Lists upcoming birthdays in the next two months


**/addbirthday:**
Allows users to add their name and birthday
