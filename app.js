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
// muleURL=
// Garage Account
//********************END ENVIRONMENT VARS********************

//********************INTENT LIST********************
//2. Canadian Bacon and pineapple pizza please
//3. Connect me to an agent
//********************END LIST********************


//********************NOTE********************
// Ngrok url must be updated to DialogFlow fulfillment URL, Nexmo Voice application
//********************End Note********************

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

    //Dip into CRM here based on USER;

    var nexmo_ncco = {
        action: "connect",
        timeout: "0",
        from: process.env.NEXMO_NUMBER,
        endpoint: [{
            type: "phone",
            number: process.env.DIALOGFLOW_NUMBER
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
//      parameters: {phone:process.env.SALES_NUMBER},
//      allRequiredParamsPresent: true,
//      fulfillmentText: 'Okay, I am going to connect you with a Sales agent. Please wait for a moment while I find someone who is available.',
//      fulfillmentMessages: [ [Object] ],
//      intent: 
//       { name: 'projects/dreamforce-voice-bot-2018/agent/intents/7c62dc72-24f8-41b9-b772-f4c1ef750d37',
//         displayName: 'contact-sales-agent' },
//      intentDetectionConfidence: 0.8,
//      languageCode: 'en-us' },
//   originalDetectIntentRequest: { source: 'GOOGLE_TELEPHONY', payload: { telephony: [{phone:'17326157295'}] } },
//   session: 'projects/dreamforce-voice-bot-2018/agent/sessions/756t5aSJQzae-pGJowa2lg' }

// CALLED FROM DIALOG FLOW ACTION
app.all("/google", (req, res) => {
    console.log("************************************")
    console.log("GOOGLE REQ: ", req.body);

    if (req.body.queryResult.action === "order-pizza-yes") {
        sendDispatch();
    } else {
        actions.escalate(req.body.queryResult.action, CONVERSATION_UUID);
    }
    console.log("************************************")

    res.sendStatus(200)
})

app.all("/status", (req, res) => {
    console.log("DISPATCH STATUS: ", req.body);

    res.sendStatus(200)
})

app.all("/inbound", (req, res) => {
    console.log("INBOUND MESSAGES: ", req.body);

    res.sendStatus(200)
})

app.all("/agent-escalation", (req, res) => {
    console.log("IN: customer service contact");
    res.status(200).send([{
        action: "connect",
        timeout: "10",
        from: USER,
        endpoint: [{
            type: "phone",
            number: process.env.SUPPORT_NUMBER
        }]
    }])
})

app.all("/order-status", (req, res) => {
    console.log("IN: order-status")
    res.status(200).send([{
        action: "connect",
        timeout: "10",
        from: USER,
        endpoint: [{
            type: "phone",
            number: process.env.SUPPORT_NUMBER
        }]
    }])
})

var sendDispatch = () => {
    console.log("IN sendDispatch");

    nexmo.dispatch.create(
        "failover",
        [{
                from: {
                    type: "whatsapp",
                    number: process.env.NEXMO_NUMBER
                },
                to: {
                    type: "whatsapp",
                    number: process.env.SALES_NUMBER
                },
                message: {
                    content: {
                        type: "text",
                        text: "Joes Pizza - Thank you for your order of a Large Pizza half Canadian Bacon and half Pineapple. Expected delivery time is 4:45pm."
                    }
                },
                failover: {
                    expiry_time: 600,
                    condition_status: "delivered"
                }
            },
            {
                from: {
                    type: "sms",
                    number: process.env.NEXMO_NUMBER
                },
                to: {
                    type: "sms",
                    number: process.env.SALES_NUMBER
                },
                message: {
                    content: {
                        type: "text",
                        text: "Joes Pizza - Thank you for your order of a Large Pizza half Canadian Bacon and half Pineapple. Expected delivery time is 4:45pm."
                    }
                }
            },
            (err, data) => {
                console.log("IN DISPATCH CALLBACK", data.dispatch_uuid, error);
            }
        ])
}

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})