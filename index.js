// Dag Reaguurder! Dit alles was niet mogelijk geweest zonder @Dyon, @Ruben en @Polatic

// TODO: Automatically get channelID ( // to: [Object.keys(bot.channels)], ?)
// const channelID = "528606323089211404"; // Exquickie test
// const channelID = "528911109097521154"; // Dumpert test
const channelID = "528521165057032202"; // Dumpert top zoveel
const dumpertChannelID = "528521165057032202";

const googleCredentials = require('./creds/google-creds.json');
const token = require('./creds/token.json').token;

const Discord = require('discord.io');
const logger = require('winston');
const async = require('async');
const GoogleSpreadsheet = require('google-spreadsheet');
const fs = require('fs');

// Real Dumpert TopZoveel ID
const spreadsheetId = '1eUNwGM76Pp6T18VWx3ZE_sY7kEIsNgPgKr1a1NjtcTM';

// Test Dumpert TopZoveel ID
// const spreadsheetId = '1LdwTUOxlHaeNrK4FJFsMu5tjpqvBy0i6196vHLPiink';

const doc = new GoogleSpreadsheet(spreadsheetId);
const trackerFile = './entries.json';
const postedObject = readPostedObjectFromFile();

let checking = false;
const intervalCheck = 30 * 1000;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

logger.info('Dumpert TopZoveel - Link uploader initialized...');

// Initialize Discord Bot
const bot = new Discord.Client({
  token: token,
  autorun: true
});
bot.on('ready', function (evt) {
  logger.info('Connected');
  logger.info(bot.username + ' - (' + bot.id + ')');
  initCheckForNewEntries();
});

function initCheckForNewEntries() {
  setInterval(function () {
    checkForNewEntries();
  }, intervalCheck);
}

function checkForNewEntries() {
  if (checking === false) {
    async.series([
      function setAuth(step) {
        doc.useServiceAccountAuth(googleCredentials, step);
      },
      function checkEntries(step) {
        logger.info('Checking entries...');
        checking = true;
        doc.getInfo(function (err, content) {
          sheet = content.worksheets[0];
          sheet.getRows({
            offset: 1,
            // limit: 1,
          }, function(err, rows) {
            let newEntry = false;
            logger.info('Checking rows...');
            rows.forEach(row => {
              const topZoveelPositie = row.nummer;
              // console.log(row);
              fillPostedObject(row);
              if (postedObject[topZoveelPositie].postedInDiscord === false && row['dumpert-link'] && row.titel) {
                logger.info('New entry!');
                newEntry = true;
                sendDiscordMessage(`${topZoveelPositie}: ${row.titel} - ${row['dumpert-link']}`, topZoveelPositie);
              }
            });
            if (newEntry === false) {
              logger.info('All entries posted...');
            }
          });
        });
        checking = false;
      }
    ], function(error) {
      if (error) {
        logger.error('Error: ' + error);
      }
    });
  }
}

function readPostedObjectFromFile() {
  let rawdata = fs.readFileSync(trackerFile);  
  let data = JSON.parse(rawdata);  
  return data;
}

function writeIdToFile(id) {
  logger.info('Writing bot post to file!');
  postedObject[id].postedInDiscord = true;
  const newData = JSON.stringify(postedObject);  
  fs.writeFile(trackerFile, newData, function (err) {
    if (err) {
      return logger.error(err);
    }
  });
}

function sendDiscordMessage(message, topZoveelPositie) {
  logger.info('New topZoveel posted! ' + message);
  bot.sendMessage({
    to: channelID,
    message: message
  }, function(error, response) {
    if (error) {
      logger.error('Error in sendDiscordMessage: ' + error);
      setTimeout(function() {
        sendDiscordMessage(message);
      }, 5000);
    } else {
      writeIdToFile(topZoveelPositie);
    }
  });
}

/// vvvvv DUMMY FUNCTIONS vvvvvv ///

const startScriptFromId = 653;
function newCreatePostedTrackerFromId(id) {
  let jsonData = {};
  for (let i = 1337; i > 0; i--) {
    if (i > id) {
      jsonData[i] = {
        postedInDiscord: true
      };
    } else {
      jsonData[i] = {
        postedInDiscord: false
      };
    }
  }
  writeDataToFile(jsonData);
}

function fillPostedObject(row) {
  postedObject[row.nummer].position = row.nummer;
  postedObject[row.nummer].title = row.titel;
  postedObject[row.nummer].url = row['dumpert-link'];
  postedObject[row.nummer].uploaded = row.uploaddatum;
  postedObject[row.nummer].uploaded = row.uploaddatum;
  postedObject[row.nummer].views = row.views;
  postedObject[row.nummer].kudos = row.kudos;
  postedObject[row.nummer].nfsw = row.nfsw;
  postedObject[row.nummer].length = row.lengte;
  postedObject[row.nummer].thumbnail = row.thumbnail;
}

// newCreatePostedTrackerFromId(startScriptFromId);

function writeDataToFile(data) {
  logger.info('writeDataToFile()');
  const newData = JSON.stringify(data);  
  fs.writeFile(trackerFile, newData, function (err) {
    if (err) {
      return logger.error(err);
    }
  });
}
