var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

/**
 * There are two main goals of thie lambda function:
 * 1. Store the message in dynamoDB.
 * 2. Dispatch the message to every individual in the room.
 * 3. To accurately get the room we must first create join room...
 * (2 may be a little hard since we will have to use the API Gateway HTTPS
 * request)
 */
exports.handler = async (event) => {
    const { value, room, name } = JSON.parse(event.body);
    var db = new AWS.DynamoDB.DocumentClient();
    var returnVal = {
        statusCode: 200,
        body: {}
    };

    const scanParams = {
        TableName : "id-room",
        ExpressionAttributeValues: {":r": room},
        FilterExpression: "Room = :r",
        ProjectionExpression: "ID"
    };

    const scan = await db.scan(scanParams, function(err, data) {
        if (err) {
            console.log(err);
            returnVal.body.scanStatus = "SCAN-ERROR";
            returnVal.body = JSON.stringify(returnVal.body);
            return returnVal;
        }
        else returnVal.body.scanStatus = "SCAN-SUCCESS";
    }).promise();    
    
    connectionData = scan.Items.map(elem => {
        return elem.ID;
    });

    var message = JSON.stringify({
        message: value, 
        user: name,
        type: "client-message"
    });

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postCalls = connectionData.map(async ( connectionId ) => {
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                await db.delete({TableName: "id-room", Key: { ID: connectionId }}).promise();
                await db.delete({TableName: "client-records", Key: { ID: connectionId }}).promise();
            } else {
                returnVal.body.dispatchStatus = "FAIL";
                throw e;
            }
        }
    });
    Promise.all(postCalls);
    returnVal.body.dispatchStatus = "SUCCESS";
    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
};
