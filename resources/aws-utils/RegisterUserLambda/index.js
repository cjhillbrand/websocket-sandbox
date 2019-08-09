var AWS = require('aws-sdk');

/*******************************************************************\
 * This is the Register User Lambda. This is for the extended lab   *
 * if you are doing the simple lab you can ignore this file. This   *
 * Function has several functionalities:                            *
 * 1. Update the connection ID with the user name that was chosen   *
 * 2. Return the list of rooms that are available for the user to   *
 * choose from.                                                     *
 \******************************************************************/
exports.handler = async(event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const connectionId = event.requestContext.connectionId;
    const username = JSON.parse(event.body).value;
    const { TABLE_CR, TABLE_RMU } = process.env;
    var returnVal = {
        statusCode: 200,
        body: {
            type: "signup",
        }
    };
    const updateParams = {
        TableName: TABLE_CR,
        Key: {ID: connectionId},
        UpdateExpression: "set #N = :name",
        ExpressionAttributeNames: {"#N": "name"},
        ExpressionAttributeValues: {":name": username},
    };
    await db.update(updateParams).promise()
    .then(() => {
        returnVal.body.updateStatus = "SUCCESS";
    })
    .catch((err) => {
        console.log("ERROR on UPDATE", err);
        returnVal.body.updateStatus = "FAIL";
    });

    const readParams = {
        TableName: TABLE_RMU,
        AttributesToGet: ['room']
    };

    await db.scan(readParams).promise()
    .then((data) => {
        let rooms = data.Items.map((elem) => {
            return elem.room;
        });
        rooms = [...new Set(rooms)];
        returnVal.body.rooms = rooms;
    })
    .catch((err) => {
        console.log("ERROR on READ", err);
        returnVal.body.rooms = "FAIL";
    });

    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
};
