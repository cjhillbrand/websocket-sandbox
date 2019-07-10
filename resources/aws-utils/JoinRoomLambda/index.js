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
    const { connectionId } = event.requestContext;
    const room = JSON.parse(event.body).value;

    const updateParams = {
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
    };

    var returnVal = {
        statusCode: 200,
        body: {}
    };
    await db.update(updateParams).promise()
    .then(() => {
        console.log("Append Success");
    })
    .catch((err) => {
        console.log("ERROR APPENDING: ", err);
    });


    const scanParams = {
        TableName: "room-messages-users",
        FilterExpression: "room = :this_room",
        ExpressionAttributeValues: {":this_room": room}
    };

    await db.scan(scanParams).promise()
    .then((data) => {
        console.log(data);
        returnVal.body.scanStatus = "SUCCESS";
        returnVal.body.messages = data.Items[0].messages.map((elem) => {return elem});
        returnVal.body.type = "multi-message";
    })
    .catch((err) => {
        console.log("FAIL: ", err);
        returnVal.body.scanStatus = "FAIL";
    });
    returnVal.body = JSON.stringify(returnVal.body);
    return returnVal;
}