var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})


/** 
 * This is the lambda function connected to the $connect route in APIGateway
 * websocket. The main requirements for this function are:
 * 1. Write to DynamoDB the connectionID, domain and stage
*/


exports.handler = (event, context, callback) => {
    console.log("event", event)
    var request = new AWS.DynamoDB({region: 'us-east-1', apiversion: '2012-08-10'})
    var domain = event.requestContext.domainName;
    var stage = event.requestContext.stage;
    var connectionId = event.requestContext.connectionId;
    var params = {
        TableName: 'client-records',
        Item: {
            'ID': {S: connectionId},
            'domain': {S: domain},
            'stage': {S: stage}
        }
    }
    var returnValueBody = {
        domain: domain,
        stage: stage,
        connectionID: connectionId,
        successfullWrite: true
    };
    var response = request.putItem(params, function(err, data) {
        if (err) {
            console.log("error writing to db", err);
        } else {
            returnValueBody.successfullWrite = false;
            console.log("success writing to db", data);
        }
    })
    // TODO: Figure out the correct way to format the 'returnvalue" JSON object
    Promise.bind(response)
    
    var returnValue = {
        isBase64Encoded: false,
        statusCode: 200,
        body: JSON.stringify(returnValueBody)
    }
    callback(null, returnValue);
}