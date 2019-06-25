var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = (event, context, callback) => {
    console.log(event)
    console.log(context)
    var request = new AWS.DynamoDB({region: 'us-east-1', apiversion: '2012-08-10'})
    var params = {
        TableName: 'client-records',
        Item: {
            ID: {S: 'CJ23'}
        }
    }
    var response = request.putItem(params, function(err, data) {
        err ? console.log("Error", err) : console.log("success", data)
    })
    Promise.bind(response)
    var returnValue = {
        isBase64Encoded: false,
        statusCode: 200,
        body: JSON.stringify({
          "name": "CJ"  
        })
    }
    callback(null, returnValue)
}