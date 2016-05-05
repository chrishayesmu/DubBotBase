"use strict";

/**
 * Contains a whole bunch of functions for translating from
 * DubAPI to DubBotBase, and a few functions for going the
 * other way.
 */

var Log = require("./log");
var Types = require("./types");

var LOG = new Log("Translator");

function _repairTitle(author, title) {
    return (author ? author + " - " : "") + title;
}

/**
 * Translates a date string from Dubtrack into a Javascript date.
 *
 * @param {integer} timestamp - A timestamp from DubAPI
 * @returns {integer} The UNIX timestamp represented by the string,
 *                    or the current time if string is null/empty
 */
function translateDateTimestamp(timestamp) {
    if (!timestamp) {
        LOG.warn("Received an invalid timestamp: {}", timestamp);
        return Date.now();
    }

    return new Date(timestamp);
}

function translateMediaObject(media) {
    if (!media) {
        return null;
    }

    return {
        contentID: media.fkid, // the Youtube or Soundcloud ID
        durationInSeconds: media.songLength / 1000, // how long the media is, in seconds
        fullTitle: media.name // our guess of what the song's original title was
    };
}

function translateScoreObject(score) {
    if (!score) {
        return null;
    }

    return {
        grabs: score.grabs,
        mehs: score.downdubs,
        woots: score.updubs
    };
}

function translateUserObject(dubapiDj) {
    if (!dubapiDj) {
        return null;
    }

    return {
        dubs: dubapiDj.dubs,
        joinDate: translateDateTimestamp(dubapiDj.created),
        numberOfSongsPlayed: dubapiDj.playedCount,
        role: translateRole(dubapiDj.role),
        userID: dubapiDj.id,
        username: dubapiDj.username
    };
}

function translateAdvanceEvent(event) {
    if (!event.user || !event.media) {
        LOG.warn("advance event is missing required fields; returning null");
        return null;
    }

    var obj = {
        incomingDJ: translateUserObject(event.user), // the user who is DJing following this event
        localStartDate: new Date(), // when the media began playing according to this machine
        media: translateMediaObject(event.media),
        startDate: event.startTime && event.startTime > 0 ? translateDateTimestamp(event.startTime) : new Date() // when the media began playing according to dubtrack
    };

    if (event.lastPlay && event.lastPlay.user && event.lastPlay.media && event.lastPlay.score) {
        obj.previousPlay = { // the media which played before this one
            dj: translateUserObject(event.lastPlay.user),
            media: translateMediaObject(event.lastPlay.media),
            score: translateScoreObject(event.lastPlay.score)
        };
    }

    return obj;
}

function translateChatEvent(event) {
    var obj = {
        chatID: event.id, // an ID assigned by dubtrack uniquely identifying this message
        message: event.message, // the chat message sent
        type: translateChatType(event), // what type of message was sent
        userID: event.user ? event.user.id : event.raw.user._id, // the ID of the user chatting
        username: event.user ? event.user.username : event.raw.user.username, // the username of the user chatting
        userRole: translateRole(event.user ? event.user.role : event.raw.user.roleid)
    };

    if (obj.type === Types.ChatType.COMMAND) {
        // Trim the message and split it into the command and the args
        var words = event.message.trim().split(/\s+/);

        obj.command = words[0].replace("!", "");
        obj.args = words.splice(1);
    }

    return obj;
}

function translateChatDeleteEvent(event) {
    return {
        chatID: event.id, // the ID of the chat message which was deleted
        deleterID: event.user.id, // the ID of the mod who deleted the message
        deleterUsername: event.user.username
    };
}

function translateChatType(event) {
    if (event.message[0] === "!") {
        return Types.ChatType.COMMAND;
    }

    // Look if it starts with "/me", but only if it's longer than
    // 4 characters, because "/me" by itself is a valid message
    // for some reason (and add a space at the end)
    if (event.message.length > 4 && /\/me /.test(event.message)) {
        // Remove the "/me" bit
        event.message = event.message.substring(4);

        return Types.ChatType.EMOTE;
    }

    if (event.type === "chat-message") {
        return Types.ChatType.MESSAGE;
    }

    LOG.error("Unable to identify chat type {}. Defaulting to {}.", event.type, Types.ChatType.MESSAGE);
    return Types.ChatType.MESSAGE;
}

function translateGrabEvent(event) {
    return {
        userID: event // ID of the user who grabbed the song
    };
}

function translateModBanEvent(event) {
    var duration = Number(event.time);

    return {
        bannedUser: translateUserObject(event.user),
        durationInMinutes: duration, // how long the user is banned for
        mod: translateUserObject(event.mod) // username of the mod who banned the user
    };
}

function translateModMuteEvent(event) {
    return {
        mutedUser: translateUserObject(event.user), // the user who's been muted
        mod: translateUserObject(event.mod)
    };
}

function translateModSkipEvent(event) {
    return {
        modUsername: event.m, // username of the mod who skipped
        modUserID: event.mi // ID of the mod who skipped
    };
}

function translateSkipEvent(event) {
    return {
        userID: event.user.id, // ID of the user who chose to skip their own song
        username: event.user.username
    };
}

function translateUserJoinEvent(event) {
    return translateUserObject(event.user);
}

function translateUserLeaveEvent(event) {
    return translateUserObject(event.user);
}

function translateUserUpdateEvent(event) {
    return translateUserObject(event.user);
}

function translateVoteEvent(event) {
    if (event.dubtype !== "updub" && event.dubtype !== "downdub") {
        LOG.warn("Received unknown dubtype {}", event.dubtype);
        return;
    }

    return {
        user: translateUserObject(event.user), // the user voting
        vote: event.dubtype === "updub" ? 1 : -1
    };
}

/**
 * Translates the role integer returned by the plug.dj API into an internal model.
 *
 * @param {integer} roleAsInt - The plug.dj API role
 * @returns {object} A corresponding object from the UserRole enum
 */
function translateRole(role) {
    switch (role) {
        case "5615fa9ae596154a5c000000":
            return Types.UserRole.COOWNER;
        case "5615fd84e596150061000003":
            return Types.UserRole.MANAGER;
        case "52d1ce33c38a06510c000001":
            return Types.UserRole.MOD;
        case "5615fe1ee596154fc2000001":
            return Types.UserRole.VIP;
        case "5615feb8e596154fc2000002":
            return Types.UserRole.RESIDENT_DJ;
        case "564435423f6ba174d2000001":
            return Types.UserRole.DJ;
        default:
            return Types.UserRole.NONE;
    }
}

/**
 * TODO
 */
function translateRoomPlaylistQueueUpdateEvent(event) {
    if (!event.queue) {
        return;
    }

    var queue = [];

    for (var i = 0; i < event.queue.length; i++) {
        queue.push({
            media: translateMediaObject(event.queue[i].media),
            user: translateUserObject(event.queue[i].user)
        });
    }

    return { queue: queue };
}

module.exports = {
    translateAdvanceEvent: translateAdvanceEvent,
    translateChatEvent: translateChatEvent,
    translateChatDeleteEvent: translateChatDeleteEvent,
    translateDateTimestamp: translateDateTimestamp,
    translateGrabEvent: translateGrabEvent,
    translateMediaObject: translateMediaObject,
    translateModBanEvent: translateModBanEvent,
    translateModMuteEvent: translateModMuteEvent,
    translateModSkipEvent: translateModSkipEvent,
    translateRole: translateRole,
    translateRoomPlaylistQueueUpdateEvent: translateRoomPlaylistQueueUpdateEvent,
    translateScoreObject: translateScoreObject,
    translateSkipEvent: translateSkipEvent,
    translateUserJoinEvent: translateUserJoinEvent,
    translateUserLeaveEvent: translateUserLeaveEvent,
    translateUserObject: translateUserObject,
    translateUserUpdateEvent: translateUserUpdateEvent,
    translateVoteEvent: translateVoteEvent
};
