const path = require("path")
require("dotenv").config({path: path.resolve(__dirname, ".env")})

const fs = require("fs")

// OpenAI Configuration/Setup
const {Configuration, OpenAIApi} = require("openai")
const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_ID,
    apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

// Discord Bot Configuration/Setup
const Discord = require("discord.js")
const rest = new Discord.REST({version: "10"}).setToken(
    process.env.DISCORD_BOT_TOKEN
);
(async() => {
    try {
        console.log("Started refreshing Discord application (/) commands.")

        await rest.put(Discord.Routes.applicationCommands(process.env.DISCORD_BOT_ID), {
            body: [
                {
                    name: "ping",
                    description: "Replies with Pong!"
                },
                {
                    name: "settings",
                    description: "Configure and fine tune the settings of the bot to your liking, for your account."
                },
                {
                    name: "generate-image",
                    description: "Generates an image from a prompt",
                    options: [
                        {
                            name: "prompt",
                            description: "The prompt to generate the image from",
                            type: 3,
                            required: true
                        }
                    ]
                }
            ]
        })

        console.log("Successfully reloaded Discord application (/) commands.")
    } catch(err) {
        console.error(err)
    }
})()

const client = new Discord.Client({
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.Message
    ],
    intents: [
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.DirectMessageTyping,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers
    ]
})

client.on(Discord.Events.InteractionCreate, async interaction => {
    try {
        if(!interaction.isCommand()) return
        if(interaction.commandName === "ping") {
            await interaction.reply(`Pong! \`${client.ws.ping}ms\``)
        }
        if(interaction.commandName === "generate-image") {
            await interaction.deferReply()

            const prompt = interaction.options.getString("prompt")
            const response = await openai.createImage({
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            })

            await interaction.editReply(response.data.data[0].url)
            await interaction.followUp({
                content: "Here is your AI generated image!"
            })
        }
        if(interaction.commandName === "settings") {
            await interaction.deferReply()

            const database = JSON.parse(fs.readFileSync("database.json"))
            const user = database.users.find(user => user.id === interaction.user.id)
            if(!user) {
                database.users.push({
                    id: interaction.user.id,
                    model: "text-davinci-003"
                })
                fs.writeFileSync("database.json", JSON.stringify(database, null, 4))
            }

            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId("modelType")
                        .setPlaceholder(user.model)
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions([
                            {
                                label: "text-davinci-003",
                                value: "text-davinci-003",
                                description: "The default model type, which is the best model type for text generation."
                            },
                            {
                                label: "code-davinci-002 (WIP)",
                                value: "code-davinci-002",
                                description: "The best model type for code generation."
                            },
                            {
                                label: "code-davinci-001 (WIP)",
                                value: "code-davinci-001",
                                description: "An older version of the code-davinci model type."
                            }
                        ])
                )

            fs.readFile("./database.json", "utf8", function(err, data) {
                if(err) {
                    console.error(err)
                } else {
                    let database = JSON.parse(data)
                    let user = database.users.find(function(user) {
                        return user.id === interaction.user.id
                    })

                    interaction.editReply({
                        content: `Personal Settings for: ${interaction.user.tag}`,
                        components: [row]
                    })
                }
            })

            const filter = i => i.customId === 'modelType' && i.user.id === interaction.user.id
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 })

            collector.on('collect', async i => {
                if (i.customId === 'modelType') {
                    await i.update({ content: `Switched model to \`${i.values.join(', ')}\` for ${interaction.user.tag}.`, components: [] })

                    fs.readFile("./database.json", "utf8", function(err, data) {
                        if(err) {
                            console.error(err)
                        } else {
                            let database = JSON.parse(data)
                            let user = database.users.find(function(user) {
                                return user.id === interaction.user.id
                            })

                            if(user) user.model = i.values.join(', ')
                            else database.users.push({
                                id: interaction.user.id,
                                model: i.values.join(', ')
                            })

                            fs.writeFile("./database.json", JSON.stringify(database), function(err) {
                                if(err) console.error(err)
                            })
                        }
                    })
                }
            })

            collector.on('end', collected => {
                if(collected.size === 0) {
                    interaction.deleteReply()
                }
            })
        }
    } catch(err) {
        console.error(err)
        await interaction.editReply({
            content: "Yikes! It looks like something went wrong... Perhaps try again?"
        })
    }
})
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})
client.on("messageCreate", async message => {
    if(message.channel.id === process.env.DISCORD_BOT_TEXT_CHANNEL_ID.toString() || message.channel.id === process.env.DISCORD_BOT_TEXT_CHANNEL_ID_SECONDARY.toString() || !message.guild) {
        if(message.author.bot) return

        try {
            const database = JSON.parse(fs.readFileSync("database.json"))
            const user = database.users.find(user => user.id === message.author.id)
            if(!user) {
                database.users.push({
                    id: message.author.id,
                    model: "text-davinci-003"
                })
                fs.writeFileSync("database.json", JSON.stringify(database, null, 4))
            }

            const messages = await message.channel.messages.fetch({limit: 3})
            const lastMessages = messages.filter(m => m.author.id === message.author.id || m.author.id === process.env.DISCORD_BOT_ID).map(m => m.content)

            let promptText = `AI: ${lastMessages.join("\nUser: ")}\nUser: ${message.content}\nAI: `
            let promptCode = `${message.content}`
            const response = await openai.createCompletion({
                model: user.model,
                prompt: user.model === "text-davinci-003" ? promptText : promptCode,
                max_tokens: 350,
                temperature: 0.9
            })

            if(user.model === "text-davinci-003") {
                try {
                    await message.reply(response.data.choices[0].text)
                } catch {
                    await message.channel.send(`<@${message.author.id}>, ${response.data.choices[0].text}`)
                }
            } else if(user.model === "code-davinci-002" || user.model === "code-davinci-001") {
                try {
                    await message.reply(`\`\`\`\n${response.data.choices[0].text}\n\`\`\``)
                } catch {
                    await message.channel.send(`<@${message.author.id}>, \n\n \`\`\`${response.data.choices[0].text}\`\`\``)
                }
            } else {
                try {
                    await message.reply(response.data.choices[0].text)
                } catch {
                    await message.channel.send(`<@${message.author.id}>, ${response.data.choices[0].text}`)
                }
            }
        } catch(err) {
            return message.channel.send("Yikes! It looks like something went wrong... Perhaps try again?")
            console.error(err)
        }
    }
})

try {
    client.login(process.env.DISCORD_BOT_TOKEN)
} catch(err) {
    console.error(err)
}