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
    console.log(' EVENT:',event);
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
    const write = await db.put(writeParam).promise()
    .then(() => {
        returnVal.body.write = "SUCCESS";
    })
    .catch(err => {
        returnVal.body.write = "FAIL";
    });
    
    let connectionData;
    const scanParams = {
        TableName : "client-records"
    };

    const scan = await db.scan(scanParams).promise()
    .then(val => {
        returnVal.body.scan = "SUCCESS";
        console.log("INSIDE SCAN: ", val);
        connectionData = val.Items.map(elem => {
            return elem.ID;
        });
    })
    .catch(err => {
        returnVal.body.scan = "FAIL";
        throw err;
    });

    console.log(' RETURNVAL:' , returnVal);
    
    const message = JSON.stringify({
        type: "single-room",
        message: value
    });

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postCalls = connectionData.map(async ( connectionId ) => {
        console.log('POSTCALLS:', connectionId);
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise()
        .then(() => console.log("SUCCESS sending to: ", connectionId))
        .catch(e => {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                db.delete({TableName: "id-room", Key: { ID: connectionId }});
                db.delete({TableName: "client-records", Key: { ID: connectionId }});
            } else {
                console.log("ERROR line 67");
                returnVal.body.dispatchStatus = "FAIL";
                throw e;
            }
        })
    });
    Promise.all(postCalls)
    .then(() => {
        console.log("All promises sent");
    });
    returnVal.body.dispatchStatus = "SUCCESS";
    returnVal.body = JSON.stringify(returnVal.body);
    console.log(' RETURNVAL - FINAL:' , returnVal);
    return returnVal;
}