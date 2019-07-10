var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

/**
 * This lambda function has the purpose of registering a user into
 * the chat room so they can be identifiable by 'humans' easier.
 * This lambda does talk to dynamoDB and does two operations on the DB.
 * 1. Write to the DB to update the client-records 'name'
 * 2. Read the table id-room db to retrieve any possible rooms.
 */
exports.handler = async(event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const connectionId = event.requestContext.connectionId;
    const username = JSON.parse(event.body).value;
    var returnVal = {
        statusCode: 200,
        body: {
            type: "signup",
        }
    }
    const updateParams = {
        TableName: "client-records",
        Key: {ID: connectionId},
        UpdateExpression: "set #N = :name",
        ExpressionAttributeNames: {"#N": "name"},
        ExpressionAttributeValues: {":name": username},
    }
    await db.update(updateParams).promise()
    .then(() => {
        returnVal.body.updateStatus = "SUCCESS";
    })
    .catch((err) => {
        console.log("ERROR on UPDATE", err);
        returnVal.body.updateStatus = "FAIL";
    });

    const readParams = {
        TableName: "room-messages-users",
        AttributesToGet: ['room']
    };

    const read = await db.scan(readParams).promise()
    .then((data) => {
        rooms = data.Items.map((elem) => {
            return elem.room;
        })
        rooms = [...new Set(rooms)];
        returnVal.body.rooms = rooms;
    })
    .catch((err) => {
        console.log("ERROR on READ", err);
        returnVal.body.rooms = "FAIL"
    });

    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
}
