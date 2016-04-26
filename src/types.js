/**
 * Contains various types and enums used throughout PlugBotBase.
 */

var BanDuration = {
    DAY: "1 day",
    HOUR: "1 hour",
    FOREVER: "Forever"
};

var BanReason = {
    SPAMMING_OR_TROLLING: "Spamming or trolling",
    VERBAL_ABUSE_OR_OFFENSIVE_LANGUAGE: "Verbal abuse or offensive language",
    PLAYING_OFFENSIVE_MEDIA: "Playing offensive videos/songs",
    REPEATEDLY_PLAYING_INAPPROPRIATE_GENRES: "Repeatedly playing inappropriate genre(s)",
    NEGATIVE_ATTITUDE: "Negative attitude"
};

var ChatType = {
    COMMAND: "command",
    EMOTE : "emote",
    MESSAGE : "message"
};

var Event = {
    // New dub events
    CHAT_SKIP: 'chat-skip', // TODO
    ROOM_PLAYLIST_DUB: 'room_playlist-dub',
    ROOM_PLAYLIST_GRAB: 'room_playlist-queue-update-grabs',
    ROOM_PLAYLIST_QUEUE_UPDATE: 'room_playlist-queue-update-dub',
    ROOM_PLAYLIST_UPDATE: 'room_playlist-update',
    ROOM_UPDATE: 'room-update',
    USER_IMAGE_UPDATE: 'user-update',
    USER_SET_ROLE: 'user-setrole',
    USER_UNBAN: 'user-unban',
    USER_UNMUTE: 'user-unmute',
    USER_UNSET_ROLE: 'user-unsetrole',

    ADVANCE: 'advance', // when the next song is up for play
    CHAT: 'chat-message', // someone sends a chat message
    CHAT_DELETE: 'delete-chat-message', // a mod deletes a chat message
    DJ_LIST_CYCLE: 'djListCycle', // a mod enables/disables DJ cycle
    DJ_LIST_UPDATE: 'djListUpdate', // someone joins or leaves the wait list, or a mod reorders the wait list
    DJ_LIST_LOCKED: 'djListLocked', // a mod locks/unlocks the wait list
    EARN: 'earn', // the bot gains exp
    GRAB: 'grab', // someone grabs the current song
    MODERATE_ADD_DJ: 'modAddDJ', // a mod adds a DJ to the wait list
    MODERATE_BAN: 'user-ban', // a mod bans a user from the room
    MODERATE_MOVE_DJ: 'modMoveDJ', // a mod reorders a DJ in the wait list
    MODERATE_MUTE: 'user-mute', // a mod mutes a user temporarily
    MODERATE_REMOVE_DJ: 'modRemoveDJ', // a mod removes a DJ from the wait list
    MODERATE_SKIP: 'modSkip', // a mod skips the current DJ
    MODERATE_STAFF: 'modStaff', // a mod changes somebody's staff level
    ROOM_DESCRIPTION_UPDATE: 'roomDescriptionUpdate', // a mod changes the room's description
    ROOM_JOIN: 'roomJoin', // the bot joins a room
    ROOM_MIN_CHAT_LEVEL_UPDATE: 'roomMinChatLevelUpdate', // a mod changes the minimum level users must have to chat
    ROOM_NAME_UPDATE: 'roomNameUpdate', // a mod changes the room's name
    ROOM_WELCOME_UPDATE: 'roomWelcomeUpdate', // a mod changes the room's welcome message
    SKIP: 'skip', // the current DJ chooses to skip
    USER_JOIN: 'user-join', // a user joins the room
    USER_LEAVE: 'user-leave', // a user leaves the room
    USER_UPDATE: 'user_update', // something changes about a user (e.g. name, avatar, level, etc)
    VOTE: 'vote' // a user woots or mehs
};

var MuteReason = {
    NEGATIVE_ATTITUDE: "Negative attitude",
    OFFENSIVE_LANGUAGE: "Offensive language",
    SPAMMING_OR_TROLLING: "Spamming or trolling",
    VERBAL_ABUSE_OR_HARASSMENT: "Verbal abuse or harassment",
    VIOLATING_COMMUNITY_RULES: "Violating community rules"
};

var Role = {
    NONE : { name: "none", level: 0 },
    RESIDENT_DJ : { name: "residentDj", level: 1},
    BOUNCER : { name: "bouncer", level: 2},
    MANAGER : { name: "manager", level: 3},
    COHOST : { name: "cohost", level: 4},
    HOST : { name: "host", level: 5}
};

exports.BanDuration = BanDuration;
exports.BanReason = BanReason;
exports.ChatType = ChatType;
exports.Event = Event;
exports.MuteReason = MuteReason;
exports.UserRole = Role;
