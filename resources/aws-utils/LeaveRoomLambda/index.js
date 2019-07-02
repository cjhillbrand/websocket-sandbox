var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { connectionId } = event.requestContext;
    var params = {
        TableName: "id-room",
        Key: {ID: connectionId}
    };

    var returnVal = {
        statusCode: 200,
        body: null
    };

    await db.delete(params, function(err,data) {
        if (err) returnVal.body = JSON.stringify("FAIL");
        else returnVal.body = JSON.stringify("SUCCESS")
    }).promise();

    return returnVal;
}