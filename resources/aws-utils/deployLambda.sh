#!/bin/sh
echo "Enter a number that designates which Lambda function to deploy: "
echo "1) Connect"
echo "2) Register"
echo "3) JoinRoom"
echo "4) Dispatch"
read number
case $number in
    1)
        path="ConnectionLambda/"
        func="onConnectionFunction"
        ;;
    2)
        path="RegisterUserLambda/"
        func="registerUser"
        ;;
    3) 
        path="JoinRoomLambda"
        func="joinRoom"
        ;;
    4)
        path="DispatchLambda"
        func="dispatchMessage"
        ;;
esac

echo "deploying lambda ${path} to function ${func}"

echo "Creating Zip file"
cd ${path}
zip lambda.zip index.js 2> /dev/null
echo "Deploying Lambda function to AWS"
{
    aws lambda update-function-code --function-name ${func} --zip-file fileb://lambda.zip 2> /dev/null
    echo "Success deploying"
} || {
    echo "Failed to deploy to lambda"
    echo "Make sure the name of your lambda function mathes the one on your AWS account"
}
echo "Cleaning up :)"
rm -rf lambda.zip
cd ..