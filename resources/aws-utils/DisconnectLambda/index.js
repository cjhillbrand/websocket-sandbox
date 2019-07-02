var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const connectionId = event.requestContext.connectionId;
    var params = {
        TableName: "client-records",
        Key: {"ID": connectionId}
    };
    var response = {
        statusCode: 200,
        body: {
            deleteOne: null,
            deleteTwo: null
        }
    };

    const deleteOne = await db.delete(params, function(err, data) {
        if (err) response.body.deleteOne = "DELETE-ONE-FAIL";
        else response.body.deleteOne = "DELETE-ONE-PASS";
    }).promise();

    params.TableName = "id-room";

    const deleteTwo = await db.delete(params, function(err, data) {
        if (err) response.body.deleteTwo = "DELETE-TWO-FAIL";
        else response.body.deleteTwo = "DELETE-TWO-PASS";
    }).promise();

    Promise.all([deleteOne, deleteTwo]);
    response.body = JSON.stringify(response.body);
    return response;
};