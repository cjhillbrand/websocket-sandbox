/**
 * The Class the defines the functions for talking to the
 * websocket. This class also offers utilties for formatting
 * the flow of the state of index.html
 * @class ChatRoom
 * @constructor
 * @connect
 */

class ChatRoom {
    /**
     * Constructor for the Chatroom class
     * @constructor
     */
    constructor() {
        this.state = {
            connected: false,
            room: null,
            name: null,
            loggedIn: null,
            messages: [],
            socket: null,
        };
        window.addEventListener('beforeunload',
            this.closeConnection.bind(this));
    }
    connect() {
        let result = {
            message: 'STALE',
            success: false,
        };
        if (this.state.connected) {
            result.message = 'Already Connected to Websocket';
        }
        try {
            this.state.socket = new WebSocket(AWS_CONFIG.websocket);
        } catch (e) {
            result.message = e;
            return result;
        }
        this.state.connected = true;
        this.state.socket.onopen = function(e) {
            console.log(e);
            // Figure out other useful info to store in result;
            result.message = 'Connection Successfull';
            result.success = true;
            document.getElementById('overlay').style.display = 'none';
        };
        this.setMessageListener();
        this.setCloseListener();
        return result;
    }
    reconnect() {
        // Clear all of the input fields
        var inputs = [...document.getElementsByClassName("input-area")];
        inputs.map((elem) => {
            elem.value = "";
        });
        // Clear any messages
        var message = document.getElementById("currentmessages");
        while (message.firstChild) {
            message.removeChild(mesage.firstChild);
        }
        // Reformat label
        document.getElementById("room-id").innerHTML = "You are in room:";

        // Delete any available rooms
        var rooms = document.getElementById("rooms");
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
            if (!elem.disabled) toggle(elem);
        });

        // Reconnect to the websocket the standard way.
        this.connect();
    }
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
    setMessageListener() {
        const messageListener = function(e) {
            console.log(e);
            const data = JSON.parse(e.data);
            if (data.type == _message_types.SIGNUP) {
                data.rooms.map((elem) => {
                    appendList({
                        list: 'rooms',
                        html: '<button class="message-room-button" ' +
                            'onClick=joinChatRoom("' + elem + '") > ' +
                            elem + '</button>',
                        value: elem,
                    });
                });
            } else if (data.type == _message_types.ROOM && this.state.name) {
                const elem = data.message;
                appendList({
                    list: 'rooms',
                    html: '<button class="message-room-button" ' +
                        'onClick=joinChatRoom("' + elem + '") disabled=true> '
                        + elem + '</button>',
                    value: elem,
                });
            } else if (data.type == _message_types.MESSAGE && this.state.name && this.state.room) {
                appendList({
                    list: 'currentmessages',
                    html: data.user + ' said: ' + data.message,
                    value: data.user + data.message,
                });
            } else if (data.type == _message_types.MULTI_MESSAGE) {
                data.messages.map((elem) => {
                    appendList({
                        list: 'currentmessages',
                        html: elem.user + ' said: ' + elem.content,
                        value: data.user + data.message,
                    })
                });
            }
        };
        this.state.socket.onmessage = messageListener.bind(this);
        window.addEventListener('message',
            this.state.socket.onmessage.bind(this), false);
    }
    update(param) {
        if (param.room) this.state.room = param.room;
        if (param.name) this.state.name = param.name;
        if (param.websocket) this.state.websocket = param.websocket;
        if (param.connected) this.state.connected = param.connected;
        // add more updates as neccessary
    }
    setCloseListener() {
        this.state.socket.onclose = function(e) {
            const param = {
                room: "",
                name: null,
                websocket: null,
                connected: false,
            };
            update(param);
            document.getElementById('overlay').style.display = 'block';
        };
    }
    setErrorListener() {
        this.state.socket.onerror = function(e) {
            alert('ERROR ', e);
        };
    }
    closeConnection() {
        if (this.state.connected) {
            this.state.socket.close();
        }
    }
}
