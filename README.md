# Websocket-Lab
Welcome to the Websocket-Lab. The purpose of this lab is to introduce yourself to the AWS Websocket capability.
Released on December 18, 2018, this service is still fairly new. The good news is, is that this service piggie
backs off of the well established API Gateway. (To read more about the release please visit [here](https://aws.amazon.com/blogs/compute/announcing-websocket-apis-in-amazon-api-gateway/)). 

Please refer below for a short description of the services used in this lab:
* **IAM Roles and Policies**: AWS offers users the IAM service to users as a way to enhance security among the products that they use.
The IAM roles and policies are used in this lab to help limit the amount of access some of our products can have to other products.
To read more please visit: [here](https://aws.amazon.com/iam/).
(Maybe we will also use this for IAM identity pools in cognito... who knows)
* **AWS Lambda**: The cornerstone product in AWS offerings of server-less products. This product is the backbone of our computing and business logic for our application. Lambda functions, are triggered by an event and when invoked execute a block of code. In this lab
Lambda is used as a receiver for when we send messages to our Websocket, and then handle those messages accordingly. 
To read more please visit: [here](https://aws.amazon.com/lambda/)
* **AWS DynamoDB**: AWS' trademark NoSQL database. DynamoDB is used in this lab to keep track of session information as users interact with 
the Chat room.
To read more please visit: [here](https://aws.amazon.com/dynamodb/)
* **AWS APIGateway**: APIGateway is used in this lab as the supplier of a websocket for our application. The APIGatway websocket configuration is setup as routes. Routes are pathways for messages to travel. For example if there is a route called "message" when
a message is sent to the APIGatway that containts the action as "message" that route will be taken. It is important to note that 
APIGateway websocket has three defualt routes: $connect, $disconnect, and $default. These routes are triggered when a socket is opened, closed, and have no other matching routes respectively.
To read more please visit: [here](https://aws.amazon.com/api-gateway/)
* On *the programming side*: We are using raw unadultarated javascript and html for the browser and User Interface. And for the lambda function we are using node.js version 10.

## Pre-Requisites
In order to complete this lab the following are required to have access to the following:
* AWS IAM
* DynamoDB
* Lambda
* API Gateway 

## Context
In this lab we are going to create 7 microservices. That manage and operate a fully functional chat room.

* There is the **client-records** and **room-messages-users** table. These store the messages, users, and active rooms for any session.
* There are a few lambda functions. Each have their own respective action.
    * **Connect**: this function is used to store the connection ID in DynamoDb
    * **Register User**: This function is used to store the username in DynamoDB
    * **Create Room** This function is used to store the new room in DynamoDB.
    * **Join Room**: This function is used to store what room the has joined in DynamoDB
    * **Send Message**: This function is used to send messages to anyone in the chat room, and record in DynamoDB.
    * **Leave Room**: This function is used to update DynamoDB to reflect that a user has left.
    * **Disconnect** This function cleans up any session data that was related to the user that disconnected.

There are seven lambda cuntions for this lab to show that once orientated with the WebSocket API and the microservice pattern, you can then easily deploy new services with ease.


