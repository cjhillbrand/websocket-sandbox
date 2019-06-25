var AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-1'})

exports.handler = (event, context, callback) => {
    callback(null, {statusCode: 200})
}