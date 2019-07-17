const AWS_CONFIG = {
    "region": "us-east-1",
    "websocket": "wss://2vbwss9q2g.execute-api.us-east-1.amazonaws.com/default",
    "name": "Websocket-Lab",
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
