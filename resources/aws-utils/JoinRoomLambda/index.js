var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})


// The purpose of this lambda function is to be able
// to let a user join a pre-existing chat room. 
// This function will wrtie to dynamoDB the room
// and connection ID to the id-room table

// This lambda has to also return all of the messages in that
// current room
exports.handler = async (event) => {
    var dynamodb = new AWS.DynamoDB();
    var connectionId = event.requestContext.connectionId;
    var room = JSON.parse(event.body).value;
    var params = {
        TableName: "id-room",
        Item: {
            'ID': {S: connectionId},
            'Room': {S: room}
        }
    }
    try {
        await dynamodb.putItem(params).promise();
    } catch (e) {
        console.log(e);
    }
    return {statusCode: 200, body: JSON.stringify("Write success")}


}