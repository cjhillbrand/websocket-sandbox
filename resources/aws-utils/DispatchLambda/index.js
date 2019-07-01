var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})
/**
 * There are two main goals of thie lambda function:
 * 1. Store the message in dynamoDB.
 * 2. Dispatch the message to every individual in the room.
 * 
 * (2 may be a little hard since we will have to use the API Gateway HTTPS
 * request)
 */
exports.handler = async (event) => {
    console.log(event)
    var room = JSON.parse(event.body).value;
    var dynamodb = new AWS.DynamoDB();
    const connectionIds = await getConnectionIds(dynamodb, room);
    console.log(connectionIds);
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

function getConnectionIds(dynamodb, room) {
    var params = {
        TableName : "id-room",
        KeyConditionExpression: "#room = :room",
        ExpressionAttributeNames:{
            "#room": "Room"
        },
        ExpressionAttributeValues: {
            ":room": {
                S: room
            }
        }
    };
    var scanparams = {
        TableName: "id-room",
        PorjectionExpression: "ID"
    };
    return new Promise(function(resolve, reject) {
        dynamodb.scan(params, function(err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log(data);
                resolve(data);
            }
        })
    })
}