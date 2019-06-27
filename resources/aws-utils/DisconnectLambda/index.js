var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = async (event) => {
    console.log(event);
    var dynamoDB = new AWS.DynamoDB();
    const connectionID = event.requestContext.connectionId;
    var params = {
        Key: {
            "ID": {
                S: connectionID
            }
        },
        TableName: "client-records"
    }
    dynamoDB.deleteItem(params, function(err, data) {
        if (err) console.log(err);
         else console.log(data)
    })
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};