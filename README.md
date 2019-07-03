# Websocket-Lab
Welcome to the Websocket-Lab. The purpose of this lab is to introduce users to the AWS Websocket capability.
Released on December 18, 2018, this service is still fairly new. The good news is, is that this service piggie
backs off of the well established API Gateway. (To read more about the release please visit [here](https://aws.amazon.com/blogs/compute/announcing-websocket-apis-in-amazon-api-gateway/)).

As we begin to explore how websockets are deployed on AWS we will also be indirectly a few other key resources. If you have never built
anything on AWS, it is important to know that rarely will any one project use one service. Think of AWS services/products as very interchangaeble building blocks, where the the finished product is indeed greater than the sum of its parts. 

Please refer below for a short description of the services used in this lab:
* IAM Roles and Policies: AWS offers users the IAM service to users as a way to enhance security among the products that they use.
The IAM roles and policies are used in this lab to help limit the amount of access some of our products can have to other products.
To read more please visit: [here]{https://aws.amazon.com/iam/}.
(Maybe we will also use this for IAM identity pools in cognito... who knows)
* AWS Lambda: The cornerstone product in AWS offerings of server-less products. This product is the backbone of our computing and business logic for our application. Lambda functions, are triggered by an event and when invoked execute a block of code. In this lab
Lambda is used as a receiver for when we send messages to our Websocket, and then handle those messages accordingly.
* AWS DynamoDB: AWS' trademark NoSQL database. DynamoDB is used in this lab to keep track of session information as users interact with 
the Chat room.
* AWS APIGateway: APIGateway is used in this lab as the supplier of a websocket for our application. The APIGatway websocket configuration is setup as routes. Routes are pathways for messages to travel. For example if there is a route called "message" when
a message is sent to the APIGatway that containts the action as "message" that route will be taken. It is important to note that 
APIGateway websocket has three defualt routes: $connect, $disconnect, and $default. These routes are triggered when a socket is opened, closed, and have no other matching routes respectively.

## Outline
### Pre-Requisites
1. Must have an AWS account
2. Has set up the AWS CLI
###Backgroud Story

###Tasks
We also want to make sure that we have instructions for set up
(this includes being able to edit code on the local machine & 
using SAM to autodeploy a stack)
1. Missing route
2. Lambda with wrong permissions
3. Do user authentication and create an issue here with that
4.