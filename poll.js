/********************************************************************
 * poll.js - Button-based Poll
 *
 * - Schedules a new poll every day (via node-cron)
 * - Uses buttons for voting 
 * - Updates the poll message with new vote counts
 * - Closes after 24 hours, announces the winner
 * - Stores poll data in JSON so it can recover on restart
 ********************************************************************/

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// 1) Where to store poll data
const POLL_DATA_PATH = path.join(__dirname, 'pollData.json');

/********************************************************************
 * Helper Functions
 ********************************************************************/

// loads poll data from disk
function loadPollData() {
  if (!fs.existsSync(POLL_DATA_PATH)) return null;
  try {
    const raw = fs.readFileSync(POLL_DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading pollData.json:', err);
    return null;
  }
}

// saves poll data to disk.
function savePollData(poll) {
  try {
    fs.writeFileSync(POLL_DATA_PATH, JSON.stringify(poll, null, 2));
  } catch (err) {
    console.error('Error writing pollData.json:', err);
  }
}

// returns a random poll question from polls.json
function getRandomPoll() {
  const polls = JSON.parse(fs.readFileSync('polls.json', 'utf8'));
  return polls[Math.floor(Math.random() * polls.length)];
}

// build the embed that displays poll info and vote counts. (customize for visual aesthetic)
function buildPollEmbed(poll) {
  const embed = new EmbedBuilder()
    .setTitle('Daily Chaos Poll')
    .setDescription(poll.question)
    .setColor('#248344');

  let totalVotes = 0;
  poll.options.forEach(opt => {
    totalVotes += poll.votes[opt] || 0;
  });

  // show each option’s vote count
  poll.options.forEach((opt, i) => {
    const count = poll.votes[opt] || 0;
    const emoji = poll.emojis[i] || '•'; // fallback if no emoji array
    embed.addFields({
      name: `${emoji} ${opt}`,
      value: `\`${count} vote(s)\``,
      inline: true,
    });
  });

  embed.setFooter({
    text: totalVotes === 1 ? '1 total vote' : `${totalVotes} total votes`,
  });

  return embed;
}

// build a row of buttons 
function buildPollButtons(poll) {
  const row = new ActionRowBuilder();
  poll.options.forEach((opt, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`pollVote::${opt}`) // store the option in customId
        .setLabel(opt)
        .setStyle(ButtonStyle.Success)
        .setEmoji(poll.emojis[i] || null) // optional
    );
  });
  return [row]; // return an array of ActionRows
}

/********************************************************************
 * Main Poll Logic
 ********************************************************************/

// creates and posts a new poll message, stores the poll data, and schedules an auto-close after 24 hours

const channelId = process.env.POLL_CHANNEL_ID;

async function createNewDailyPoll(client, channelId) {
  const channel = await client.channels.fetch(channelId);
  if (!channel) {
    console.error(`Channel ${channelId} not found!`);
    return;
  }

  // picks a random poll config
  const pollTemplate = getRandomPoll();

  // construct a new poll object
  const newPoll = {
    messageId: null,
    channelId,
    question: pollTemplate.question,
    options: pollTemplate.options,
    emojis: pollTemplate.emojis || [],
    votes: {}, // object mapping: { "Windows": 5, "MacOS": 2, etc. }
    isOpen: true,
    startedAt: Date.now(),
    endsAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
  };

  // create the poll embed & buttons
  const embed = buildPollEmbed(newPoll);
  const components = buildPollButtons(newPoll);

  // send the poll message
  const pollMessage = await channel.send({ embeds: [embed], components });

  // save poll data
  newPoll.messageId = pollMessage.id;
  savePollData(newPoll);

  // schedule close after 24 hours (or use a second cron)
  setTimeout(() => closeDailyPoll(client), 24 * 60 * 60 * 1000); // edit this time to '1' to test if the error messages work
}

// closes the current poll, announces the results, and edits the original message.
async function closeDailyPoll(client) {
  const poll = loadPollData();
  if (!poll || !poll.isOpen) return; // no open poll

  poll.isOpen = false;
  savePollData(poll);

  // fetch the channel & message
  const channel = await client.channels.fetch(poll.channelId);
  if (!channel) return;
  const msg = await channel.messages.fetch(poll.messageId);
  if (!msg) return;

  // determine winner (if there is a tie, multiple winner(s) are listed)
  let highest = 0;
  let winners = [];
  for (const opt of poll.options) {
    const count = poll.votes[opt] || 0;
    if (count > highest) {
      highest = count;
      winners = [opt];
    } else if (count === highest) {
      winners.push(opt);
    }
  }

  // build final embed
  const finalEmbed = buildPollEmbed(poll)
    .setTitle('Daily Chaos Poll (CLOSED)')
    .setDescription(`**${poll.question}**\nPoll is now closed!`);
  
  if (winners.length === 1) {
    finalEmbed.addFields({ name: 'Winner', value: winners[0] });
  } else {
    finalEmbed.addFields({
      name: 'Winners (tie)',
      value: winners.join(', '),
    });
  }

  // edit original message to show (CLOSED) and remove buttons
  await msg.edit({ embeds: [finalEmbed], components: [] });

  // posts a concluding message and lists the winner(s)
  await channel.send(`:tada: The poll is over! Winner(s): **${winners.join(', ')}** with \`${highest}\` vote(s).`);

  savePollData(poll);
}

/********************************************************************
 * Handling Button Interactions
 *
 * We listen for "interactionCreate" events to catch button clicks.
 * If the customId starts with "pollVote::", we parse the option
 * and increment that vote.
 ********************************************************************/
async function handlePollButton(interaction) {
  // only handle pollVote buttons
  if (!interaction.customId.startsWith('pollVote::')) return;

  // load poll data
  const poll = loadPollData();
  if (!poll || !poll.isOpen) {
    return interaction.reply({ content: 'Poll is closed or missing!', ephemeral: true });
  }

  // parse which option was clicked
  const selectedOption = interaction.customId.split('pollVote::')[1];
  if (!poll.options.includes(selectedOption)) {
    return interaction.reply({ content: 'That option is invalid.', ephemeral: true });
  }

  // Check if user already voted
  const userId = interaction.user.id;
  if (!poll.userVotes) poll.userVotes = {}; // Ensure userVotes exists

  if (poll.userVotes[userId]) {
    return interaction.reply({
      content: `❌ You have already voted for **${poll.userVotes[userId]}**! You cannot change your vote.`,
      ephemeral: true
    });
  }

  // Record user vote
  poll.userVotes[userId] = selectedOption;

  // increment that option’s vote count
  if (!poll.votes[selectedOption]) {
    poll.votes[selectedOption] = 0;
  }
  poll.votes[selectedOption]++;

  // update poll embed
  const channel = await interaction.client.channels.fetch(poll.channelId);
  const msg = await channel.messages.fetch(poll.messageId);
  if (!msg) {
    return interaction.reply({ content: 'Poll message not found!', ephemeral: true });
  }

  const updatedEmbed = buildPollEmbed(poll);

  await msg.edit({ embeds: [updatedEmbed] });
  savePollData(poll);

  // 6) Acknowledge user’s click
  await interaction.reply({
    content: `You voted for **${selectedOption}**!`,
    ephemeral: true
  });
}

/********************************************************************
 * Exported Methods
 ********************************************************************/
module.exports = {
  // schedules a daily poll (or every minute for testing), 
  // and sets up the button handler.
  initDailyPoll: function (client, channelId) {
    // for daily 9AM, use "0 9 * * *"
    // for every minute, use "* * * * *"
    cron.schedule('* * * * *', async () => {
      console.log('Creating a new poll automatically...');
      await createNewDailyPoll(client, channelId);
    });

    // if a poll was open before restart, schedule it to close at the correct time
    const existingPoll = loadPollData();
    if (existingPoll && existingPoll.isOpen) {
      const now = Date.now();
      const timeLeft = existingPoll.endsAt - now;
      if (timeLeft > 0) {
        setTimeout(() => closeDailyPoll(client), timeLeft);
      } else {
        closeDailyPoll(client);
      }
    }

    // listen for button clicks (only does it once)
    client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton()) {
        await handlePollButton(interaction);
      }
    });
  }
};
