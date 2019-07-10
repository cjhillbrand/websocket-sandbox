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
    const { connectionId } = event.requestContext;
    const db = new AWS.DynamoDB.DocumentClient();
    var returnVal = {
        statusCode: 200,
        body: {}
    };
    
    const writeParam = {
        TableName: "room-messages-users",
        Item: {'room': value, users: [connectionId]},
    }

    // We handle uniqueness on the client side. Not sure if 
    // we should double check here for concurruncy issues...
    const write = await db.put(writeParam).promise()
    .then(() => {
        returnVal.body.write = "SUCCESS";
    })
    .catch(err => {
        console.log("ERROR WRITE", err);
        returnVal.body.write = "FAIL";
    });
    
    let connectionData;
    let scanParams = {
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

    let count = 0;
    for (let connectionId of connectionData) {
        console.log(count);
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                const updateParams = {
                    TableName: "room-messages-users", 
                    Key: { room: room },
                    UpdateExpression: 'REMOVE #users[' + count + ']',
                    ExpressionAttributeNames: {
                        '#users': 'users'
                    }
                };
                await db.update(updateParams).promise()
                .then(() => {
                    console.log("SUCCESS")
                })
                .catch((err) => {
                    console.log("ERROR during deleting old connection", err);
                });
                await db.delete({TableName: "client-records", Key: { ID: connectionId }}).promise();
                count--;
            } else {
                returnVal.body.dispatchStatus = "FAIL";
                throw e;
            }
        }
        count++;
    }
    returnVal.body.dispatchStatus = "SUCCESS";

    returnVal.body = JSON.stringify(returnVal.body);
    console.log(' RETURNVAL - FINAL:' , returnVal);
    return returnVal;
}