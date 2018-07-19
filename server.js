var fs = require('fs');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
const express = require('express');
const request = require('request');
var util = require('util');

var app = express();

var c;


var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
var playlist;
var gotToken;

var requestData = {'params': {'part': 'snippet,status'}, 
                   'properties': { 'snippet.categoryId': '22',
                                   'snippet.defaultLanguage': '',
                                   'snippet.description': 'Description of uploaded video.',
                                   'snippet.tags[]': '',
                                   'snippet.title': 'Test video upload',
                                   'status.embeddable': '',
                                   'status.license': '',
                                   'status.privacyStatus': 'private',
                                   'status.publicStatsViewable': ''
                                  }, 
                   'mediaFilename': 'test.mp4'
                   }


fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  c = JSON.parse(content);
  authorize(JSON.parse(content), requestData, videosInsert);
});


function authorize(credentials, requestData, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  getNewToken(oauth2Client, requestData, callback);
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
		      oauth2Client.credentials = token;
		      t = token;
		      gotToken = token;
		      console.log(t)
           videosInsert(oauth2Client, requestData);
        })


    res.send({"token" : gotToken})     
  });


function getNewToken(oauth2Client, requestData, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);

}


function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}


function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}


function videosInsert(auth, requestData) {
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = auth;
  parameters['media'] = { body: fs.createReadStream(requestData['mediaFilename']) };
  console.log("media", requestData['mediaFilename'])
  parameters['notifySubscribers'] = false;
  parameters['resource'] = createResource(requestData['properties']);
  var req = service.videos.insert(parameters, function(err, data) {
    if (err) {
      console.log('The API returned an error: ' + err);
    }
    if (data) {
      console.log("DATAT########################################")
      // console.log(util.inspect(data, false, null));
      console.log(data.data)
    }
    process.exit();
  });
  // show some progress
  // var id = setInterval(function () {
  //   var uploadedBytes = req.req.connection._bytesDispatched;
  //   var uploadedMBytes = uploadedBytes / 1000000;
  //   var progress = uploadedBytes > fileSize
  //       ? 100 : (uploadedBytes / fileSize) * 100;
  //   process.stdout.clearLine();
  //   process.stdout.cursorTo(0);
  //   process.stdout.write(uploadedMBytes.toFixed(2) + ' MBs uploaded. ' +
  //      progress.toFixed(2) + '% completed.');
  //   if (progress === 100) {
  //     process.stdout.write('Done uploading, waiting for response...');
  //     clearInterval(id);
  //   }
  // }, 250);
}



app.listen(3000, () => {
	console.log("Server is up on port 5000 !! ");
})