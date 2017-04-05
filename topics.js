module.exports = function (bot) {
    if (bot.store['topics'] === undefined) bot.store['topics'] = {}
    let topics = bot.store["topics"];



    bot.command('add', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.test) return next()

        let args = msg.args().split(" ", 2)
        if (args.length < 2) {
            reply.text("Usage: /add <topic> <description>")
            return next()
        }

        let topic = args[0]
        let desc = args[1]

        if (topics[topic] !== undefined) {
            reply.text("Topic '" + topic + "' already exists!")
            return next()
        }

        topics[topic] = {
            "topic": topic,
            "description": desc,
            "subs": [],
        }

        reply.text("Created topic '" + topic + "'")
    })

    bot.command('del', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.test) return next()

        let topic = requireExistingTopic(msg, reply, next)
        if (topic === null) return next()

        delete topics[topic]

        reply.text("Deleted topic '" + topic + "'")
    })

    function requireExistingTopic(msg, reply, next) {
        let args = msg.args().split(" ")
        if (msg.args() === "") {
            reply.text("Usage: /" + msg.command + " <topic> [args]")
            return null
        }

        let topic = args[0]

        if (topics[topic] === undefined) {
            reply.text("Topic " + topic + " does nost exist!")
            return null
        }
        return topic
    }

    bot.command('sub', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.user && !msg.context.test) return next()

        let topic = requireExistingTopic(msg, reply, next)
        if (topic === null) return next()


        let subs = topics[topic].subs
        if (subs.find((x) => x.id === msg.from.id) !== undefined) {
            reply.text("You're already subscribed to '" + topic + "'.")
            return next()
        }

        subs.push(msg.from)
        reply.text("You are now subscribed to '" + topic + "'. Use '/unsub " + topic + "' to unsubscribe")
    })

    bot.command('unsub', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.user && !msg.context.test) return next()

        let topic = requireExistingTopic(msg, reply, next)
        if (topic === null) return next()

        let subs = topics[topic].subs
        if (subs.find((x) => x.id === msg.from.id) === undefined) {
            reply.text("You're not subscribed to '" + topic + "'.")
            return next()
        }

        topics[topic].subs = subs.filter((x) => x.id !== msg.from.id)
        reply.text("You are now unsubscribed from '" + topic + "'. Use '/sub " + topic + "' to subscribe again")
    })

    bot.command('show', function (msg, reply, next) {
        if (!msg.context.admin && !msg.context.user && !msg.context.test) return next()

        let args = msg.args().split(" ")
        if (msg.args() === "") {
            if (Object.keys(topics).length === 0) {
                reply.text("There are no topics")
                return next()
            }
            reply.text(
                "Available topics:\n" + Object.keys(topics).map(
                    (x) => "*" + topics[x].topic +" (" +topics[x].subs.length +  "):*\n" + topics[x].description
                ).join("\n\n")
            , "Markdown")
            return next()
        }

        let topic = requireExistingTopic(msg, reply, next)
        if (topic === null) return next()




        let subs = topics[topic].subs
        if (subs.find((x) => x.id === msg.from.id) === undefined && !msg.context.admin) {
            reply.text("You're not subscribed to '" + topic + "'.")
            return next()
        }

        reply.text(topic + "\n" +
                topics[topic].description + "\n\n" +
                "Subscribers (" + subs.length + "): " +
                subs.map((x)=>x.firstname + (x.lastname !== undefined? " " + x.lastname : "")).join(", ")
        )
    })
}