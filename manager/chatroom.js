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
        return result;
    }
    // Create a Websocket route that accepts the route type of
    // register
    sendWebsocketMessage(request) {
        console.log("attempting to: ", request.action);
        console.log(request)
        var payload = JSON.stringify({
            "action": request.action,
            "value": request.value
        })
        this.state.socket.send(payload);
    }
    setMessageListener(value) {
        this.state.socket.onmessage = value;
    }
    setCloseListener(value) {
        this.state.socket.onclose = value;
    }
    closeConnection() {
        if(this.state.connected) {
            this.state.socket.close();
        }
    }
}





