#!/bin/bash

function removeQuotes() {
    retval=$1
    retval=${retval#\"}
    retval=${retval%\"}
    echo "$retval"
}

function deployViaSAM() {
    upperEnvName=$1
    envName=$(echo $1 | tr 'A-Z' 'a-z')
    region=$2
    apiId=$3
    crArn=$4
    apiRoleArn=$5
    crName=${upperEnvName}Client-Records

    echo $upperEnvName $region $apiId $crArn
    $(echo sam package --template-file FastFixExtended.yml --output-template-file packaged-ExtendedFF.yaml --s3-bucket ${envName}lambdas.app)
    $(echo aws cloudformation deploy --template-file ./packaged-ExtendedFF.yaml --stack-name ${envName}ExtendedFF --capabilities CAPABILITY_IAM\
    --parameter-overrides FunctionNamePrefix=${upperEnvName} ApiId=${apiId} ClientRecordsArn=${crArn} ClientRecordsName=${crName} ApiRoleArn=${apiRoleArn})
    $(rm -rf packaged-ExtendedFF.yaml)
}

function getApiId() {
    envName=$1
    apiIdCall=$(echo "aws apigatewayv2 get-apis --query 'Items[?contains(Name,\`"$envName"Chatroom\`)].ApiId|[0]'")
    apiId=$(removeQuotes $( eval $apiIdCall ))
    echo $apiId
}

function getClientRecords() {
    envName=$1
    accountId=$(aws sts get-caller-identity --output text --query 'Account')
    echo arn:aws:dynamodb:${region}:${accountId}:table/${envName}Client-Records
}

function getRegion() {
    region=$(aws configure get region)
    echo $region
}

function getApiRoleArn() {
    getApiRole=$(echo aws "iam list-roles --query 'Roles[?contains(RoleName,\`"$envName"WebSocketAPIRole\`)].Arn|[0]'")
    apiRoleArn=$(removeQuotes $( eval $getApiRole ))
    
    if [ -z "$apiRoleArn" ]; then
        echo "Make sure that you have created ${envName}WebSocketAPIRole before running this script."
        echo "The instructions to complete this task is located in Task 2; Step 2"
        exit 1
    fi
    echo $apiRoleArn
}

function updateEnvVariables() {
    envName=$1
    envVars=$(cat <<-EOF
{
    "Variables":{
        "TABLE_CR":"${envName}Client-Records",
        "TABLE_RMU":"${envName}Room-Messages-Users"
    }
}
EOF
    )
    updateLambdaCall=$(aws lambda update-function-configuration --function-name ${envName}SendMessage\
    --environment "$envVars")
    updateLambdaCall=$(aws lambda update-function-configuration --function-name ${envName}Disconnect\
    --environment "$envVars")
}

if [ "$1" == "" ]; then
    echo 
    echo "**ERROR**"
    echo At least the environment name must be provided
    echo 
    echo Usage:
    echo "source FastFixExtended.sh <envName>"
    echo
    echo example: source FastFixExtended.sh testenv
else
    envName=$(echo $1 | tr 'a-z' 'A-Z')
    region=$(getRegion) 
    apiId=$( getApiId $envName $region )
    crArn=$( getClientRecords $envName $region)
    apiRoleArn=$( getApiRoleArn $apiId )
    #deployViaSAM $envName $region $apiId $crArn $apiRoleArn
    updateEnvVariables $envName
fi