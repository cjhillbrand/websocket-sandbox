#!/bin/bash
function deployViaSAM() {
    upperEnvName=$1
    envName=$(echo $1 | tr 'A-Z' 'a-z')
    region=$2
    $(echo aws s3 mb s3://${envName}lambdas.app --region ${region})
    if [ $? != 0 ]; then
        echo "Failed to make bucket, try another Environment Name"
        exit 0
    fi
    $(echo sam package --template-file lambdas.yml --output-template-file packaged-lambdas.yaml --s3-bucket ${envName}lambdas.app)
    $(echo aws cloudformation deploy --template-file ./packaged-lambdas.yaml --stack-name ${envName}-PreLab-WebSocket-Stack --capabilities CAPABILITY_IAM --parameter-overrides FunctionNamePrefix=${upperEnvName})
    $(rm -rf packaged-lambdas.yaml)
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
    echo example: source deployLambdas.sh testenv
else
    envName=$(echo $1 | tr 'a-z' 'A-Z')
    region=$(getRegion) 
    deployViaSAM $envName $region
fi