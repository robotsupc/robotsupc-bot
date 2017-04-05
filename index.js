const botgram = require('botgram')
const config = require('./config')
const fs = require('fs')
const bot = botgram(config.telegram_bot_token)


// Add context to the messages
bot.contexts = {}


// store data
const filename = 'store.json'
try {
    bot.store = JSON.parse(fs.readFileSync(filename))
} catch (e) {
    bot.store = {}
}
console.log("store:", bot.store)


bot.all(function (msg, reply, next) {
    if (!bot.contexts[msg.chat.id])
        bot.contexts[msg.chat.id] = {}
    msg.context = bot.contexts[msg.chat.id]
    next()
})

// log
bot.all(function (msg, reply, next) {
    console.log("from:", JSON.stringify(msg.from))
    msg.context.displayName = ""
    if (msg.from.firstname !== undefined) msg.context.displayName += msg.from.firstname
    if (msg.from.lastname !== undefined) msg.context.displayName += " " + msg.from.lastname
    if (msg.from.username !== undefined) msg.context.displayName += " (" + msg.from.username + ")"


    console.log(`${msg.context.displayName} (${msg.chat.id}): ${msg.text}`)
    next()
})

// authentication
bot.all(function (msg, reply, next) {
    if (msg.chat.id === config.admin_chat) // chat group of admins
        msg.context.admin = true
    if (msg.chat.id === config.user_chat)
        msg.context.user = true
    if (msg.chat.id === config.test_chat)
        msg.context.test = true

    next()
})


bot.command('quit', function (msg, reply, next) {
    if (!msg.context.admin) return next()

    reply.text('Quitting bot in 3 seconds')

    save();

    setTimeout(function () {
        console.log("Quitting bot on admin's request")
        process.exit(0)
    }, 3000)
})



bot.command('save', function(msg, reply, next) {
    if (!msg.context.admin) return next()
    save()
    reply.text("Saved!")
})

require('./topics')(bot)

bot.command('ping', function(msg, reply, next) {
    reply.text("/pong")
})
bot.command('pong', function(msg, reply, next) {
    let r = Math.random()
    if (r < 1/3.) {
        reply.text("HAHA! You lost!");
    } else if (r < 2/3.) {
        reply.text("You won... this time.")
    } else {
        reply.text('/ping')
    }
})


// catch all handler, only works when directly mentioned
bot.command(function (msg, reply, next) {
    reply.text("Invalid command.");
})



function save() {
    fs.writeFileSync(filename, JSON.stringify(bot.store))
}

process.on('SIGINT', function() {
    console.log("Caught interrupt signal... saving");
    save();
    console.log("Saved. Bye.")
    process.exit();
});