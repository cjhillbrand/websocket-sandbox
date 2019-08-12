#!/bin/bash
function deployViaSAM() {
    upperEnvName=$1
    envName=$(echo $1 | tr 'A-Z' 'a-z')
    region=$2
    echo $region
    echo $envName
    $(echo aws s3 mb s3://${envName}lambdas.app --region ${region})
    $(echo sam package --template-file lambdas.yml --output-template-file lambdas-packaged.yaml --s3-bucket ${envName}lambdas.app)
    $(echo aws cloudformation deploy --template-file ./lambdas-packaged.yaml --stack-name ${envName}-Stack --capabilities CAPABILITY_IAM --parameter-overrides FunctionNamePrefix=${upperEnvName})
}

function getRegion() {
    region=$(aws configure get region)
    echo $region
}

if [ "$1" == "" ]; then
    echo 
    echo "** ERROR**"
    echo At least the environment name must be provided
    echo 
    echo Usage:
    echo "fixwebsocket <envName>"
    echo
    echo example: source deployLambdas.sh testenv
else
    envName=$(echo $1 | tr 'a-z' 'A-Z')
    echo $envName
    region=$(getRegion) 
    deployViaSAM $envName $region
fi