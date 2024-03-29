var AWS = require('aws-sdk');


/****************************************************************\
 * This is the Connect Lambda. This lambda is used in the       *
 * Simple and Extended lab.  This lambda has several            *
 * functionalities:                                             *
 * 1. Write to DynamoDB the connectionID, domain and stage      *
 \***************************************************************/
exports.handler = async (event) => {
    const db = new AWS.DynamoDB.DocumentClient();
    const { domainName, stage, connectionId } = event.requestContext;
    const { TABLE_CR } = process.env;
    var params = {
        TableName: TABLE_CR,
        Item: {
            ID: connectionId,
            domain: domainName,
            stage: stage
        }
    }

    var returnValue = {
        isBase64Encoded: false,
        statusCode: 200,
        body: {}
    };

    await db.put(params).promise()
    .then(() => {
        console.log("SUCCESS W/ PUT");
        returnValue.body.put = "SUCCESS";
    })
    .catch((err) => {
        console.log("FAIL W/ PUT", err);
        returnValue.body.put = "FAIL";
    });
    returnValue.body = JSON.stringify(returnValue.body);
    return returnValue;
};