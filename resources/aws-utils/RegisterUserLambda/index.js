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
    const update = await db.update(updateParams, function(err, data) {
        if (err) returnVal.body.updateStatus = "UPDATE-FAIL";
        else returnVal.body.updateStatus = "UPDATE-SUCCESS";
    }).promise();

    const readParams = {
        TableName: "id-room",
        AttributesToGet: ['Room']
    };

    const read = await db.scan(readParams, function(err, data) {
        if (err) returnVal.body.readStatus = "READ-FAIL";
        else returnVal.body.readStatus = "READ-SUCCESS";
    }).promise();

    Promise.all([update, read]);
    let rooms = read.Items.map(function(elem) {
        return elem.Room;
    })
    rooms = [...new Set(rooms)];
    returnVal.body.rooms = rooms;
    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
}
