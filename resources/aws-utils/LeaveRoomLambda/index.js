var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { connectionId } = event.requestContext;
    const { room } = JSON.parse(event.body); 
    var params = {
        TableName: "room-messages-users",
        Key: {room: room},
        AttributesToGet: ['users']
    };
    let connections;
    await db.get(params).promise()
    .then((data) => {
        console.log(data);
        connections = data.Item.users;
    });


    if (connections.length == 1) {
        await db.delete({
            TableName: "room-messages-users",
            Key: {room: room}
        }).promise();
    } else {
        const removeParams = {
            TableName: "room-messages-users",
            Key: {room: room},
            UpdateExpression: 'REMOVE #users[' + connections.indexOf(connectionId) + ']',
            ExpressionAttributeNames: {
                '#users': 'users'
            }
        };
        await db.update(removeParams).promise()
        .then(() => {
            console.log('REMOVE SUCCESS');
        })
        .catch((err) => {
            console.log('REMOVE FAIL');
        })
    }

    var returnVal = {
        statusCode: 200,
        body: null
    };
    // Add callback so if the room is deleted it gets
    // deleted from the UI as well.
    

    return returnVal;
}