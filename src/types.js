/**
 * Contains various types and enums used throughout DubBotBase.
 */

var ChatType = {
    COMMAND: "command",
    EMOTE : "emote",
    MESSAGE : "message"
};

var Event = {
    ADVANCE: 'room_playlist-update', // when the next song is up for play
    CHAT: 'chat-message', // someone sends a chat message
    CHAT_DELETE: 'delete-chat-message', // a mod deletes a chat message
    GRAB: 'room_playlist-queue-update-grabs', // someone grabs the current song
    MODERATE_BAN: 'user-ban', // a mod bans a user from the room
    MODERATE_MUTE: 'user-mute', // a mod mutes a user temporarily
    ROOM_PLAYLIST_QUEUE_UPDATE: 'room_playlist-queue-update-dub',
    ROOM_UPDATE: 'room-update',
    SKIP: 'chat-skip', // the current DJ chooses to skip
    USER_IMAGE_UPDATE: 'user-update',
    USER_JOIN: 'user-join', // a user joins the room
    USER_LEAVE: 'user-leave', // a user leaves the room
    USER_SET_ROLE: 'user-setrole',
    USER_UNBAN: 'user-unban',
    USER_UNMUTE: 'user-unmute',
    USER_UNSET_ROLE: 'user-unsetrole',
    USER_UPDATE: 'user_update', // something changes about a user (e.g. name, avatar, etc)
    VOTE: 'room_playlist-dub' // a user updubs or downdubs
};

var Role = {
    NONE : { name: "none", level: 0 },
    DJ : { name: "dj", level: 1 },
    RESIDENT_DJ : { name: "residentDj", level: 2 },
    VIP : { name: "vip", level: 2 },
    MOD : { name: "mod", level: 3 },
    COOWNER : { name: "co-owner", level: 4 },
    OWNER : { name: "owner", level: 5 }
};

exports.ChatType = ChatType;
exports.Event = Event;
exports.UserRole = Role;
