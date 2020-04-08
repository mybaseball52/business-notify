const fs = require('fs');
const util = require('util');
const readline = require('readline');
const {google} = require('googleapis');

// Convert fs.readFile into Promise version of same    
const readdir = util.promisify(fs.readFile);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
  
class Sheet {
  constructor(Id) {
    this.id = Id;
  }

  async getAuthorize(){
    let credentials = await readdir('credentials.json');
      credentials = JSON.parse(credentials);
  
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
      // Check if we have previously stored a token.
      let token = await readdir(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
      this.authorize = oAuth2Client;
  }

  async getLength(target){
    var request = {
      // The spreadsheet to request.
      spreadsheetId: this.id,  // TODO: Update placeholder value.
  
      // The ranges to retrieve from the spreadsheet.
      ranges: [],  // TODO: Update placeholder value.
  
      // True if grid data should be returned.
      // This parameter is ignored if a field mask was set in the request.
      includeGridData: true,  // TODO: Update placeholder value.
  
      auth: this.authorize,
    };
    let auth = this.authorize;
    const sheets = google.sheets({ version: 'v4', auth });
    let result = await sheets.spreadsheets.get(request);

    result = JSON.parse(JSON.stringify(result, null, 2));

    for (let property in result.data.sheets) {
      if (result.data.sheets[property]["properties"]["title"] === target) {
        if(result.data.sheets[property].data[0].hasOwnProperty("rowData")){
          this.currentLength = result.data.sheets[property].data[0].rowData.length;
        } else {
          this.currentLength =  1;
        }
        break;
      }
    }

    return this.currentLength;
  }

  async ReadDataFrom(Range) {
    let auth = this.authorize;
    return new Promise((resolve)=>{
      const sheets = google.sheets({ version: 'v4', auth });
      sheets.spreadsheets.values.get({
        spreadsheetId: this.id,
        range: Range,
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
          return resolve(rows);
        } else {
          console.log('No data found.');
        }
      });
    })
  }
}

module.exports = Sheet;