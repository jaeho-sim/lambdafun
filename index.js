'use strict';

var http = require('http');
// bespoken bst for testing
var bst = require('bespoken-tools');

// handler function
// only this function visible to the lambda service
// referencing "response.json" to build, i.e. request, session, etc
// first, look at the "type", and see which type of the request it is
exports.handler = bst.Logless.capture("352b4022-3409-43ea-9743-292acac9e1e2", (event, context, callback) => {
	var request = event.request;
  var session = event.session;

  // Session:
  // used when want to remember information from one intent to another intent within a given session
  // e.g. when wants to use "more"
  // whatever information you pass to "sessionAttributes",
  // that will be sent back to you in the next request session in "attributes"

  // alexa might not even send the attributes property if session attribute does not exist,
  // so we need to initialize session attribute
  if(!event.session.attributes) {
    event.session.attributes = {};
  }

  // check request type
  // alexa sends 3 types of requests:
  //    1. LaunchRequest - whenever user open a skill (e.g. welcome message)
  //    2. IntentRequest - whenever user say some command
  //    3. SessionEndedRequest - If user doesnt say anything or any error happens - usually do clean ups
  // type has to be string
  try {
  	if(request.type === "LaunchRequest") {
      handleLaunchRequest(context);
  	}
    // check intent type
  	else if(request.type === "IntentRequest") {
      if(request.intent.name === "HelloIntent") {
        handleHelloIntent(request, context);
      }
      else if(request.intent.name === "QuoteIntent") {
        handleQuoteIntent(request, context, session);
      }
      else if(request.intent.name === "NextQuoteIntent") {
       handleNextQuoteIntent(request, context, session); 
      }
      else if(request.intent.name === "AMAZON.StopIntent" || request.intent.name === "AMAZON.CancelIntent") {
        context.succeed(buildResponse({
          speechText: "Good bye. ",
          endSession: true
        }));
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
});

var handleHelloIntent = (request, context) => {
  let options = {};
  let name = request.intent.slots.FirstName.value;
  options.speechText = `Hello <say-as interpret-as="spell-out">${name}</say-as>. `;
  options.speechText += getWish();

  options.cardTitle = `Hello ${name}!`;

  // this is non-blocking function, but options.endsession need to be executed only when we get the quote,
  // so options.endsession and context.succeed is moved to inside the function
  getQuote((quote,err) => {
    if(err) {
      context.fail(err);
    }
    else {
      options.speechText += quote;
      options.cardContent = quote;
      options.imageUrl = "https://upload.wikimedia.org/wikipedia/commons/5/5b/Hello_smile.png";
      options.endSession = true;
      context.succeed(buildResponse(options));
    }
  });
}

var handleQuoteIntent = (request, context, session) => {
  let options = {};
  options.session = session;

  getQuote((quote,err) => {
    if(err) {
      context.fail(err);
    }
    else {
      options.speechText = quote;
      options.speechText += " Do you want to listen to one more quote? ";
      options.repromptText = "You can say yes or one more. ";
      options.session.attributes.quoteIntent = true;
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
  });
}

var handleNextQuoteIntent = (request, context, session) => {
  let options = {};
  options.session = session;

  if(session.attributes.quoteIntent) {
    getQuote((quote,err) => {
      if(err) {
        context.fail(err);
      }
      else {
        options.speechText = quote;
        options.speechText += " Do you want to listen to one more quote? ";
        options.repromptText = "You can say yes or one more. ";
        // options.session.attributes.quoteIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
      }
    });
  }
  else {
    options.speechText = "Wrong invocation of this intent. ";
    options.endSession = true;
    context.succeed(buildResponse(options));
  }
}

var handleLaunchRequest = (context) => {
  let options = {};
  options.speechText = "Welcome to Greetings skill. Using our skill you can greet your guests. Whom you want to greet? ";
  options.repromptText = "You can say for example, say hello to John. ";
  options.endSession = false;
  // parse to succeed
  context.succeed(buildResponse(options));
}

// getting random quote from the api
var getQuote = (callback) => {
  var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  var req = http.get(url, (res) => {
    var body = "";

    // everytime it gets data from the response, it triggers a data event,
    // it will parse the chunk of the whole body, so we need to keep accumulating it until ends
    res.on('data', (chunk) => {
      body += chunk;
    });

    // response is in json string so have to convert to js string
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

// speech change depend on the current time
var getWish = () => {
  var myDate = new Date();
  var hours = myDate.getUTCHours() - 5; // eastern time zone
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
      // required
	    outputSpeech: {
	      type: "SSML",
        ssml: "<speak>" + options.speechText + "</speak>"
	    },
      // required
	    shouldEndSession: options.endSession
	  }
	};

  // reprompt is optional - used when we want to keep the session
  // it will check if the reprompt text is present or not, then repopulate
  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>" + options.repromptText + "</speak>"
      }
    };
  }

  // card
  if(options.cardTitle) {
    response.response.card = {
      type: "Simple",
      title: options.cardTitle
    };

    if(options.imageUrl) {
      response.response.card.type = "Standard";
      response.response.card.text = options.cardContent;
      response.response.card.image = {
        smallImageUrl: options.imageUrl,
        largeImageUrl: options.imageUrl
      };
    }
    else {
      response.response.card.content = options.cardContent;
    }
  }

  if(options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }

  return response;
}


// lambda-local -l index.js -e event.json

