"use strict";

/**
 * Provides the basic functionality of the bot: event subscription,
 * model translation, and taking actions such as sending chat or moderating.
 *
 * The main goal of this class is to provide insulation between the dubtrack.fm
 * API implementation and clients, since historically, dubtrack.fm implementations
 * have changed rather frequently. In the event of a breaking change, hopefully only
 * this class will need to be updated.
 */

var Log = require("./log");
var DubAPI = require("dubapi");
var Translator = require("./translator");
var Types = require("./types");
var Utils = require("./utils");

var LOG = new Log("DubBotBase-Bot");

var _eventTranslatorMap = {
    'chat-skip': Translator.translateSkipEvent,
    'chat-message': Translator.translateChatEvent,
    'delete-chat-message': Translator.translateChatDeleteEvent,
    'room_playlist-queue-update-grabs': Translator.translateGrabEvent,
    'modSkip': Translator.translateModSkipEvent,
    'room_playlist-update': Translator.translateAdvanceEvent,
    'room_playlist-queue-update-dub': Translator.translateRoomPlaylistQueueUpdateEvent,
    'user-ban': Translator.translateModBanEvent,
    'user-join': Translator.translateUserJoinEvent,
    'user-leave': Translator.translateUserLeaveEvent,
    'user-mute': Translator.translateModMuteEvent,
    'user-unmute': Translator.translateModMuteEvent,
    'user_update': Translator.translateUserUpdateEvent,
    'room_playlist-dub': Translator.translateVoteEvent
};

/**
 * Creates a new instance of the bot which will automatically connect to dubtrack.fm
 * and set up some event handling.
 */
function Bot(credentials, globalObject, initializationCompleteCallback) {
    LOG.info("Attempting to log in with email {}", credentials.username);

    new DubAPI(credentials, (function(err, _bot) {
        if (err) {
            throw new Error("Error occurred when logging in: " + err);
        }

        this.bot = _bot;

        LOG.info("Logged in successfully");

        // Set up an error handler so errors don't cause the bot to crash
        this.bot.on('error', function(err) {
            LOG.error("Unhandled error occurred; swallowing it so bot keeps running. Error: {}", err);
        });

        // Reconnect the bot automatically if it disconnects
        this.bot.on('disconnected', (function(roomName) {
            LOG.warn("Disconnected from room {}. Reconnecting..", roomName);
            this.connect(roomName);
        }).bind(this));

        // Set up custom event handling to insulate us from changes in the dubtrack API
        this.eventHandlers = {};
        for (var eventKey in Types.Event) {
            var eventName = Types.Event[eventKey];
            this.eventHandlers[eventName] = [];
        }

        if (globalObject.config.DubBotBase.logAllEvents) {
            LOG.info("Logging of all events is enabled. Setting up logging event handlers.");
            for (var eventKey in Types.Event) {
                var eventName = Types.Event[eventKey];
                LOG.info("Hooking into eventKey {}, eventName {}", eventKey, eventName);
                this.bot.on(eventName, (function(name) {
                    return function(event) {
                        LOG.info("event '{}' has JSON payload: {}", name, event);
                    };
                })(eventName));
            }
        }

        for (var eventKey in Types.Event) {
            var eventName = Types.Event[eventKey];
            var translatorFunction = _eventTranslatorMap[eventName];

            this.bot.on(eventName, _createEventDispatcher(eventName, translatorFunction, globalObject).bind(this));
        }

        if (initializationCompleteCallback) {
            initializationCompleteCallback(this);
        }
    }).bind(this));
}

/**
 * Attempts to connect the logged-in bot to a specific dubtrack.fm room.
 *
 * @param {string} roomName - The name of the room to connect to
 */
Bot.prototype.connect = function(roomName) {
    LOG.info("Attempting to connect to room {}", roomName);
    this.bot.connect(roomName);
}

/**
 * Attempts to force skip the current song. The bot must have a position of bouncer
 * or above in the room for this to work.
 *
 * @param {function} callback - Optional. If provided, will be called once the song
 *                              is skipped or if skipping fails. The callback is passed
 *                              a Boolean parameter which is true if a song was skipped.
 *                              (Skipping can fail for lack of permissions or just because
 *                              there is no current DJ.)
 */
Bot.prototype.forceSkip = function(callback) {
    var wasSkipQueued = this.bot.moderateForceSkip(function() {
        if (callback) {
            callback(true);
        }
    });

    // If queuing failed our callback will never trigger, so do it now
    if (!wasSkipQueued && callback) {
        callback(false);
    }
}

/**
 * Makes the bot grab the currently playing song. This can fail if there is
 * no song playing currently, or if the bot has no active playlist.
 *
 * @param {function} callback - Optional. If provided, will be called once the bot
 *                              has grabbed, or once grabbing has failed. The callback
 *                              is passed a Boolean parameter which is true if the bot grabbed.
 */
Bot.prototype.grabSong = function(callback) {
    var wasGrabQueued = this.bot.grab(function() {
        if (callback) {
            callback(true);
        }
    });

    if (!wasGrabQueued && callback) {
        callback(false);
    }
}

/**
 * Attempts to place the bot in the wait list. This will fail if the bot is already
 * in the wait list, the wait list is locked, or the bot has no playlists.
 *
 * @param {function} callback - Optional. If provided, will be called once the bot
 *                              has joined the wait list, or once joining has failed.
 *                              The callback is passed a Boolean parameter which is true
 *                              if the bot joined the wait list.
 */
Bot.prototype.joinWaitList = function(callback) {
    var wasJoinQueued = this.bot.joinBooth(function() {
        if (callback) {
            callback(true);
        }
    });

    if (!wasJoinQueued && callback) {
        callback(false);
    }
}

/**
 * Attempts to place the bot in the wait list. This will fail if the bot is not in
 * the wait list to begin with.
 *
 * @param {function} callback - Optional. If provided, will be called once the bot
 *                              has left the wait list, or once leaving has failed.
 *                              The callback is passed a Boolean parameter which is true
 *                              if the bot left the wait list.
 */
Bot.prototype.leaveWaitList = function(callback) {
    var wasLeaveQueued = this.bot.leaveBooth(function() {
        if (callback) {
            callback(true);
        }
    });

    if (!wasLeaveQueued && callback) {
        callback(false);
    }
}

/**
 * Makes the bot meh the currently playing song. This can fail if there is
 * no song playing currently.
 *
 * @param {function} callback - Optional. If provided, will be called once the bot
 *                              has mehed, or once mehing has failed. The callback
 *                              is passed a Boolean parameter which is true if the bot mehed.
 */
Bot.prototype.mehSong = function(callback) {
    var wasMehQueued = this.bot.meh(function() {
        if (callback) {
            callback(true);
        }
    });

    if (!wasMehQueued && callback) {
        callback(false);
    }
}

/**
 * Attempts to change a DJ's position in the wait list.
 *
 * @param {mixed} userID - String or number representing the userID of the user to be moved
 * @param {integer} newPosition - The new position the user should occupy in the wait list
 * @param {function} callback - Optional. If provided, will be called once the user has been moved,
 *                              or once moving has failed. Moving can fail if the user is not found,
 *                              is not in the wait list, or already occupies this position in the
 *                              wait list. The callback is passed a Boolean parameter which is
 *                              true if the user was moved.
 */
Bot.prototype.moveDjInWaitList = function(userID, newPosition, callback) {
    var wasRequestQueued = this.bot.moderateMoveDJ(userID, newPosition, function() {
        callback(true);
    });

    if (!wasRequestQueued && callback) {
        callback(false);
    }
}

/**
 * Sends a chat message from the bot to the room. The message string can
 * contain sets of curly braces ("{}") as placeholders. Any such placeholders
 * will be replaced by their respective arguments to the function, if any. Any
 * non-primitive arguments will be serialized via JSON.stringify and sent in
 * that form.
 *
 * If the output message needs to contain "{}" in its literal form for some reason,
 * then pass the string "{}" as the corresponding argument. If there are more sets
 * of curly braces than there are extra arguments to the function, any leftover
 * sets of curly braces will be passed through in their literal form.
 *
 * @example <caption>Example of string substitution with primitives.</caption>
 * // outputs "User coolguy has received 5 woots"
 * bot.sendChat("User {} has received {} woots", "coolguy", 5);
 *
 * @example <caption>Example of string substitution with an object.</caption>
 * // outputs "The event is {"type":"vote"}
 * bot.sendChat("The event is {}", { type: "vote" });
 *
 * @param {String} message - The message to send from the bot.
 */
Bot.prototype.sendChat = function(message /*, varargs */) {
    message = Utils.replaceStringPlaceholders(message, arguments);
    this.bot.sendChat(message);
}

/**
 * Makes the bot woot the currently playing song. This can fail if there is
 * no song playing currently.
 *
 * @param {function} callback - Optional. If provided, will be called once the bot
 *                              has wooted, or once wooting has failed. The callback
 *                              is passed a Boolean parameter which is true if the bot wooted.
 */
Bot.prototype.wootSong = function(callback) {
    var wasWootQueued = this.bot.woot(function() {
        if (callback) {
            callback(true);
        }
    });

    if (!wasWootQueued && callback) {
        callback(false);
    }
}

/**
 * Subscribes to the specified event. The given callback will be called with an
 * event object which is specific to each event.
 *
 * @param {string} eventName - The event to subscribe to, from the Event enum
 * @param {function} callback - A function to call when the event is triggered
 * @param {object} context - An optional context which will be set when calling the callback
 */
Bot.prototype.on = function(eventName, callback, /* optional */ context) {
    if (!this.eventHandlers[eventName]) {
        LOG.error("Received a request to hook into an unknown event called '{}'. Request will be ignored.", eventName);
        return;
    }

    this.eventHandlers[eventName].push({
        callback: callback,
        context: context
    });
}

/**
 * Creates a function which dispatches the given event to its listeners.
 *
 * @param {string} internalEventName - The event name from the Event enum
 * @param {function} translator - A function which translates from the DubAPI event to an internal model
 * @param {object} globalObject - The object representing global application state
 * @returns {function} An event dispatcher function appropriate to the event
 */
function _createEventDispatcher(internalEventName, translator, globalObject) {
    return function(event) {
        var handlers = this.eventHandlers[internalEventName];

        if (!translator) {
            LOG.error("Could not find a translator for internalEventName {}", internalEventName);
            return;
        }

        var internalObject = translator(event);

        if (!internalObject) {
            return;
        }

        internalObject.eventName = internalEventName;

        for (var i = 0; i < handlers.length; i++) {
            handlers[i].callback.call(handlers[i].context, internalObject, globalObject);
        }
    };
}

exports.Bot = Bot;
