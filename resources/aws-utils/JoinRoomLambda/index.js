var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})


// The purpose of this lambda function is to be able
// to let a user join a pre-existing chat room. 
// This function will wrtie to dynamoDB the room
// and connection ID to the id-room table

// This lambda has to also return all of the messages in that
// current room
exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const connectionId = event.requestContext.connectionId;
    const room = JSON.parse(event.body).value;
    var params = {
        TableName: "id-room",
        Item: {'ID': connectionId, 'Room': room}
    };

    var returnVal = {
        statusCode: 200,
        body: {}
    };

    await db.put(params).promise()
    .catch((err) => {
        returnVal.body.writeStatus = "FAIL";
    })
    .then(() => {
        returnVal.body.writeStatus = "SUCCESS";
    });

    const scanParams = {
        TableName: "messages-room",
        FilterExpression: "room = :this_room",
        ExpressionAttributeValues: {":this_room": room}
    };
    await db.scan(scanParams).promise()
    .then((data) => {
        console.log(data);
        returnVal.body.scanStatus = "SUCCESS";
        let messages = data.Items.map((elem) => {return elem.message});
        returnVal.body.messages = [...new Set(messages)];
        returnVal.body.type = "multi-message";
    })
    .catch((err) => {
        console.log("FAIL: ", err);
        returnVal.body.scanStatus = "FAIL";
    });
    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
}