var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});


/******************************************************************\
 * This is the Join Room Lambda. This lambda is used in the       *
 * Extended lab. If you are doing the simple lab you can ignore   *
 * this function. This lambda has several functionalities:        *
 * 1. Update dynamoDB that a new user has joined a room           *
 * 2. Retrieve and return all messages that are in that room.     *
 \*****************************************************************/
exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { connectionId } = event.requestContext;
    const room = JSON.parse(event.body).value;

    const transactWriteParams = {
        TransactItems: [{
            Update: {
                TableName: "room-messages-users",
                Key: {room: room},
                ExpressionAttributeNames: {
                    '#users': 'users'
                },
                ExpressionAttributeValues: {
                    ':users': [connectionId],
                    ':empty_list': []
                },
                UpdateExpression: 'set #users = list_append(if_not_exists(#users, :empty_list), :users)'
            }
        }, {
            Update: {
                TableName: 'client-records',
                Key: { ID: connectionId },
                UpdateExpression: "set #R = :room",
                ExpressionAttributeNames: {"#R": "room"},
                ExpressionAttributeValues: {":room": room},
            }
        }]
    };

    var returnVal = {
        statusCode: 200,
        body: {}
    };

    await db.transactWrite(transactWriteParams).promise()
    .then(()=> {
        returnVal.body.transactWrite = "SUCCESS";
    })
    .catch((err) => {
        returnVal.body.transactWrite = "FAIL";
        console.log("FAIL on TRANSACTION ", err);
    });

    const scanParams = {
        TableName: "room-messages-users",
        FilterExpression: "room = :this_room",
        ExpressionAttributeValues: {":this_room": room}
    };

    await db.scan(scanParams).promise()
    .then((data) => {
        console.log(data);
        if (data.Items[0].messages) {
            returnVal.body.scanStatus = "SUCCESS";
            returnVal.body.messages = data.Items[0].messages.map((elem) => {return elem});
            returnVal.body.type = "multi-message";
        } else {
            returnVal.body.scanStatus = "EMPTY";
        }
        
    })
    .catch((err) => {
        console.log("FAIL: ", err);
        returnVal.body.scanStatus = "FAIL";
    });
    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
};