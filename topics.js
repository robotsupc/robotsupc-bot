module.exports = function (bot) {
    if (bot.store['topics'] === undefined) bot.store['topics'] = {}
    let topics = bot.store["topics"];

    bot.command('add', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.test) next()

        let args = msg.args(2)
        let topic = args[0]

        if (topics[topic] !== undefined) {
            reply.text("Topic '" + topic + "' already exists!")
            return next()
        }

        topics[topic] = {
            "topic": topic,
            "description": args[1],
            "subs": [],
        }

        reply.text("Created topic '" + topic + "'")
    })

    bot.command('del', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.test) next()

        let args = msg.args(2)
        let topic = args[0]

        if (topics[topic] === undefined) {
            reply.text("Topic '" + topic + "' does not exist!")
            return next()
        }

        delete topics[topic]

        reply.text("Deleted topic '" + topic + "'")
    })


    bot.command('sub', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.user && !msg.context.test) next()

        let args = msg.args(2)
        let topic = args[0]

        if (topics[topic] === undefined) {
            reply.text("Topic '" + topic + "' does not exist!")
            return next()
        }
        let subs = topics[topic].subs
        if (subs.find((x) => x.id === msg.from.id) !== undefined) {
            reply.text("You're already subscribed to '" + topic + "'.")
            return next()
        }

        subs.push(msg.from)
        reply.text("You are now subscribed to '" + topic + "'. Use '/unsub " + topic + "' to unsubscribe")
    })

    bot.command('unsub', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.user && !msg.context.test) next()

        let args = msg.args(2)
        let topic = args[0]

        if (topics[topic] === undefined) {
            reply.text("Topic '" + topic + "' does not exist!")
            return next()
        }
        let subs = topics[topic].subs
        if (subs.find((x) => x.id === msg.from.id) === undefined) {
            reply.text("You're not subscribed to '" + topic + "'.")
            return next()
        }

        topics[topic].subs = subs.filter((x) => x.id !== msg.from.id)
        reply.text("You are now unsubscribed from '" + topic + "'. Use '/sub " + topic + "' to subscribe again")
    })

    bot.command('show', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.user && !msg.context.test) next()

        let args = msg.args(2)
        let topic = args[0]

        if (topics[topic] === undefined) {
            if (Object.keys(topics).length === 0) {
                reply.text("There are no topics")
                return next()
            }
            reply.text("Topic '" + topic + "' does not exist!\n\n"
                + "Available topics:\n" + Object.keys(topics).map((x) => topics[x].topic).join("\n")
            )
            return next()
        }

        let subs = topics[topic].subs
        if (subs.find((x) => x.id === msg.from.id) === undefined && !msg.context.admin) {
            reply.text("You're not subscribed to '" + topic + "'.")
            return next()
        }

        reply.text(topic + "\n" +
                topics[topic].description + "\n\n" +
                "Subscribers: " +
                subs.map((x)=>x.firstname).join(", ")
        )


    })
}