var Log = require("./log");
var DubBotBase = require("./dubtrack");
var Translator = require("./translator");
var Types = require("./types");

var LOG = new Log("DubBotBaseStateTracker");

/**
 * Initializes the state tracker by doing a couple of things:
 *
 * 1) Connects all of the event listeners we need. This function should be called
 * before registering any other event listeners at all; that will guarantee
 * that these listeners are called first, and can update state that the other
 * event listeners may rely on.
 * 2) Determines the initial state of the room via some API calls.
 *
 * Because asynchronous API calls are in use, it's possible to pass a callback to
 * this function.
 *
 * @param {object} globalObject - The global object shared throughout the bot
 * @param {function} onComplete - Optional. A function that will be called once the
 *                                initialization of this module is complete.
 */
function init(globalObject, onComplete) {
    var bot = globalObject.bot;

    globalObject.roomState = {
        chatHistory: [],
        mediaQueue: [],
        playHistory: [],
        usersInRoom: []
    };

    bot.on(Types.Event.ADVANCE, onAdvance);
    bot.on(Types.Event.CHAT, onChat);
    bot.on(Types.Event.CHAT_DELETE, onChatDelete);
    bot.on(Types.Event.GRAB, onGrab);
    bot.on(Types.Event.ROOM_PLAYLIST_QUEUE_UPDATE, onRoomPlaylistQueueUpdate);
    bot.on(Types.Event.USER_LEAVE, onUserLeave);
    bot.on(Types.Event.USER_JOIN, onUserJoin);
    bot.on(Types.Event.VOTE, onVote);

    globalObject.roomState.findUserInRoomById = function(userID) {
        return _findUser(globalObject.roomState.usersInRoom, userID);
    };

    globalObject.roomState.findPlaysForContentId = function(contentID) {
        var plays = [];
        for (var i = 0; i < globalObject.roomState.playHistory.length; i++) {
            var play = globalObject.roomState.playHistory[i];
            if (play.media.contentID === contentID) {
                plays.push(play);
            }
        }

        return plays;
    }

    populateUsers(globalObject, onComplete);
}

function populateUsers(globalObject, callback) {
    // Drill into the undocumented 'bot within a bot' which is DubAPI for some info.
    var currentSong = Translator.translateMediaObject(globalObject.bot.bot.getMedia());
    var currentDj = Translator.translateUserObject(globalObject.bot.bot.getDJ());
    var users = globalObject.bot.bot.getUsers();
    var waitList = globalObject.bot.bot.getQueue();

    for (var i = 0; i < users.length; i++) {
        var user = Translator.translateUserObject(users[i]);
        globalObject.roomState.usersInRoom.push(user);
    }

    // Add the currently playing song to the DJ history, since we won't get
    // any other chance to do so. (At this point the initial ADVANCE event
    // from joining the room has almost certainly already fired and been missed.)
    if (currentSong && currentDj) {
        var elapsedTime = globalObject.bot.bot.getTimeElapsed();
        var startDate = Date.now() - elapsedTime * 1000;
        var currentPlay = {
            media: currentSong,
            startDate: startDate,
            user: currentDj,
            votes: {
                grabs: [], // list of user IDs which fall into this category
                mehs: [],
                woots: []
            }
        };

        for (i = 0; i < users.length; i++) {
            var user = users[i];
            if (user.grab) {
                currentPlay.votes.grabs.push(user.id);
            }
            if (user.vote === 1) {
                currentPlay.votes.woots.push(user.id);
            }
            else if (user.vote === -1) {
                currentPlay.votes.mehs.push(user.id);
            }
        }

        globalObject.roomState.playHistory.unshift(currentPlay);
    }

    callback();

}

// =============================
// Event handlers
// =============================

function onAdvance(event, globalObject) {
    var maxPlayHistoryLength = globalObject.config.DubBotBase.numberOfPlayedSongsToStore;

    // Add the new song to the song history
    var play = {
        media: event.media,
        startDate: event.startDate,
        user: event.incomingDJ,
        votes: {
            grabs: [],
            mehs: [],
            woots: []
        }
    };

    globalObject.roomState.playHistory.unshift(play);

    if (globalObject.roomState.playHistory.length > maxPlayHistoryLength) {
        globalObject.roomState.playHistory.length = maxPlayHistoryLength;
    }
}

function onChat(event, globalObject) {
    var maxChatHistoryLength = globalObject.config.DubBotBase.numberOfChatEventsToStore;

    var chatObj = {
        chatID: event.chatID,
        message: event.message,
        timestamp: Date.now(),
        type: event.type,
        userID: event.userID,
        username: event.username,
        wasUserMuted: event.isMuted
    };

    // Add this to the front of the chat history
    globalObject.roomState.chatHistory.unshift(chatObj);

    if (globalObject.roomState.chatHistory.length > maxChatHistoryLength) {
        globalObject.roomState.chatHistory.length = maxChatHistoryLength;
    }
}

function onChatDelete(event, globalObject) {
    var deletedMessageIndex = -1;
    var currentTime = Date.now();
    var deletedMessages = [];

    for (var i = 0; i < globalObject.roomState.chatHistory.length; i++) {
        var chatObj = globalObject.roomState.chatHistory[i];

        if (chatObj.chatID === event.chatID) {
            chatObj.isDeleted = true;
            chatObj.deletedByUserID = event.modUserID;
            chatObj.deletionTime = currentTime;
            deletedMessages.push(chatObj);
            deletedMessageIndex = i;
            break;
        }
    }

    // Chat deletion is odd: the event only mentions one ID which was deleted,
    // but dubtrack will actually delete that message and all subsequent messages
    // belonging to the same user, until a message from someone else is found.
    if (deletedMessageIndex >= 0) {
        var deletedMessageUserID = globalObject.roomState.chatHistory[deletedMessageIndex].userID;
        for (var i = deletedMessageIndex + 1; i < globalObject.roomState.chatHistory.length; i++) {
            var chatObj = globalObject.roomState.chatHistory[i];
            if (chatObj.userID === deletedMessageUserID && !chatObj.isDeleted) {
                chatObj.isDeleted = true;
                chatObj.deletedByUserID = event.modUserID;
                chatObj.deletionTime = currentTime;
                deletedMessages.push(chatObj);
            }
            else {
                break;
            }
        }
    }

    // Cheat a bit and attach a new object to the event
    // TODO: move this to the right place
    event.deletedMessages = deletedMessages;
}

function onGrab(event, globalObject) {
    var currentSong = globalObject.roomState.playHistory[0];

    if (currentSong.votes.grabs.indexOf(event.userID) < 0) {
        currentSong.votes.grabs.push(event.userID);
    }
}

function onRoomPlaylistQueueUpdate(event, globalObject) {
    globalObject.roomState.waitList = event.queue;
}

function onUserLeave(event, globalObject) {
    _removeUser(globalObject.roomState.usersInRoom, event.userID);
}

function onUserJoin(event, globalObject) {
    var existingUser = _findUser(globalObject.roomState.usersInRoom, event.userID);

    if (existingUser) {
        LOG.warn("Received a user join event for a user who was already recorded " +
                 "as present (userID = {}, username = {}). This may indicate a bug in DubBotBase.", event.userID, event.username);
        return;
    }

    globalObject.roomState.usersInRoom.push(event);
}

function onVote(event, globalObject) {
    var currentSong = globalObject.roomState.playHistory[0];
    var userID = event.userID;

    // Since users can change votes, we need to make
    // sure they're only in one list at a time

    if (currentSong.votes.woots.indexOf(userID) >= 0) {
        currentSong.votes.woots.splice(currentSong.votes.woots.indexOf(userID), 1);
    }

    if (currentSong.votes.mehs.indexOf(userID) >= 0) {
        currentSong.votes.mehs.splice(currentSong.votes.mehs.indexOf(userID), 1);
    }

    if (event.vote === 1) {
        currentSong.votes.woots.push(userID);
    }
    else if (event.vote === -1) {
        currentSong.votes.mehs.push(userID);
    }
}

function _findUserIndex(users, userID) {
    for (var i = 0; i < users.length; i++) {
        var user = users[i];

        if (user.userID === userID) {
            return i;
        }
    }

    return -1;
}

function _findUser(users, userID) {
    var index = _findUserIndex(users, userID);
    return index >= 0 ? users[index] : null;
}

function _removeUser(users, userID) {
    var index = _findUserIndex(users, userID);

    if (index >= 0) {
        users.splice(index, 1);
    }
}

module.exports = {
    init: init
};
