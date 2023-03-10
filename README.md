<h1 align="center">
  <strong>Bytedefined - openai-discord-bot</strong>
</h1>
<p align="center">
  <strong>A Discord bot that utilises GPT-3 and other models from OpenAI. This Discord bot brings the OpenAI experience right into your Discord server and direct messages.</strong>
</p>

---

## Structure

| Code base            |        Description         |
|:---------------------|:--------------------------:|
| [openai-discord-bot] | Node.JS OpenAI Discord Bot |

## Branches

<ul>
    <li>main -> Development (pull-request this branch for everything).</li>
    <li>production -> Production (only merge from the staging branch to this branch when completely stable).</li>
</ul>

## Code of Conduct
Please read CODE_OF_CONDUCT.md for more information about our code of conduct.

## Contributions
When adding a new feature or fixing a bug, create an issue on GitHub so that other developers know that the feature is
already being created or the bug is already being fixed.

## Running the OpenAI Discord bot locally
Before continuing with the following instructions, please ensure that you have the latest version of Node.JS and Yarn installed on your local machine.

Node.JS: https://nodejs.org/en/download/

To install or update Yarn, after you have installed Node.JS, run the following command in your terminal:

```bash
npm install --g yarn
```

To run the OpenAI Discord bot locally, first clone the repository to your local machine, change directory into the cloned repository, and install the dependencies using Yarn.

```bash
git clone https://github.com/Bytedefined/openai-discord-bot.git
cd openai-discord-bot
yarn install
```

After you have completed that, open the copy the .env.example file contents to a file called .env and fill in the required fields.

You will be required to create a Discord application and bot in order to get the required tokens/secrets/IDs.

You will also need to create an OpenAI account and head over to https://beta.openai.com/account/api-keys to generate an API key, and then you will need to head over to https://beta.openai.com/account/org-settings to retrieve your organisation ID.

```bash
cp .env.example .env
```
**Optionally:** *You may do the above manually*

Now you may run the Node.JS application using the following command:

```bash
yarn start
```

Congratulations! You have successfully run the OpenAI Discord bot locally.

## How to use the OpenAI Discord bot
To use the OpenAI Discord bot, you will need to invite the bot to your Discord server. You can do this by using the following link: https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=534723950656&scope=bot%20applications.commands

Make sure to replace CLIENT_ID in the above URL with the client ID of the Discord bot. You can find the client ID in the Discord developer portal.

Afterwards you can use the following Discord interaction slash commands to interact with the OpenAI Discord bot:

| Interaction Slash Command | Description                                                                          |
|:--------------------------|:-------------------------------------------------------------------------------------|
| `/generate-image :prompt` | Generates an image based on a provided prompt using DALL-E.                          |
| `/chat :prompt`           | Generates a text response based on a provided prompt using your chosen OpenAI model. |
| `/help`                   | Displays the Discord bot's help menu.                                                |
| `/ping`                   | Replies with Pong, as well as the Discord bot's current response time.               |
| `/settings-privacy`       | Configure privacy settings of the Discord bot for your account.                      |
| `/settings-model`         | Configure model settings of the Discord bot for your account.                        |


## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
