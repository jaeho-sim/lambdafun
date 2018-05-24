'use strict'

var expect = require('chai').expect,  

lambdaToTest = require('./index')

// returns speechResponse when succeed,
// returns speedError when fail
class Context {
  constructor() {
    this.speechResponse = null;
    this.speechError = null;

    this.succeed = (rsp) => {
      this.speechResponse = rsp;
      this.done();
    };

    this.fail = (rsp) => {
      this.speechError = rsp;
      this.done();
    };
  }
}

// if valid response, all these should be true
var validRsp = (ctx,options) => {
     expect(ctx.speechError).to.be.null;
     expect(ctx.speechResponse.version).to.be.equal('1.0');
     expect(ctx.speechResponse.response).not.to.be.undefined;
     expect(ctx.speechResponse.response.outputSpeech).not.to.be.undefined;
     expect(ctx.speechResponse.response.outputSpeech.type).to.be.equal('SSML');
     expect(ctx.speechResponse.response.outputSpeech.ssml).not.to.be.undefined;
     expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/<speak>.*<\/speak>/);
     if(options.endSession) {
       expect(ctx.speechResponse.response.shouldEndSession).to.be.true;
       expect(ctx.speechResponse.response.reprompt).to.be.undefined;
     } else {
       expect(ctx.speechResponse.response.shouldEndSession).to.be.false;
       expect(ctx.speechResponse.response.reprompt.outputSpeech).to.be.not.undefined;
       expect(ctx.speechResponse.response.reprompt.outputSpeech.type).to.be.equal('SSML');
       expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/<speak>.*<\/speak>/);
     }

}

var validCard = (ctx, standardCard) => {
  expect(ctx.speechResponse.response.card).not.to.be.undefined;
  expect(ctx.speechResponse.response.card.title).not.to.be.undefined;
  if(standardCard) {
    expect(ctx.speechResponse.response.card.type).to.be.equal('Standard');
    expect(ctx.speechResponse.response.card.text).not.to.be.undefined;
    expect(ctx.speechResponse.response.card.image).not.to.be.undefined;
    expect(ctx.speechResponse.response.card.image.largeImageUrl).to.match(/^https:\/\//);
    expect(ctx.speechResponse.response.card.image.smallImageUrl).to.match(/^https:\/\//);
  }
  else {
    expect(ctx.speechResponse.response.card.type).to.be.equal('Simple');
    expect(ctx.speechResponse.response.card.type).not.to.be.undefined;  
  }
}

// var validCard = (ctx) => {
//   expect(ctx.speechResponse.response.card).not.to.be.undefined;
//   expect(ctx.speechResponse.response.card.type).to.be.equal('Simple');
//   expect(ctx.speechResponse.response.card.title).not.to.be.undefined;
//   expect(ctx.speechResponse.response.card.content).not.to.be.undefined;
// }



var event = {
  session: {
    new: false,
    sessionId: 'session1234',
    attributes: {},
    user: {
      userId: 'usrid123'
    },
    application: {
      applicationId: 'amzn1.echo-sdk-ams.app.1234'
    }
  },
  version: '1.0',
  request: {
    intent: {
      slots: {
        SlotName: {
          name: 'SlotName',
          value: 'slot value'
        }
      },
      name: 'intent name'
    },
    type: 'IntentRequest',
    requestId: 'request5678'
  }
};




describe('All intents', () => {
  // this Context object will hold the response
  var ctx = new Context();


  describe('Test LaunchIntent', () => {

    before((done) => {
      event.request.type = 'LaunchRequest';
      event.request.intent = {};
      event.session.attributes = {};
      ctx.done = done;
      lambdaToTest.handler(event , ctx);
    });


    it('valid response', () => {
      validRsp(ctx,{
        endSession: false,
      });
    });

    // specific to my skills
    it('valid outputSpeech', () => {
      expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/Welcome/);
    });

    // specific to my skills
    it('valid repromptSpeech', () => {
      expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/You can say/);
    });

  });


  // intent check
  describe(`Test HelloIntent`, () => {

    before((done) => {
      event.request.intent = {};
      event.session.attributes = {};
      event.request.type = 'IntentRequest';
      event.request.intent.name = 'HelloIntent';
      event.request.intent.slots = {
        FirstName: {
          name: 'FirstName',
          value: 'John'
        }
      };
      ctx.done = done;
      lambdaToTest.handler(event , ctx);
    });

    it('valid response', () => {
      validRsp(ctx, {
        endSession: true
      });
    });

    it('valid outputSpeech', () => {
     expect(ctx.speechResponse.response.outputSpeech.ssml).to.match(/Hello .*John.*. Good/);
    });

    // it('valid repromptSpeech', () => {
    //  expect(ctx.speechResponse.response.reprompt.outputSpeech.ssml).to.match(/<speak>For example.*<\/speak>/);
    // });

  });


});
