var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

/********************************************************\
 * This is the SendMessage lambda. This lambda for the   *
 * simple lab has one functionality:                     *
 * 1. Send the message to every user.                    *
 *                                                       *
 * For the extended lab the functionality is different:  *
 * 1. Send the messge to every user in the same room.    *
 * 2. Store the message in a dynamoDB table.             *
 \*******************************************************/
exports.handler = async (event) => {
    const { value, room, name } = JSON.parse(event.body);    
    const { TABLE_CR } = process.env;
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
        await db.scan({TableName: TABLE_CR}).promise()
        .then((data) => {
            returnVal.body.scanStatus = "SUCCESS";
            connectionData = data.Items.map((elem) => {return elem.ID});
        });
        console.log(connectionData);
        for (let connectionId of connectionData) {
            try {
                await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
            } catch (e) {
                if (e.statusCode == 410) {
                    await db.delete({TableName: TABLE_CR, Key: { ID: connectionId }}).promise();
                }
            }
        }
        returnVal.body = JSON.stringify(returnVal.body);
        return returnVal;
    }

    const { TABLE_RMU } = process.env;
    const scanParams = {
        TableName : TABLE_RMU,
        ExpressionAttributeValues: {":r": room},
        FilterExpression: "room = :r",
        ProjectionExpression: "#users",
        ExpressionAttributeNames: {"#users": "users"}
    };

    let connectionData;
    await db.scan(scanParams).promise()
    .then((data) => {
        returnVal.body.scanStatus = "SUCCESS";
        console.log(data.Items[0]);
        connectionData = data.Items[0].users.map((elem) => {
            return elem;
        });
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
                    TableName: TABLE_RMU, 
                    Key: { room: room },
                    UpdateExpression: 'REMOVE #users[' + count + ']',
                    ExpressionAttributeNames: {
                        '#users': 'users'
                    }
                };
                await db.update(updateParams).promise()
                .then(() => {
                    console.log("SUCCESS");
                })
                .catch((err) => {
                    console.log("ERROR during deleting old connection", err);
                });
                await db.delete({TableName: TABLE_CR, Key: { ID: connectionId }}).promise();
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
        TableName: TABLE_RMU,
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
