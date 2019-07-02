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
        body: null
    };

    await db.put(params, function(err,data) {
        if (err) returnVal.body = JSON.stringify("WRITE-ERROR");
        else returnVal.body = JSON.stringify("WRITE-SUCCESS")
    }).promise();

    return returnVal;
}