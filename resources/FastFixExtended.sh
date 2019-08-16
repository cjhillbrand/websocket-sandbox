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
    crName=${upperEnvName}Client-Records

    echo $upperEnvName $region $apiId $crArn
    $(echo sam package --template-file FastFixExtended.yml --output-template-file packaged-ExtendedFF.yaml --s3-bucket ${envName}lambdas.app)
    $(echo aws cloudformation deploy --template-file ./packaged-ExtendedFF.yaml --stack-name ${envName}ExtendedFF --capabilities CAPABILITY_IAM\
    --parameter-overrides FunctionNamePrefix=${upperEnvName} ApiId=${apiId} ClientRecordsArn=${crArn} ClientRecordsName=${crName})
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

    deployViaSAM $envName $region $apiId $crArn
fi