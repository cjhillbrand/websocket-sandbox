var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

/*********************************************************************\
 * This is the create room lambda function. This function is used for *
 * the Extended lab, if you are doing the simple lab you can          *
 * ignore this file.                                                  *
 * This lambda has two main functionalities                           *
 * 1. Write to dynamo that there is a new room available              *
 * 2. Tell all the other users that there is a new room available.    *
 \********************************************************************/

exports.handler = async (event) => {
    console.log(' EVENT:',event);
    const { value } = JSON.parse(event.body);
    const { connectionId } = event.requestContext;
    const db = new AWS.DynamoDB.DocumentClient();
    var returnVal = {
        statusCode: 200,
        body: {}
    };
    
    const transactWriteParam = {
        TransactItems: [{
            Put: {
                TableName: 'room-messages-users',
                Item: {'room': value, users: [connectionId]}
            }
        }, {
            Update: {
                TableName: 'client-records',
                Key: { ID: connectionId },
                UpdateExpression: "set #R = :room",
                ExpressionAttributeNames: {"#R": "room"},
                ExpressionAttributeValues: {":room": value},
            }
        }]
    };

    await db.transactWrite(transactWriteParam).promise()
    .then(() => {
        returnVal.body.transactWrite = "SUCCESS";
    })
    .catch((err) => {
        console.log("ERROR on TRANSACTION: ", err);
        returnVal.body.transactWrite = "FAIL";
    })
    
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

    for (let connectionId of connectionData) {
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                await db.delete({TableName: "client-records", Key: { ID: connectionId }}).promise();
            } else {
                returnVal.body.dispatchStatus = "FAIL";
                throw e;
            }
        }
    }
    returnVal.body.dispatchStatus = "SUCCESS";

    returnVal.body = JSON.stringify(returnVal.body);
    console.log(' RETURNVAL - FINAL:' , returnVal);
    return returnVal;
}