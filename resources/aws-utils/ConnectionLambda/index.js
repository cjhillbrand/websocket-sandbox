var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})


/** 
 * This is the lambda function connected to the $connect route in APIGateway
 * websocket. The main requirements for this function are:
 * 1. Write to DynamoDB the connectionID, domain and stage
*/


exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { domainName, stage, connectionId } = event.requestContext;
    var params = {
        TableName: 'client-records',
        Item: {
            ID: connectionId,
            domain: domainName,
            stage: stage
        }
    }

    var returnValue = {
        isBase64Encoded: false,
        statusCode: 200,
        body: null
    }

    const response = await db.put(params, function(err, data) {
        if (err) returnValue.body = JSON.stringify("DB-FAILURE");
        if (data) returnValue.body = JSON.stringify("DB-SUCCESS");
    }).promise();

    return returnValue;
}