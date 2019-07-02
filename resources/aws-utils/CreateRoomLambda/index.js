var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

/**
 * This is the create room lambda function.
 * This lambda has two main functionalities
 * 1. Write to dynamo that there is a new room available
 * 2. Tell all the other users that there is a new room available.
 * 
 */

exports.handler = async (event) => {
    const { value } = JSON.parse(event.body);
    const connectionId = event.requestContext.connectionId;
    const db = new AWS.DynamoDB.DocumentClient();
    var returnVal = {
        statusCode: 200,
        body: {}
    };
    console.log(value, connectionId);
    const writeParam = {
        TableName: "id-room",
        Item: {'ID': connectionId,'Room': value}
    }

    const write = await db.put(writeParam, function(err, data) {
        if (err) returnVal.body.read = "FAIL";
        else returnVal.body.read = "SUCCESS";
    }).promise();

    const scanParams = {
        TableName : "client-records"
    };

    const scan = await db.scan(scanParams, function(err, data) {
        if (err) {
            console.log(err);
            returnVal.body.scanStatus = "FAIL";
            returnVal.body = JSON.stringify(returnVal.body);
            return returnVal;
        }
        else returnVal.body.scanStatus = "SUCCESS";
    }).promise();
    console.log(returnVal);
    connectionData = scan.Items.map(elem => {
        return elem.ID;
    });

    const message = JSON.stringify({
        type: "single-room",
        message: value
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
}