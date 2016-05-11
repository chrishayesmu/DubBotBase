# DubBotBase

Provides a configuration-driven base for building [dubtrack.fm](https://www.dubtrack.fm) bots which run in [Node.js](https://nodejs.org/).

# Installation

DubBotBase is available for consumption via [npm](https://www.npmjs.com/package/dubbotbase).

# What's the point?

DubBotBase has the following goals:

* To abstract away the details of the dubtrack.fm API
* To make it simple to add new functionality to a bot
* To encourage good architecture in client applications, especially via loose coupling
* To provide enough configuration to be useful, but not so much to be overwhelming

This project was created after I wrote my own bot, which had to be modified on a regular basis due to changes in the underlying API. Eventually I ended up retiring the bot as I didn't have enough time to keep up with the changes I was seeing. After learning from my mistakes there, I decided it would be best to create a separate NPM module which could be utilized to provide the basic bot framework. Then, I could create my bot by focusing just on the behaviors I wanted to achieve, and not worry too much about how to interface with dubtrack.fm itself.

# What DubBotBase is not

DubBotBase is *not* a fully-functional bot in any sense of the term. If you download and run the project, it will do just two things:

1. Log into a dubtrack.fm room using configuration-provided values, and
2. Perform some application logging of the things it sees while there.

DubBotBase is intended only as a starting point for building functional bots.

# Who's using DubBotBase

Right now I'm using DubBotBase to power my own bot, called [EmancipatorBot](https://github.com/chrishayesmu/EmancipatorBot). If you're using DubBotBase in your own project, let me know!

# Getting started

Running a bot on top of DubBotBase is straightforward. You need to set up some required configuration (see below), then you're ready to add functionality to your bot, which is a simple matter of having files in the right directory structure.

You can follow the [Getting Started guide](https://github.com/chrishayesmu/DubBotBase/wiki/Getting-Started).

# FAQ

#### I have an idea for functionality/a bug report..

Feel free to [raise an issue about it](https://github.com/chrishayesmu/DubBotBase/issues) or submit a pull request.
