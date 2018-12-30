const channelID = '';
const token = require('./creds/token.json').token;
const Discord = require('discord.io');
const logger = require('winston');

// Initialize Discord Bot
const bot = new Discord.Client({
  token: token,
  autorun: true
});
bot.on('ready', function (evt) {
  logger.info('Connected');
  logger.info(bot.username + ' - (' + bot.id + ')');
  bot.sendMessage({
    to: channelID,
    message: 'Hello world'
  }, function(error, response) {
    if (error) {
      logger.error('Error in sendDiscordMessage: ' + error);
      setTimeout(function() {
        sendDiscordMessage(message);
      }, 5000);
    }
  });
});
