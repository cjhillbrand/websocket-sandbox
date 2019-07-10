var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})
// May have to figure out how to delete them from a room 
// with no info on what room they are in
exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { connectionId } = event.requestContext;
    var params = {
        TableName: "client-records",
        Key: {"ID": connectionId}
    };
    var response = {
        statusCode: 200,
        body: { }
    };

    await db.delete(params).promise()
    .then(() => {
        response.body.delete = "SUCCESS";
    })
    .catch((err) => {
        response.body.delete = "FAIL";
    });
    response.body = JSON.stringify(response.body);
    return response;
};