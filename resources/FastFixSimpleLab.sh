#!/bin/bash
# This script assumes that the IAM Role for API Gateway has already been made

function removeQuotes() {
    retval=$1
    retval=${retval#\"}
    retval=${retval%\"}
    echo "$retval"
}

function createWebSocket() {
    envName=$1
    region=$2
    accountId=$3

    # If this API Role does not exist than we should abandoned the script right away
    getApiRole=$(echo aws "iam list-roles --query 'Roles[?contains(RoleName,\`"$envName"WebSocketAPIRole\`)].Arn|[0]'")
    apiRoleArn=$(removeQuotes $( eval $getApiRole ))
    
    if [ -z "$apiRoleArn" ]; then
        echo "Make sure that you have created ${envName}WebSocketAPIRole before running this script."
        echo "The instructions to complete this task is located in Task 2; Step 2"
        exit 1
    fi

    connectCall=$(echo aws lambda get-function --function-name="$envName"Connect --query 'Configuration.FunctionArn' --output text)
    connectArn=$(removeQuotes $( eval $connectCall ))

    disconnectCall=$(echo aws lambda get-function --function-name="$envName"Disconnect --query 'Configuration.FunctionArn' --output text)
    disconnectArn=$(removeQuotes $( eval $disconnectCall ))
    
    sendMessageCall=$(echo aws lambda get-function --function-name="$envName"SendMessage --query 'Configuration.FunctionArn' --output text)
    sendMessageArn=$(removeQuotes $( eval $sendMessageCall ))

    if [ -z "$connectArn" ] || [ -z "$disconnectArn" ] || [ -z "$sendMessageArn" ]; then
        echo "One or more of your lambda functions are not deployed"
        echo "Please run `source deployLambdas.sh <envName>` before running this script"
        exit 1
    fi
    
    # Now we create the Web Socket now confident all preliminary resources have been created.
    websocketCreateCommand=$(echo aws apigatewayv2 --region "$region" create-api --name "$envName"Chatroom-WebSocket --protocol-type WEBSOCKET --route-selection-expression '\$request.body.action' --query ApiId --output text)
    websocketApiId=$(removeQuotes $( eval $websocketCreateCommand ))

    connectIntegration=$(aws apigatewayv2 create-integration --api-id $websocketApiId --integration-type AWS_PROXY --integration-method POST\
    --integration-uri arn:aws:apigateway:"$region":lambda:path/2015-03-31/functions/${connectArn}/invocations\
    --query IntegrationId --output text --credentials-arn "$apiRoleArn")

    connectId=$(aws apigatewayv2 --region "$region" create-route --api-id "$websocketApiId"\
    --route-key \$connect --output text --query RouteId --target integrations/"$connectIntegration")

    disconnectIntegration=$(aws apigatewayv2 create-integration --api-id $websocketApiId --integration-type AWS_PROXY --integration-method POST\
    --integration-uri arn:aws:apigateway:"$region":lambda:path/2015-03-31/functions/${disconnectArn}/invocations\
    --query IntegrationId --output text --credentials-arn "$apiRoleArn")

    disconnectId=$(aws apigatewayv2 --region "$region" create-route --api-id "$websocketApiId"\
    --route-key \$disconnect --output text --query RouteId --target integrations/"$disconnectIntegration")

    sendMessageIntegration=$(aws apigatewayv2 create-integration --api-id $websocketApiId --integration-type AWS_PROXY --integration-method POST\
    --integration-uri arn:aws:apigateway:"$region":lambda:path/2015-03-31/functions/${sendMessageArn}/invocations\
    --query IntegrationId --output text --credentials-arn "$apiRoleArn")

    sendMessageId=$(aws apigatewayv2 --region "$region" create-route --api-id "$websocketApiId"\
    --route-key dispatch --output text --query RouteId --target integrations/"$sendMessageIntegration")
    
    deploymentId=$(aws apigatewayv2 --region "$region" create-deployment --api-id "$websocketApiId" --query DeploymentId --output text)

    stageId=$(aws apigatewayv2 --region "$region" create-stage --api-id "$websocketApiId" --deployment-id "$deploymentId" --stage-name production)

    echo ${websocketApiId}
}

function getRegion() {
    region=$(aws configure get region)
    echo $region
}

if [ "$1" == "" ]; then
    echo 
    echo "**ERROR**"
    echo At least the environment name must be provided
    echo 
    echo Usage:
    echo "fixwebsocket <envName>"
    echo
    echo example: source FastFixSimpleLab.sh testenv
else
    envName=$(echo $1 | tr 'a-z' 'A-Z')
    region=$(getRegion) 
    accountId=$(aws sts get-caller-identity --output text --query 'Account')
    apiId=$( createWebSocket $envName $region $accountId )
    URL="wss://${apiId}.execute-api.${region}.amazonaws.com/production"
    ARN="arn:aws:execute-api:"$region":"$accountId":"$apiId"/*"
    echo "WebSocket URL is: ${URL}"
    echo "WebSocket ARN is ${ARN}"
fi