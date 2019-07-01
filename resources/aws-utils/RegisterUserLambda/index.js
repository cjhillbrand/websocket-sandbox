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
    console.log("EVENT FROM REGISTER", event);
    var dynamoDB = new AWS.DynamoDB({region: 'us-east-1', apiversion: '2012-08-10'});
    var connectionId = event.requestContext.connectionId;
    var body = event.body;
    var username = JSON.parse(body).value;
    const writeParams = {
        TableName: "client-records",
        Key: {"ID": 
            {S: connectionId}
        },
        ExpressionAttributeNames: {
            "#N": "name"
        },
        ExpressionAttributeValues: {
            ":name": {
                S: username
            }
        },
        UpdateExpression: "SET #N = :name",
        ReturnValues: "ALL_NEW"
    };
    const readParams = {
        TableName: "id-room",
        ProjectionExpression: "Room",
    };
    const update = await updateData(dynamoDB, writeParams);
    let readResponse = await readData(dynamoDB, readParams);
    let rooms = readResponse.Items.map(function(elem) {
        return elem.Room.S;
    })
    console.log(rooms)
    var responseBody = {
        "type": "signup",
        "connectionID": connectionId,
        "success": true,
        "rooms": rooms
    };
    var response = {
        isBase64Encoded: false,
        statusCode: 200,
        body: JSON.stringify(responseBody)
    }
    return response;
}

function updateData(dynamoDB, writeParams) {
    return new Promise(function(resolve, reject) {
        dynamoDB.updateItem(writeParams, function(err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log(data);
                resolve(err);
            }   
        });
    })
}

function readData(dynamoDB, readParams) {
    return new Promise(function(resolve, reject) {
        dynamoDB.scan(readParams, function(err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log(data)
                resolve(data);
            }
        })
    })
    
}