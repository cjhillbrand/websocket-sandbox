var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = async (event) => {
    console.log(event)
    var payload = JSON.parse(event.body);
    var dynamodb = new AWS.DynamoDB();
    var request = {
        "Select": "SPECIFIC_ATTRIBUTES",
        "AttributesToGet": ["ID"],
        "ConsistentRead": true,
        "TableName": "client-records"
    }
    dynamodb.scan(request, function(err, data) {
        if (err) console.log(err)
        else console.log(data)
    });
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};