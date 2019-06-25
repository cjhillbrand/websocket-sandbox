echo "Creating Zip file"
zip lambda.zip index.js
echo "Deploying Lambda function to AWS"
aws lambda update-function-code --function-name dispatchMessage --zip-file fileb://lambda.zip
echo "Cleaning up :)"
rm -rf lambda.zip
