/**
 * The Class the defines the functions for talking to the
 * websocket. This class also offers utilties for formatting
 * the flow of the state of index.html
 */

class ChatRoom {
    /**
     * Constructor for the Chatroom class
     */
    constructor() {
        this.state = {
            connected: false,
            room: null,
            name: null,
            socket: null,
        };
        window.addEventListener('beforeunload',
            this.closeConnection.bind(this));
    }
    /**
     * Connects to the websocket
     * listens for a successful connection
     */
    connect() {
        try {
            this.state.socket = new WebSocket(AWS_CONFIG.websocket);
        } catch (e) {
            throw e;
        }
        this.state.connected = true;
        this.state.socket.onopen = function(e) {
            console.log(e);
            document.getElementById('overlay').style.display = 'none';
        };
        this.setMessageListener();
        this.setCloseListener();
    }
    /**
     * Sets the state of the webpage back
     * to the starting state.
     * Connects back to the websocket
     */
    reconnect() {
        // Clear all of the input fields
        let inputs = [...document.getElementsByClassName("input-area")];
        inputs.map((elem) => {
            elem.value = "";
        });
        // Clear any messages
        let message = document.getElementById("currentmessages");
        while (message.firstChild) {
            message.removeChild(message.firstChild);
        }
        // Reformat label
        document.getElementById("room-id").innerHTML = "You are in room:";

        // Delete any available rooms
        let rooms = document.getElementById("rooms");
        while (rooms.firstChild) {
            rooms.removeChild(rooms.firstChild);
        }
        
        // Make sure the user can sign up again
        if (document.getElementById("sign-up-button").disabled) {
            toggle("sign-up-button");
        }

        // Disable any buttons that should not be enabled
        var buttons = ["leave-room-button", "send-message-button", "create-new-room-button"];
        buttons.map((elem) => {
            if (!document.getElementById(elem).disabled) toggle(elem);
        });

        // Reconnect to the websocket the standard way.
        this.connect();
    }

    /**
     * Sends the websocket a message. 
     */
    sendWebsocketMessage(request) {
        console.log('attempting to: ', request.action);
        console.log(request);
        const payload = JSON.stringify({
            'action': request.action,
            'value': request.value,
            'room': this.state.room,
            'name': this.state.name,
        });
        this.state.socket.send(payload);
    }
    /**
     * Sets the message listener for the websocket
     * Decides on what action to do depending on 
     * the type of message delivered back to the cliet.
     */
    setMessageListener() {
        const messageListener = function(e) {
            console.log(e);
            const data = JSON.parse(e.data);
            console.log(data.type);
            // When a user gets a username
            if (data.type == _message_types.SIGNUP) {
                data.rooms.map((elem) => {
                    appendList({
                        list: 'rooms',
                        html: '<button class="message-room-button" ' +
                            'onClick=joinChatRoom("' + elem + '")>' +
                            elem + '</button>',
                        value: elem,
                    });
                });
            // A new room has been created
            } else if (data.type == _message_types.ROOM && this.state.name) {
                const elem = data.message;
                let disabled = this.state.room === null ? 'enabled' : 'disabled';
                console.log(disabled)
                appendList({
                    list: 'rooms',
                    html: '<button class="message-room-button" ' +
                        'onClick=joinChatRoom("' + elem + '") ' + disabled +  '>'
                        + elem + '</button>',
                    value: elem,
                });
            // A message has been sent
            } else if (data.type == _message_types.MESSAGE && 
                (this.state.name && this.state.room || this.state.name == SIMPLE)) {
                appendList({
                    list: 'currentmessages',
                    html: this.state.name == SIMPLE ? data.message : data.user + ' said: ' + data.message,
                    value: data.user + data.message,
                });
            // Callback from when the user creates their name
            } else if (data.type == _message_types.MULTI_MESSAGE) {
                data.messages.map((elem) => {
                    appendList({
                        list: 'currentmessages',
                        html: elem.user + ' said: ' + elem.content,
                        value: data.user + data.message,
                    })
                });
            // A room has been removed
            } else if (data.type == _message_types.DELETE_ROOM) {
                console.log("attempting to remove room");
                let { room } = data; 
                let rooms = document.getElementById("rooms").childNodes;
                for (let roomUI of rooms) {
                    if (roomUI.firstChild.innerHTML == room) {
                        roomUI.parentNode.removeChild(roomUI);
                    }
                }
            }
        };
        this.state.socket.onmessage = messageListener.bind(this);
        window.addEventListener('message',
            this.state.socket.onmessage.bind(this), false);
    }
    /**
     * Updates the state of the Chatroom class.
     */
    update(param) {
        if (param.room) this.state.room = param.room;
        if (param.name) this.state.name = param.name;
        if (param.websocket) this.state.websocket = param.websocket;
        if (param.connected) this.state.connected = param.connected;
    }
    /**
     * Sets the action to do when the
     * websocket connection is closed
     */
    setCloseListener() {
        this.state.socket.onclose = function(e) {
            const param = {
                room: "",
                name: null,
                websocket: null,
                connected: false,
            };
            this.update(param);
            document.getElementById('overlay').style.display = 'block';
        }.bind(this);
    }
    /**
     * Sets the action to do when the websoceket
     * sends an error to client
     */
    setErrorListener() {
        this.state.socket.onerror = function(e) {
            alert('ERROR ', e);
        };
    }
    /**
     * Closes the connection to the websocket.
     */
    closeConnection() {
        if (this.state.connected) {
            this.state.socket.close();
        }
    }
}
