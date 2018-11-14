var Nexmo = require('nexmo');
var nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.APPLICATION_ID,
    privateKey: process.env.PRIVATE_KEY_PATH,
}, {
    debug: true
});

var escalate = (callPurpose, conversation_uuid) => {
    console.log("ESCALATING CALL: ", callPurpose, conversation_uuid);

    //Forward to SIP Leg.
    nexmo.calls.update(conversation_uuid, {
        action: 'transfer',
        destination: {
            "type": "ncco",
            "url": [process.env.BASE_URL + "/" + callPurpose]
        }
    }, (err, res) => {
        if (err) {
            console.error(err);
        } else {
            console.log(res);
        }
    });
}

module.exports.escalate = escalate;