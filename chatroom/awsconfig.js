const AWS_CONFIG = {
    "websocket": "<Enter your Websocket URL here>",
}

const _routes = {
    JOIN: "join-room",
    DISPATCH: "dispatch",
    LEAVE: "leave-room",
    REGISTER: "register",
    NEW_ROOM: "new-room",
}

const _message_types = {
    SIGNUP: "signup",
    ROOM: "single-room",
    MESSAGE: "client-message",
    MULTI_MESSAGE: "multi-message",
    DELETE_ROOM: "delete-room"
}

const SIMPLE = "no-rooms"
