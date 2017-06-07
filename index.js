const botgram = require('botgram')
const config = require('./config')
const shell = require('shelljs')
const fs = require('fs')
const request = require('request')


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
    msg.context.displayName = ""
    if (msg.from.firstname !== undefined) msg.context.displayName += msg.from.firstname
    if (msg.from.lastname !== undefined) msg.context.displayName += " " + msg.from.lastname
    if (msg.from.username !== undefined) msg.context.displayName += " (" + msg.from.username + ")"


    console.log(`${msg.context.displayName} (chat=${msg.chat.id}, from=${msg.from.id}): ${msg.text}`)
    next()
})

// authentication
bot.all(function (msg, reply, next) {
    const from = msg.from.id
    const chat = msg.chat.id
    if (config.admin_chats.indexOf(chat) >= 0) msg.context.admin = true
    if (config.admin_users.indexOf(from) >= 0) msg.context.admin = true

    if (config.user_chats.indexOf(chat) >= 0) msg.context.user = true
    if (config.user_users.indexOf(from) >= 0) msg.context.user = true

    if (config.test_chats.indexOf(chat) >= 0) msg.context.test = true
    if (config.test_users.indexOf(from) >= 0) msg.context.test = true

    next()
})


bot.command('quit', 'restart', 'update', 'reset', 'pull', function (msg, reply, next) {
    if (!msg.context.admin && !msg.context.test) return next()

    save()

    reply.text('Updating and restarting bot...').then((err, result) => {
        process.exit(0)
    })
})


bot.command('save', function (msg, reply, next) {
    if (!msg.context.admin) return next()
    save()
    reply.text("Saved!")
})

require('./topics')(bot)

bot.command('ping', function (msg, reply, next) {
    reply.text("pong")
})

bot.command('id', function (msg, reply, next) {
    let text = "Your telegram user id is *" + msg.from.id + "*"
    if (msg.context.user) text += "\nYou are a *user*"
    if (msg.context.admin) text += "\nYou are an *admin*"
    if (msg.context.test) text += "\nYou are a *tester*"
    reply.text(text, "Markdown")
})

bot.command('drive', function (msg, reply, next) {
    if (!msg.context.admin) {
        reply.text("Must be admin")
        return next()
    }

    bot.reply(config.admin_chat).text("https://goo.gl/D91B3Q")
})


bot.command('say', function (msg, reply, next) {
    if (!msg.context.admin && !msg.context.test) {
        reply.text("pos va a ser que no")
        return next()
    }

    bot.reply(config.user_chat).text(msg.args())
})


bot.command('ins', 'inscriptions', 'inscripciones', function (msg, reply, next) {
    if (bot.store.numInscriptions === undefined) {
        reply.text("No data, sorry")
        return
    }
    reply.text("Total inscriptions to 3D course: " + bot.store.numInscriptions)
})


// catch all handler, only works when directly mentioned
bot.command(function (msg, reply, next) {
    reply.text("Invalid command.")
})


function save() {
    fs.writeFileSync(filename, JSON.stringify(bot.store))
}

process.on('SIGINT', function () {
    console.log("Caught interrupt signal... saving")
    save()
    console.log("Saved. Bye.")
    process.exit(0)
})


function setup() {

    // get last commit
    const head = shell.exec('git rev-parse master', {silent: true}).stdout.trim().substr(0, 7)

    const msg = "Bot online. Last commit: " + head
    bot.reply(config.test_chat).text(msg)
    //bot.reply(config.admin_chat).text(msg)

    bot.ticks = []

    function addTick(fun, interval, immediate = true) {
        bot.ticks.push({
            "fun": fun,
            "interval": interval,
            "last": new Date().getTime()
        })
        if (immediate) fun()
    }

    addTick(inscriptions, 20 * 1000)


    tick()
}


setup()



function inscriptions() {
    //console.log("Getting inscriptions")
    request('https://cursos.jediupc.com/api/courseInstances/inscriptions', function (error, response, body) {
        const res = JSON.parse(response.body)
        res.forEach(function (x) {
            //console.log("result:",x)
            if (x._id === "592ae773041bcdab066c40b4") {
                const old = bot.store.numInscriptions
                const curr = x.inscribed
                if (old !== curr) {
                    bot.store.numInscriptions = curr
                    bot.reply(config.admin_chat).text("New inscription! Total inscriptions: " + curr)
                }
            }
        })

    })

}


bot.on("error", (err) => {
    bot.reply(config.test_chat).text("Error:\n" + err)
})


function tick() {
    bot.ticks.forEach(function (x) {
        if (new Date().getTime() - x.last >= x.interval) {
            x.fun()
            x.last = new Date().getTime()
        }
    })

    setTimeout(tick, 500)
}