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

There are seven lambda Funtions for this lab to show that once orientated with the WebSocket API and the microservice pattern, you can then easily deploy new services with ease.

## Task 1: Creating DynamoDB Tables

### Step 1: Create the first table
1. Visit the DynamoDB console.
2. Click on the **Create Table** button.
3. At this stage:
    i. Enter **"client-records"** for table name.
    ii. Enter **"ID"** for the primary key.
    iii. Press **create**
4. This is going to start spinning up our first table.
### Step 2: Create the Second table
1. Click on the **Create Table** button.
2. At this stage:
    i. Enter **"room-messages-users"** for table name.
    ii. Enter **"room"** for the primary key.
    iii. Press **create**.

Wait until both tables are created and that the table names and primary keys are correct. *Make sure to note casing for primary keys*

## Task 2: Creating the Lambda functions
### Step 1: Creating the Lambda Functions and inputting code. 
Each Lambda function has it's own source code, and needs its own permissions assigned to its role. Refer to the table below for configurations.

| Function Name | Location of Source (Relative to /resources/aws-utils/) | Permissions        |
|---------------|--------------------------------------------------------|--------------------|
| Connect       | ConnectionLambda/index.js                              | DynamoDB           |
| RegisterUser  | RegisterUserLambda/index.js                            | DynamoDB           |
| CreateRoom    | CreateRoomLambda/index.js                              | DynamoDB WebSocket |
| JoinRoom      | JoinRoomLambda.index.js                                | DynamoDB           |
| SendMessage   | DispatchLambda/index.js                                | DynamoDB WebSocket |
| LeaveRoom     | LeaveRoomLambda/index.js                               | DynamoDB WebSocket |
| Disconnect    | DisconnectLambda/index.js                              | DynamoDB WebSocket |

1. Navigate to the Lambda Dashboard
2. For each Lambda Function above:
    i. Click on the button **creae a function** If the button is not visible, check on the console for a menu on the left, with the label *functions*, and then hit on the ***Create Function*** button.
    ii. Select **Author From Scratch** 
    iii. Under the section **Basic Information**:
        i. For Function name put the function name listed in the table above.
        ii. For **Runtime**, select the latest supported version for Node.js
        iii. For **Permissions**, we need to give the lambda function the required permissions we have listed above.
            * Click on **Choose or create an execution role**. This unfolds a section where we can trigger the creation of the role for our lambda function.
            * For execution Role, select **Create new role from AWS policy templates**. This will expand two fields below the section: 
                * For the **Role Name** input the *function-name*Role 
                * Do not select anything for the **Policy template** field.
    iiii. Click the **Create Function** button on the bottom of the right hand side of the page. You should now be taken to the dashboard of that lambda function.
    iiiii. Scroll down to where you see the function code. It looks like a code editor and should have one open tab with the file *index.js* 
    iiiiii. Copy and paste the code for each function (located in the table above) into the editor. Click **Save** in the top right corner when finished.
        * Take some time and read over the code for each function. They either perform some action to DynamoDB or send a message via the websocket. Moving forward this fundamental understanding of the code helps understand how our chatroom deals with the information given to it. 

## Task 3: Creating the WebSocket on API Gateway

## Task 4: Creating the GUI for the Chatroom


