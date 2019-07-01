#!/bin/sh
while :; do
  case $1 in
    --file)
        file=$2
        shift
        if [[ ! -z "${lambda}" ]]; 
        then 
            break 
        fi
        ;;
    --function) 
        lambda=$2
        shift
        if [[ ! -z "${file}" ]]; 
        then
            break
        fi
        ;;
    \?)
      echo "Invalid option: -$1" >&2
      exit 1
      ;;
    :)
      echo "Option -$1 requires an argument." >&2
      exit 1
      ;;
  esac
  shift 
done
if [ ! -d "$file" ]; then
    echo "Folder does not exist"
    echo "exiting..."
    exit
fi

echo "deploying lambda ${file} to function ${lambda}"

echo "Creating Zip file"
cd ${file}
zip lambda.zip index.js 2> /dev/null
echo "Deploying Lambda function to AWS"
{
    aws lambda update-function-code --function-name ${lambda} --zip-file fileb://lambda.zip 
} || {
    echo "Failed to deploy to lambda"
    echo "Make sure the name of your lambda function mathes the one on your AWS account"
}
echo "Cleaning up :)"
rm -rf lambda.zip
cd ..