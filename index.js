// TODO: Automatically get channelID
const channelID = "528606323089211404";

const googleCredentials = require('./creds/google-creds.json');
const token = require('./creds/token.json');

const Discord = require('discord.io');
const logger = require('winston');
const async = require('async');
const GoogleSpreadsheet = require('google-spreadsheet');
const fs = require('fs');

const spreadsheetId = '1eUNwGM76Pp6T18VWx3ZE_sY7kEIsNgPgKr1a1NjtcTM';
const doc = new GoogleSpreadsheet(spreadsheetId);
const trackerFile = './trackers/posted-tracker.json';
let postedObject = readPostedObjectFromFile();

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
let bot = new Discord.Client({
  token: token,
  autorun: true
});
bot.on('ready', function (evt) {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');
  initCheckForNewEntries();
});

function initCheckForNewEntries() {
  // setInterval(function () {
  //   checkForNewEntries();
  // }, 1200000);
  checkForNewEntries();
}

function checkForNewEntries() {
  async.series([
    function setAuth(step) {
      doc.useServiceAccountAuth(googleCredentials, step);
    },
    function checkEntries(step) {
      doc.getInfo(function (err, content) {
        sheet = content.worksheets[0];
        sheet.getRows({
          offset: 1,
          limit: 1,
        }, function(err, rows) {
          rows.forEach(row => {
            const topZoveelPositie = row.nummer;
            if (postedObject[topZoveelPositie] === false && row['dumpert-link']) {
              sendDiscordMessage(topZoveelPositie + 
                ': ' + row.titel + ' - ' + row['dumpert-link'], topZoveelPositie);
            }  
          })
        });
      });
    }
  ], function(error) {
    if (error) {
      logger.error('Error: ' + error);
    }
  });
}

function readPostedObjectFromFile() {
  let rawdata = fs.readFileSync(trackerFile);  
  let data = JSON.parse(rawdata);  
  return data;
}

function writeIdToFile(id) {
  postedObject[id] = true;
  const newData = JSON.stringify(postedObject);  
  fs.writeFile(trackerFile, newData, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

function sendDiscordMessage(message, topZoveelPositie) {
  bot.sendMessage({
    to: channelID,
    message: message
  }, function(error, response) {
    if (error) {
      console.log('Error in sendDiscordMessage: ' + error);
      setTimeout(function() {
        sendDiscordMessage(message);
      }, 5000);
    } else {
      writeIdToFile(topZoveelPositie);
    }
  });
}
