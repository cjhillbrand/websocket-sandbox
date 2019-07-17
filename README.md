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
In this lab we are going to create 3 microservices. That manage and operate a functional chat room.

* There is the **client-records** table. This stores the ConnectionIDs for all of the users.
* There are a few lambda functions. Each have their own respective action.
    * **Connect**: this function is used to store the connection ID in DynamoDb
    * **Send Message**: This function is used to send messages to anyone in the chat room, and record in DynamoDB.
    * **Disconnect** This function cleans up any session data that was related to the user that disconnected.

There are three lambda Funtions for this lab to show that once orientated with the WebSocket API and the microservice pattern, you can then easily deploy new services with ease.

Before we begin with tasks, it is recommended that you clone the GitHub Repo to your local machine located [here](https://github.com/cjhillbrand/websocket-sandbox).

## Task 1: Creating DynamoDB Tables

1. Visit the DynamoDB console.
2. Click on the **Create Table** button.
3. At this stage:
    1. Enter **"client-records"** for table name.
    2. Enter **"ID"** for the primary key.
    3. Press **create**
4. This is going to start spinning up our first table.

Wait until the table is created and that the table name and primary keys are correct. *Make sure to note casing for primary key*

## Task 2: Creating the Lambda functions
Each Lambda function has it's own source code, and needs its own permissions assigned to its role. Refer to the table below for configurations.

| Function Name | Location of Source (Relative to /resources/aws-utils/) | Permissions        |
|---------------|--------------------------------------------------------|--------------------|
| Connect       | ConnectionLambda/index.js                              | DynamoDB           |
| SendMessage   | DispatchLambda/index.js                                | DynamoDB WebSocket |
| Disconnect    | DisconnectLambda/index.js                              | DynamoDB WebSocket |

### Step 1: Creating the Lambda Functions and inputting code. 

1. Navigate to the Lambda Dashboard
2. For each Lambda Function above:
    1. Click on the button **creae a function** If the button is not visible, check on the console for a menu on the left, with the label *functions*, and then hit on the ***Create Function*** button.
    2. Select **Author From Scratch** 
    3. Under the section **Basic Information**:
        1. For Function name put the function name listed in the table above.
        2. For **Runtime**, select the latest supported version for Node.js
        3. For **Permissions**, we need to give the lambda function the required permissions we have listed above.
            * Click on **Choose or create an execution role**. This unfolds a section where we can trigger the creation of the role for our lambda function.
            * For execution Role, select **Create new role from AWS policy templates**. This will expand two fields below the section: 
                * For the **Role Name** input the *function-name*Role 
                * Do not select anything for the **Policy template** field.
    4. Click the **Create Function** button on the bottom of the right hand side of the page. You should now be taken to the dashboard of that lambda function.
    5. Scroll down to where you see the function code. It looks like a code editor and should have one open tab with the file *index.js* 
    6. Copy and paste the code for each function (located in the table above) into the editor. Click **Save** in the top right corner when finished.
        * Take some time and read over the code for each function. They either perform some action to DynamoDB or send a message via the websocket. Moving forward this fundamental understanding of the code helps understand how our chatroom deals with the information given to it. *Note: The code for each function is made to handle this lab and the extended lab. There is a comment in each .js file that says **This is the beginning of the code for the extended lab.** feel free to continue reading but is only neccessary for the extended lab.*

### Step 2: Adjusting Permissions
*Note: For Lambda functions that need permissions to our WebSocket, we need to first receive the ARN for our WebSocket before attaching the permission. With this in mind the two functions that need this permission require us to complete this step after we have created the Websocket* 
1. Scroll down on the page of your lambda function and find the section *Execution Role* 
2. Check to see if there is a link to the role that you created previously. Open that link in another tab of your browser.
3. We are now at the IAM Access and Policy page for our Role. If we have done everything correctly thus far regarding the permissions there should be none under the *Permission Policies* Table. 
4. Click on the **+ Add inline policy** button located to the right and midway down the page. 
5. Click on the **JSON** Tab. This is where we can add in our custom permissions to our role.
6. Paste the policy (role.json) in each respective functions folder to the editor.
7. Replace the \<ARN> with the ARN for the designated resource. 

## Task 3: Creating the WebSocket on API Gateway

### Step 1: Create WebSocket
1. Navigate to the API Gateway page here.
2. Depending on the state of your account you can find a **Create API** or **Get Started** Button. Click on the one that you see and you are going to be take a create API page.
    1. Press the **WebSocket** radio button for **Choose the Protocol**.
    2. For **API name** put, **chatroom-websocket**
    3. For **Route Selection Expression** enter the defualt `$request.body.message` 
       *Note: If you want to learn more about routes and what they do click on the **Learn More** button next to the input box*
    4. For Description enter, **WebSocket for a Chatroom web page**.
    5. Click **Create API**

### Step 2: Creating a role for API Gateway
1. Go to the IAM dashboard here.
2. Click on **Roles** 
3. Click on **Create Role** 
4. Choose **API Gateway** as the resource and then scroll to the bottom and press next.
5. Click on **Next: Tags** and then **Next: Review**
6. For role name enter, **WebSocketAPIRole**, then click **Create**
7. Copy the **Role ARN** or keep this info handy. We will be using it very shortly.

### Step 3: Add a Messaging Route
1. If you are not already, navigate to the **routes** page.
2. In the box **New Route Key** enter, **dispatch**, and click the checkmark to the right of the box.

### Step 4: Configuring the Target Backend
While still on the page thats titled *Provide information about the target backend that this route will call and whether the incoming payload should be modified.* Do the following:
1. Make sure that the **Lambda Function** radio is pressed and **Use Lambda Proxy Integration** is pressed.
2. For Lambda function enter **SendMessage**. This field should suggest a lambda function you have already made.
3. Enter in the **API Gateway ARN Role** we made two steps ago.  
4. Cick **Use Default Timeout** 
5. Press **Save** and click **Ok** for any pop-ups.
6. Repeat these steps for the $connect and $disconnect, but with their respective lambda functions.

### Step 5: Deploying the WebSocket
1. Click on the **Actions** dropdown, and select **Deploy API**
2. For the **Deployment Stage** enter click on **[New Stage]**
    1. For **Stage Name** enter, **development**
    2. You can leave the descriptions blank, or enter what you like.
3. Keep track of the **WebSocket URL** this is used in our local code.

## Task 4: Creating the GUI for the Chatroom
*Note: This task is completed using a **Google Chrome Browser***
### Step 1: Configure Websocket on the UI
1. On your local machine navigate to: websocket-sandbox/resources/aws-utils.js
2. Under the **AWS_CONFIG** for the key **websocket** enter the Websocket URL we grabbed in the last task.

### Step 2: Test UI Functionality
1. On a browser on your local machine open websocket-sandbox/chatroom/index.html
2. Open the console on your browser. *Note: There are different ways to do this, but for Google Chrome and Firefox just right click and then press **inspect** then navigate to the console pane* 
3. The console should look like this:

<img src="./screenshots/console.png" alt="console" width="200">

if everything up to this point has worked there should be one event logged in our console.

4. The moment we have been waiting for, sending and receiving messages.
    1. Since this is the basic chatroom, we did not introduce the ability for custom names, or the creation of joining chatrooms. If you are interested in doing this take a look at the **Extended Lab** which walks through how to do this. To make sure that our UI knows we are in a *Simple Mode*
    * enter **no-rooms** in the **Please Enter a Name** text box.
    * Click **Register**
    * The **Submit** button under the message text box should now be enabled.
    If not refresh the page, enter **no-rooms** and try again.
    2. Enter any message in the text box labeled **Type a Message here**
    3. Press **Submit** under the text box.
    4. There may be a delay before the message shows up, but eventually we should receive the message we just sent.
    5. Take a look at the **Message Event** in the console. It can be of value to look at the payload here and look at the code in the **SendMessage** lambda and see where our message traveled and how it got transformed. Look ecspecially at this snippet of code in the **SendMessage** Lambda:
    ```javascript
    for (let connectionId of connectionData) {
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: message}).promise();
        } catch (e) {
            if (e.statusCode == 410) {
                await db.delete({TableName: "client-records", Key: { ID: connectionId }}).promise();
            }
        }
    }
    ```
    *Note: the `e.statusCode == 410` what does the code 410 mean? I recommend looking at the documentation and doing a deeper dive and do some investigating! You can find the link to the documentation here.*

5. If this lab is being completed in conjunction with other individuals and you want to try and send messages to eachother all you have to do is change the awsconfig.js. Change it to:
```javascript
const AWS_CONFIG = {
    "region": "us-east-1",
    "websocket": "<websocket of your partner>",
    "name": "Websocket-Lab",
}
```
now everyone should have the same websocket URL. 
**Congratulations you are done with this lab! Have fun and send messages to eachother!**

