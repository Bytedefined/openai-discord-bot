const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// OpenAI Configuration/Setup
const { Configuration, OpenAIApi } = require("openai")
const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANISATION_ID,
    apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

// Discord Bot Configuration/Setup
const Discord = require("discord.js")
const rest = new Discord.REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN
);(async () => {
    try {
        console.log("Started refreshing Discord application (/) commands.")

        await rest.put(Discord.Routes.applicationCommands(process.env.DISCORD_BOT_ID), {
            body: [
                {
                    name: "ping",
                    description: "Replies with Pong!"
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
    } catch (err) {
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

client.on("interactionCreate", async interaction => {
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
                content: "Here is your AI generated image!",
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
    console.log(`Logged in as ${client.user.tag}!`);
})
client.on("messageCreate", async message => {
    // if channel is the one that is being used for the bot
    if (message.channel.id === process.env.DISCORD_BOT_TEXT_CHANNEL_ID.toString() || message.channel.id === process.env.DISCORD_BOT_TEXT_CHANNEL_ID_SECONDARY.toString() || !message.guild) {
        if(message.author.bot) return

        try {
            const messages = await message.channel.messages.fetch({limit: 3})
            const lastMessages = messages.filter(m => m.author.id === message.author.id).map(m => m.content)

            let prompt = `AI: ${lastMessages.join("\nUser: ")}\nUser: ${message.content}\nAI: `
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt,
                max_tokens: 350,
                temperature: 0.9
            })

            try {
                message.reply(response.data.choices[0].text)
            } catch {
                return message.channel.send("Yikes! It looks like something went wrong... Perhaps try again?")
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
    console.log(err)
}