'use strict';
var http = require('http');

exports.handler = (event, context) => {
	var request = event.request;

  try {
  	if(request.type === "LaunchRequest") {
      let options = {};
      options.speechText = "Welcome to Greetings skill. Using our skill you can greet your guests. Whom you want to greet? ";
      options.repromptText = "You can say for example, say hello to John. ";
      options.endSession = false;
      context.succeed(buildResponse(options));
  	}
  	else if(request.type === "IntentRequest") {
      let options = {};

      if(request.intent.name === "HelloIntent") {
        let name = request.intent.slots.FirstName.value;
        options.speechText = `Hello <say-as interpret-as="spell-out">${name}</say-as>. `;
        options.speechText += getWish();
        getQuote((quote,err) => {
          if(err) {
            context.fail(err);
          }
          else {
            options.speechText += quote;
            options.endSession = true;
            context.succeed(buildResponse(options));
          }
        });
      }
      else {
        throw "Unknown intent";
      }
  	}
  	else if(request.type === "SessionEndedRequest") {
      
  	}
  	else {
  		throw "unknown intent type";
  	}
  }
  catch(e) {
    context.fail("Exception: " + e);
  }
}

var getQuote = (callback) => {
  var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  var req = http.get(url, (res) => {
    var body = "";

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      body = body.replace(/\\/g, '');
      var quote = JSON.parse(body);
      callback(quote.quoteText);
    });
  });

  req.on('error', (err) => {
    callback('', err);
  });
}

var getWish = () => {
  var myDate = new Date();
  var hours = myDate.getUTCHours() - 8;
  if(hours < 0) {
    hours = hours + 24;
  }

  if(hours < 12) {
    return "Good morning. ";
  }
  else if(hours < 18) {
    return "Good atfternoon. ";
  }
  else {
    return "Good evening. ";
  }
}

var buildResponse = (options) => {
	var response = {
		version: "1.0",
		response: {
	    outputSpeech: {
	      type: "SSML",
        ssml: "<speak>" + options.speechText + "</speak>"
	    },
	    shouldEndSession: options.endSession
	  }
	};

  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "PlainText",
        text: options.repromptText
      }
    };
  }
  return response;
}


// lambda-local -l index.js -e event.json

