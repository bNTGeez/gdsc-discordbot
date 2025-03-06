// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { EmbedBuilder } = require('discord.js');

require("dotenv").config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMembers,
  ],
});

// START OF INDEX.JS EDITS (AVI)

// Make sure to require poll.js and import to counting bot
const poll = require('./poll.js');

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  // Initialize daily poll in a specific channel
  // Replace YOUR_CHANNEL_ID with the ID of the channel
  // where you want the poll to appear every day.
  poll.initDailyPoll(client,process.env.POLL_CHANNEL_ID);
});

// END OF EDITS

// Log in to Discord with your client's token
client.login(process.env.DISCORDTOKEN);
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    console.log(command.data.description)
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});










//welcomeMsg = `**Head over to #roles to select the cohort you belong to!**\nFor more information about us, visit https://bento.me/gdscdavis 
and go check out the #🔔announcements channel for the latest news about our club!`

client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
  if (!channel) return;

  const embed = new EmbedBuilder()
  .setColor(0x00AE86)
  .setTitle(`Welcome to the server, ${member.user.tag}! 🎉 `)
  .setDescription(welcomeMsg);

  channel.send({embeds: [embed]});
});


// // Require the necessary discord.js classes
// const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
// const fs = require("node:fs");
// const path = require("node:path");

// require("dotenv").config();

// // Create a new client instance
// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent,
//   ],
// });

// // When the client is ready, run this code (only once).
// // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// // It makes some properties non-nullable.
// client.once(Events.ClientReady, (readyClient) => {
//   console.log(`Ready! Logged in as ${readyClient.user.tag}`);
// });

// // Log in to Discord with your client's token
// client.login(process.env.DISCORDTOKEN);
// client.commands = new Collection();

// const foldersPath = path.join(__dirname, "commands");
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
//   const commandsPath = path.join(foldersPath, folder);
//   const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
//   for (const file of commandFiles) {
//     const filePath = path.join(commandsPath, file);
//     const command = require(filePath);

//     console.log(command.data.description)
//     // Set a new item in the Collection with the key as the command name and the value as the exported module
//     if ("data" in command && "execute" in command) {
//       client.commands.set(command.data.name, command);
//     } else {
//       console.log(
//         `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
//       );
//     }
//   }
// }

// // NEW CODE (AVI)
// //const fs = require("fs");
// // temporary in-memory vote tracking (resets when the bot restarts)
// let activePolls = {}; 
// // END

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (interaction.isChatInputCommand()) {
//     const command = client.commands.get(interaction.commandName);

//     if (!command) {
//       console.error(
//         `No command matching ${interaction.commandName} was found.`
//       );
//       return;
//     }

//     try {
//       await command.execute(interaction);
//     } catch (error) {
//       console.error(error);
//       await interaction.reply({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     }
//   }

//   // NEW CODE (AVI): needed for poll.js interactions to work
//   // handle button clicks for voting
// // handle button clicks for voting
//   else if (interaction.isButton()) {
//     const [_, pollId, selectedOptionIndex] = interaction.customId.split("_");

//     // ensure poll exists
//     if (!activePolls[pollId]) {
//       await interaction.reply({
//         content: "❌ This poll is no longer active.",
//         ephemeral: true,
//       });
//       return;
//     }

//     // update vote count
//     activePolls[pollId].votes[selectedOptionIndex]++;

//     // fetch the existing results message
//     const resultsMessageId = activePolls[pollId].resultsMessageId;

//     try {
//       const resultsMessage = await interaction.channel.messages.fetch(resultsMessageId);

//       // update the results message instead of sending a new one
//       await resultsMessage.edit({
//         content: formatPollResults(activePolls[pollId].options, activePolls[pollId].votes),
//       });

//       // update the original poll message to acknowledge the interaction
//       await interaction.update({
//         content: `📊 **${activePolls[pollId].question}**\nclick a button to vote!`,
//         components: interaction.message.components, // keep buttons
//       });

//     } catch (error) {
//       console.error("❌ Failed to update poll results:", error);
//       await interaction.reply({
//         content: "❌ There was an issue updating the poll results. Please try again.",
//         ephemeral: true,
//       });
//     }
//   }
// });

// // Load reaction events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
