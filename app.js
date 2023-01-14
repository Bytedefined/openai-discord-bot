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
                    description: "Replies with Pong, as well as the Discord bot's current response time."
                },
                {
                    name: "settings-model",
                    description: "Configure model settings of the bot for your account."
                },
                {
                    name: "settings-privacy",
                    description: "Configure privacy settings of the bot for your account."
                },
                {
                    name: "generate-image",
                    description: "Generates an image response based on a provided prompt using DALL-E.",
                    options: [
                        {
                            name: "prompt",
                            description: "The prompt to generate the image from.",
                            type: 3,
                            required: true
                        }
                    ]
                },
                {
                    name: "chat",
                    description: "Generates a text response based on a provided prompt using your chosen OpenAI model.",
                    options: [
                        {
                            name: "prompt",
                            description: "Absolutely anything.",
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

        const database = JSON.parse(fs.readFileSync("database.json"))
        const user = database.users.find(user => user.id === interaction.user.id)

        if(!user) {
            database.users.push({
                id: interaction.user.id,
                model: "text-davinci-003",
                responsesHidden: false
            })
            fs.writeFileSync("database.json", JSON.stringify(database, null, 4))
        }

        if(interaction.commandName === "ping") {
            await interaction.deferReply(
                {
                    ephemeral: user.responsesHidden
                }
            )
            await interaction.editReply(`Pong! \`Response Time: ${client.ws.ping}ms\``)
        }
        if(interaction.commandName === "generate-image") {
            await interaction.deferReply(
                {
                    ephemeral: user.responsesHidden
                }
            )

            const prompt = interaction.options.getString("prompt")
            const response = await openai.createImage({
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            })

            await interaction.editReply(response.data.data[0].url)
        }
        if(interaction.commandName === "settings-privacy") {
            await interaction.deferReply(
                {
                    ephemeral: true
                }
            )

            const database = JSON.parse(fs.readFileSync("database.json"))
            const user = database.users.find(user => user.id === interaction.user.id)
            if(!user) {
                database.users.push({
                    id: interaction.user.id,
                    model: "text-davinci-003",
                    responsesHidden: false
                })
                fs.writeFileSync("database.json", JSON.stringify(database, null, 4))
            }

            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId("responsesHiddenType")
                        .setPlaceholder(user.responsesHidden ? "Responses Hidden" : "Responses Shown")
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions([
                            {
                                label: "Responses Shown",
                                value: "false",
                                description: "Public Discord bot responses to server members."
                            },
                            {
                                label: "Responses Hidden",
                                value: "true",
                                description: "Hidden Discord bot responses to server members."
                            }
                        ]),
                )

            interaction.editReply({
                content: `Privacy Settings`,
                components: [row]
            })

            const filter = i => i.customId === 'responsesHiddenType' && i.user.id === interaction.user.id
            const collector = interaction.channel.createMessageComponentCollector({ filter })

            collector.on('collect', async i => {
                if (i.customId === 'responsesHiddenType') {
                    await i.update({
                        content: `Discord bot responses are now \`${JSON.parse(i.values.join(', ')) ? 'hidden' : 'public'}\`.`,
                        components: []
                    })

                    fs.readFile("./database.json", "utf8", function(err, data) {
                        if(err) {
                            console.error(err)
                        } else {
                            let database = JSON.parse(data)
                            let user = database.users.find(function(user) {
                                return user.id === interaction.user.id
                            })

                            if(user) user.responsesHidden = JSON.parse(i.values.join(', '))
                            else database.users.push({
                                id: interaction.user.id,
                                model: "text-davinci-003",
                                responsesHidden: JSON.parse(i.values.join(', '))
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
        if(interaction.commandName === "settings-model") {
            await interaction.deferReply(
                {
                    ephemeral: true
                }
            )

            const database = JSON.parse(fs.readFileSync("database.json"))
            const user = database.users.find(user => user.id === interaction.user.id)
            if(!user) {
                database.users.push({
                    id: interaction.user.id,
                    model: "text-davinci-003",
                    responsesHidden: false
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
                        ]),
                )

            interaction.editReply({
                content: `OpenAI Model Settings`,
                components: [row]
            })

            const filter = i => i.customId === 'modelType' && i.user.id === interaction.user.id
            const collector = interaction.channel.createMessageComponentCollector({ filter })

            collector.on('collect', async i => {
                if (i.customId === 'modelType') {
                    await i.update({
                        content: `Switched OpenAI model-type to \`${i.values.join(', ')}\`.`,
                        components: []
                    })

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
                                model: i.values.join(', '),
                                responsesHidden: false
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
        if(interaction.commandName === "chat") {
            await interaction.deferReply(
                {
                    ephemeral: user.responsesHidden
                }
            )

            if(interaction.channel.id === process.env.DISCORD_BOT_TEXT_CHANNEL_ID.toString() || interaction.channel.id === process.env.DISCORD_BOT_TEXT_CHANNEL_ID_SECONDARY.toString() || !interaction.guild) {
                try {
                    const messages = await interaction.channel.messages.fetch({ limit: 3 })
                    const lastMessages = messages.filter(m => m.author.id === interaction.user.id).map(m => m.content)
                    const response = await openai.createCompletion({
                        model: user.model,
                        prompt: user.model === "text-davinci-003" ? `AI: ${lastMessages.join("\nUser: ")}\nUser: ${interaction.options.getString("prompt")}\nAI: ` : `${interaction.options.getString("prompt")}`,
                        max_tokens: 350,
                        temperature: 0.9
                    })

                    if(user.model === "text-davinci-003") {
                        await interaction.editReply(response.data.choices[0].text)
                    } else if(user.model === "code-davinci-002" || user.model === "code-davinci-001") {
                       await interaction.editReply(`\`\`\`\n${response.data.choices[0].text}\n\`\`\``)
                    } else {
                        await interaction.editReply(response.data.choices[0].text)
                    }
                } catch(err) {
                    return interaction.editReply("Yikes! It looks like something went wrong... Perhaps try again?")
                    console.error(err)
                }
            }
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
    client.user.setActivity("Made by Bytedefined#3435", { type: "PLAYING" })
})

try {
    client.login(process.env.DISCORD_BOT_TOKEN)
} catch(err) {
    console.error(err)
}