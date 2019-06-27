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
    }
    connect() {
        let result = {
            message: "STALE",
            success: false
        };
        return result;
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
    joinRoom() {
    }
    leaveRoom() {
        // This should change to just leaving the room
        // but for dev purpose were just closing the socket connection
        this.state.socket.close();
    }
    sendMessage(message) {
        console.log("trying to send event")
        var payload = JSON.stringify({
            "action": "dispatch",
            "message": message
        })
        socket.send(payload)
    }
    setMessageListener(value) {
        this.state.socket.onmessage = value;
    }
    setCloseListener(value) {
        this.state.socket.onclose = value;
    }
}





