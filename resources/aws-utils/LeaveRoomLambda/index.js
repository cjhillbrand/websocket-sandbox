var AWS = require('aws-sdk');


/*******************************************************************************\
 * This is the LeaveRoom Lambda function for the route leave-room.              *
 * For the Extended Lab this lambda function has several functionalities        *
 * including the one from the simple lab.                                       *
 * 1. If the user that is disconnecting from the room is the last person.       *
 *    we delete the room from dynamoDB                                          *
 * 2. If the room is deleted we tell every other client that room is no longer  *
 *    avaialable                                                                *
 * 3. Else we just remove the user from the list of users in the room           *
 \******************************************************************************/
exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { connectionId, domainName, stage } = event.requestContext;
    const { room } = JSON.parse(event.body); 
    const { TABLE_CR, TABLE_RMU } = process.env;
    let returnVal = {
        statusCode: 200,
        body: { }
    };

    await db.update({
        TableName: TABLE_CR,
        Key: {ID: connectionId},
        UpdateExpression: 'REMOVE #room',
        ExpressionAttributeNames: {'#room': 'room'}
    }).promise()
    .then(() => {
        returnVal.body.updateStatus = "SUCCESS";
    })
    .catch((err) => {
        console.log('ERROR on UPDATE: ', err);
        returnVal.body.updateStatus = "FAIL";
    });


    let params = {
        TableName: TABLE_RMU,
        Key: {room: room},
        AttributesToGet: ['users']
    };
    let connections;
    // We need the connections for two reasons.
    // 1. this allows us to see if we are the last in the room
    // 2. We have the index to remove the user from the array
    await db.get(params).promise()
    .then((data) => {
        console.log(data);
        connections = data.Item.users;
        returnVal.body.getStatus = "SUCCESS";
    })
    .catch((err) => {
        console.log("ERROR on GET: ", err);
        returnVal.body.getStatus = "FAIL";
    });


    if (connections.length == 1) {
        // Delete the room from dynamo
        await db.delete({
            TableName: TABLE_RMU,
            Key: {room: room}
        }).promise()
        .then(() => {
            returnVal.body.deleteRoomStatus = "SUCCESS";
        })
        .catch((err) => {
            console.log("ERROR on DELETE ROOM: ", err);
        });
        let connectionData;
        // Get everyone else we need to notify that the room has
        // been deleted
        await db.scan({
            TableName: TABLE_CR,
        }).promise()
        .then((data) => {
            returnVal.body.scanStatus = "SUCCESS";
            connectionData = data.Items.map((elem) => {
                return elem.ID;
            })
        })
        .catch((err) => {
            console.log("ERROR on SCAN: ", err);
            returnVal.body.scanStatus = "FAIL";
        });
        const message = JSON.stringify({
            type: "delete-room",
            room: room
        });
        console.log(`Domain name: ${domainName} Stage: ${stage}`);
        const apigwManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: domainName + '/' + stage
        });
        // Tell everyone that the room was deleted
        // const postCalls = connectionData.map( async (connectionId) => {
        for (let connectionId of connectionData) {
            try {
                console.log(`Posting to ${connectionId}`);
                await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    console.log(`Found stale connection, deleting ${connectionId}`);
                    await db.delete({TableName: TABLE_CR, Key: { ID: connectionId }}).promise();
                } else {
                    console.log("DISPATCH TO CONNECTION FAIL", e);
                }
            }
        }
    } else {
        // The room still has someone in it.
        // So we just need to remove that connectionID
        // from that room.
        const removeParams = {
            TableName: TABLE_RMU,
            Key: {room: room},
            UpdateExpression: 'REMOVE #users[' + connections.indexOf(connectionId) + ']',
            ExpressionAttributeNames: {
                '#users': 'users'
            }
        };
        await db.update(removeParams).promise()
        .then(() => {
            console.log('REMOVE SUCCESS');
        })
        .catch((err) => {
            console.log('REMOVE FAIL');
        });
    }
    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
};