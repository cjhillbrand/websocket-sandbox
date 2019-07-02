class ChatRoom {
    constructor() {
        this.state = {
            connected: false,
            room: null,
            name: null,
            loggedIn: null,
            messages: [],
            socket: null
        };
        window.addEventListener("beforeunload", this.closeConnection.bind(this));
    }
    connect() {
        let result = {
            message: "STALE",
            success: false,
            rooms: []
        };
        //return result; //uncomment and comment this out to debug just html/js
        if (this.state.connected)
            result.message = "Already Connected to Websocket"; // Factor out error message
        try {
            this.state.socket = new WebSocket(AWS_CONFIG.websocket);
        } catch (e) {
            result.message = e;
            return result;
        }
        this.state.connected = true;
        this.state.socket.onopen = function (e) {
            console.log(e);
            // Figure out other useful info to store in result;
            result.message = "Connection Successfull";
            result.success = true;
        };
        this.setMessageListener();
        this.setCloseListener();
        return result;
    }
    // Create a Websocket route that accepts the route type of
    // register
    sendWebsocketMessage(request) {
        console.log("attempting to: ", request.action);
        console.log(request)
        var payload = JSON.stringify({
            "action": request.action,
            "value": request.value,
            "room": this.state.room,
            "name": this.state.name
        })
        this.state.socket.send(payload);
    }
    setMessageListener() {
        const messageListener = function(e) {
            console.log(e);
            let data = JSON.parse(e.data);
            if (data.type == "signup") {
                // Need to create an internal data structure that keeps track
                // of the rooms so that we don't add duplicates.
                /**
                 * TODO: 
                 * 1. Need to create an internal data structure that keeps track
                 * of the rooms so that we don't add duplicates.
                 * 2. Need to figure out a good defualt UI before the user has logged in.
                 */
                data.rooms.map(elem => {
                    appendList({
                        list: "rooms",
                        html: "<button class=\"message-room-button\" onClick=joinChatRoom(\"" + elem + "\") > " + elem + "</button>",
                        value: elem
                    });
                });
            } else { // type == "message"
                appendList({
                    list: "currentmessages",
                    html: data.user + " said: " + data.message,
                    value: data.user + data.message
                });
            }   
        };
        this.state.socket.onmessage = messageListener;
    }
    update(param) {
        if (param.room) this.state.room = param.room;
        if (param.name) this.state.name = param.name;
        // add more updates as neccessary
    }
    setCloseListener() {
        this.state.socket.onclose = function(e) {
            console.log(e);
            console.log("Closed");
        }
    }
    closeConnection() {
        if(this.state.connected) {
            this.state.socket.close();
        }
    }

}





