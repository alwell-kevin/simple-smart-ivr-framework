require('dotenv').config()
var express = require('express');
var bodyParser = require('body-parser');
var actions = require('./action.js');
var Nexmo = require('nexmo');
var nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.APPLICATION_ID,
    privateKey: process.env.PRIVATE_KEY_PATH,
}, {
    debug: true
});

var CONVERSATION_UUID;
var USER;

//*******NOTICE:********
//*******HANDLES SINGLE SESSION ONLY. */
//*******DUE TO FEATURE RESTRICTION ON DIALOGFLOW (NEED ENTERPRISE ACCOUNT ACCESS), NO SESSION_ID IS RETURNED WITH 'ACTION'. */
//*******EACH SESSION IS MAPPED TO A SINGLE NUMBER FOR DEMO PURPOSES. */

//********************ENVIRONMENT VARS********************
// API_KEY=
// API_SECRET=
// APPLICATION_ID=
// PRIVATE_KEY_PATH=
// NEXMO_NUMBER=
// DIALOGFLOW_NUMBER=
// BASE_URL=
// CONFERENCE_NAME=
// SALES_NUMBER=
// SUPPORT_NUMBER=
// NEXMO_ACCOUNT=
// NEXMO_PWD=
// muleURL=
//********************END ENVIRONMENT VARS********************

//********************INTENT LIST********************
//1. "live agent" 
//2. Connect me to support
//3. Connect me to sales
//4. what is my order status?
//5 "live agent" 
//Who is nexmo
//WHo is vonage
//WHo is kevin alwell
//what do you sell?
//********************END LIST********************


const port = process.env.PORT || 3000;
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/answer", (req, res) => {
    USER = req.query.from;
    CONVERSATION_UUID = req.query.uuid;

    var nexmo_ncco = {
        "action": "connect",
        "timeout": "0",
        "from": process.env.NEXMO_NUMBER,
        "endpoint": [{
            "type": "phone",
            "number": process.env.DIALOGFLOW_NUMBER
        }]
    }

    console.log("IN ANSWER: ", req.query, nexmo_ncco);
    res.send([nexmo_ncco]);
})

app.post("/event", (req, res) => {
    console.log("In event endpoint: ", req.body);

    res.sendStatus(200)
})


//EXAMPLE ACTION:

//     In Google endpoint:  { responseId: 'f10bb322-d48e-418c-ad20-c41e2cc3cd4c',
//   queryResult: 
//    { queryText: 'I\'m not a customer yet',
//      action: 'contact-sales-agent',
//      parameters: {phone:"17326157295"},
//      allRequiredParamsPresent: true,
//      fulfillmentText: 'Okay, I am going to connect you with a Sales agent. Please wait for a moment while I find someone who is available.',
//      fulfillmentMessages: [ [Object] ],
//      intent: 
//       { name: 'projects/dreamforce-voice-bot-2018/agent/intents/7c62dc72-24f8-41b9-b772-f4c1ef750d37',
//         displayName: 'contact-sales-agent' },
//      intentDetectionConfidence: 0.8,
//      languageCode: 'en-us' },
//   originalDetectIntentRequest: { source: 'GOOGLE_TELEPHONY', payload: { telephony: [Object] } },
//   session: 'projects/dreamforce-voice-bot-2018/agent/sessions/756t5aSJQzae-pGJowa2lg' }

// CALLED FROM DIALOG FLOW ACTION
app.all("/google", (req, res) => {
    console.log("************************************")
    console.log("GOOGLE REQ: ", req.body);
    console.log("************************************")

    //TODO:IDENTIFY DYNAMIC CONVERSATION
    //originalDetectIntentRequest: { source: 'GOOGLE_TELEPHONY', payload: { telephony: [Object] } }, <-- Need enterprise account to get this object. Otherwise, redacted.

    actions.escalate(req.body.queryResult.action, CONVERSATION_UUID);

    res.sendStatus(200)
})


app.all("/contact-sales-agent", (req, res) => {
    console.log("IN: contact-sales-agent")
    res.status(200).send([{
        "action": "connect",
        "timeout": "10",
        "from": USER,
        "endpoint": [{
            "type": "phone",
            "number": process.env.SALES_NUMBER
        }]
    }])
})

app.all("/contact-customer-service", (req, res) => {
    console.log("IN: customer service contact")
    res.status(200).send([{
        "action": "connect",
        "timeout": "10",
        "from": USER,
        "endpoint": [{
            "type": "phone",
            "number": process.env.SUPPORT_NUMBER
        }]
    }])
})

app.all("/order-status", (req, res) => {
    console.log("IN: order-status")
    res.status(200).send([{
        "action": "connect",
        "timeout": "10",
        "from": USER,
        "endpoint": [{
            "type": "phone",
            "number": process.env.SUPPORT_NUMBER
        }]
    }])
})

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})