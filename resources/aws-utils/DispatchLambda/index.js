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
    const time = new Date();
    var returnVal = {
        statusCode: 200,
        body: {}
    };

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    var message = JSON.stringify({
        message: value, 
        user: name,
        type: "client-message"
    });

    if (name == "no-rooms") {
        let connectionData
        await db.scan({TableName: "client-records"}).promise()
        .then((data) => {
            returnVal.body.scanStatus = "SUCCESS";
            connectionData = data.Items.map((elem) => {return elem.ID} )
        });
        console.log(connectionData);
        for (let connectionId of connectionData) {
            try {
                await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
            } catch (e) {
                if (e.statusCode == 410) {
                    await db.delete({TableName: "client-records", Key: { ID: connectionId }}).promise();
                }
            }
        }
        returnVal.body = JSON.stringify(returnVal.body);
        return returnVal;
    }

    const scanParams = {
        TableName : "room-messages-users",
        ExpressionAttributeValues: {":r": room},
        FilterExpression: "room = :r",
        ProjectionExpression: "#users",
        ExpressionAttributeNames: {"#users": "users"}
    };

    let connectionData;
    const scan = await db.scan(scanParams).promise()
    .then((data) => {
        returnVal.body.scanStatus = "SUCCESS";
        console.log(data.Items[0]);
        connectionData = data.Items[0].users.map((elem) => {
            return elem;
        })
    })
    .catch((err) => {
        console.log("SCAN ERROR", err);
        returnVal.body.scanStatus = "FAIL";
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
    await db.update({
        TableName: "room-messages-users",
        Key: {room: room},
        ExpressionAttributeNames: {
            '#messages': 'messages'
        },
        ExpressionAttributeValues: {
            ':messages': [{
                user: name,
                content: value,
                time: time.toLocaleString(undefined, {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            }],
            ':empty_list': []
        },
        UpdateExpression: 'set #messages = list_append(if_not_exists(#messages, :empty_list), :messages)',
    }).promise()
    .catch((err) => {
        console.log("ERROR during place: ", err);
        returnVal.body.putStatus = "FAIL";
    })
    .then(() => {
        returnVal.body.putStatus = "SUCCESS";
    });

    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
};
