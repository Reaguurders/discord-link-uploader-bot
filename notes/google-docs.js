var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
const fs = require('fs');

const startScriptFromId = 949;

// var doc = new GoogleSpreadsheet('1LdwTUOxlHaeNrK4FJFsMu5tjpqvBy0i6196vHLPiink');
var doc = new GoogleSpreadsheet('1eUNwGM76Pp6T18VWx3ZE_sY7kEIsNgPgKr1a1NjtcTM');
var sheet;

async.series([
  function setAuth(step) {
    var creds = require('./google-creds.json');
    doc.useServiceAccountAuth(creds, step);
  },
  function getColumnValues(step) {
    doc.getInfo(function (err, content) {
      sheet = content.worksheets[0];
      sheet.getRows({
        offset: 1,
        // limit: 1,
      }, function (err, rows) {
        const postedObject = readPostedObjectFromFile();
        rows.forEach(row => {
          const rowNumber = parseInt(row.nummer);
          if (postedObject[rowNumber] === false && row['dumpert-link']) {
            console.log(rowNumber);
          }
        });
        // const data = readPostedArrayFromFile();
        // const newId = 128;
        // if (!data.posted.includes(newId) && newId < startScriptFromId) {
        //   data.posted.push(newId);
        //   writeDataToFile(data);
        // }
        step();
      });
    });
  },
], function (err) {
  if (err) {
    console.log('Error: ' + err);
  }
});

function readPostedObjectFromFile() {
  let rawdata = fs.readFileSync('posted-tracker.json');  
  let data = JSON.parse(rawdata);  
  return data;
}

function writeDataToFile(data) {
  const newData = JSON.stringify(data);  
  fs.writeFile("./posted-tracker.json", newData, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

function createPostedObject() {
  const postedObject = {};
  for (let i = 1337; i > 0; i--) {
    if (i > startScriptFromId) {
      postedObject[i] = true;
    } else {
      postedObject[i] = false;
    }
  }
  writeDataToFile(postedObject);
}

createPostedObject();