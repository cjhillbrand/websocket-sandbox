var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

/**
 * There are two main goals of thie lambda function:
 * 1. Store the message in dynamoDB.
 * 2. Dispatch the message to every individual in the room.
 * 3. To accurately get the room we must first create join room...
 * (2 may be a little hard since we will have to use the API Gateway HTTPS
 * request)
 */
exports.handler = async (event) => {
    //const {name, value, room} = event.body;
    console.log(event)
    const { value, room, name } = JSON.parse(event.body);
    var dynamodb = new AWS.DynamoDB();

    var message = JSON.stringify({
        message: value, 
        user: name,
        type: "client-message"
    });
    // Gather all of the connectionIDs that are linked to the room.
    const readResponse = await getConnectionIds(dynamodb, room);
    let connectionData = readResponse.Items.map(function(elem) {
        return elem.ID.S;
    })
    // Now we have to dispatch a message to all of the connectionIDs
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });
    const postCalls = connectionData.map(async ( connectionId ) => {
        try {
          await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
        } catch (e) {
          if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            await dynamodb.deleteItem({TableName: "id-room", Key: { "ID": {S :connectionId }}})
            await dynamodb.deleteItem({TableName: "client-records", Key: { "ID": {S: connectionId }}})
          } else {
            throw e;
          }
        }
    });
    Promise.all(postCalls);

    const response = {
        statusCode: 200,
        body: JSON.stringify('Body Sent'),
    };
    return response;
};

function getConnectionIds(dynamodb, room) {
    var params = {
        TableName : "id-room",
        ExpressionAttributeNames: {
            "#R": "Room",
            "#ID": "ID"
        },
        ExpressionAttributeValues: {
            ":r" : {
                S: room
            }
        },
        FilterExpression: "#R = :r",
        ProjectionExpression: "#ID",
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
