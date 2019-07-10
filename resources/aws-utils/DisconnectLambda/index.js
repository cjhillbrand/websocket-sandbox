var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})
// May have to figure out how to delete them from a room 
// with no info on what room they are in
exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { connectionId, domainName, stage } = event.requestContext;
    console.log(event);
    var params = {
        TableName: "client-records",
        Key: {"ID": connectionId},
        ReturnValues: 'ALL_OLD'
    };
    var returnVal = {
        statusCode: 200,
        body: { }
    };

    let room;
    await db.delete(params).promise()
    .then((data) => {
        returnVal.body.delete = "SUCCESS";
        room = data.Attributes.room;
    })
    .catch((err) => {
        returnVal.body.delete = "FAIL";
    });
    
    params = {
        TableName: "room-messages-users",
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

    if (room) {
        if (connections.length == 1) {
            // Delete the room from dynamo
            await db.delete({
                TableName: "room-messages-users",
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
                TableName: "client-records",
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
                        await db.delete({TableName: "client-records", Key: { ID: connectionId }}).promise();
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
                TableName: "room-messages-users",
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
            })
        }
    }

    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
};