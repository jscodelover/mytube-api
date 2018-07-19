var fs = require('fs');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
const express = require('express');
const request = require('request');
const Youtube = require('youtube-api');

var app = express();

var c;

var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
var playlist;
var gotToken;

fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  c = JSON.parse(content);
  authorize(JSON.parse(content), getChannel);
});


function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  getNewToken(oauth2Client, callback);
}

app.get('/auth', (req, res) => {
    var auth_code = req.query.code;
    console.log("auth_code :",auth_code);
    	var t;

  var clientSecret = c.web.client_secret;
  var clientId = c.web.client_id;
  var redirectUrl = c.web.redirect_uris[0];
    	var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    	oauth2Client.getToken(auth_code, function(err, token) {
		      if (err) {
		        console.log('Error while trying to retrieve access token', err);
		        return;
		      }
		      // oauth2Client.credentials = token;
		      t = token;
		      gotToken = token;
		      console.log(t)
        })

    		console.log(t)

    res.send({"token" : t})     
  });


function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);

  // var rl = readline.createInterface({
  //   input: process.stdin,
  //   output: process.stdout
  // });
  // rl.question('Enter the code from that page here: ', function(code) {
  //   rl.close();
    
  //   oauth2Client.getToken(code, function(err, token) {
  //     if (err) {
  //       console.log('Error while trying to retrieve access token', err);
  //       return;
  //     }
  //     oauth2Client.credentials = token;
  //     console.log(token);
  //     callback(oauth2Client);
  //   });
  // });
}



function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,statistics',
    forUsername: 'GoogleDevelopers'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                  'it has %s views.',
                  channels[0].id,
                  channels[0].snippet.title,
                  channels[0].statistics.viewCount);
      playlist = channels[0].id;
    }
  });
}



app.get('/insert', function(req, res, next) {
    Youtube.authenticate({
        type: "oauth"
      , token: gotToken.access_token
    });
    console.log(gotToken)
    var req = Youtube.videos.insert({
        "resource": {
            // Video title and description
            "snippet": {
                "title": "Test",
                "description": "Test video upload via YouTube API"
            },
            "status": {
                'status.publicStatsViewable': 'public'
            }
        }, 
        "part": "snippet,status,id", 
        "media": {
            "body": fs.createReadStream('./test.mp4')
        }
    }, function (err, data) {
        console.log(data);
        }); 

    res.json({"done" : "yes"});
});





app.listen(3000, () => {
	console.log("Server is up on port 5000 !! ");
})