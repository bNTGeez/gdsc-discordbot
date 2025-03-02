const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const he = require('he'); // HTML entity decoder

module.exports = {
    data:
    new SlashCommandBuilder()
        .setName("trivia")
        .setDescription("Answer some computer science themed trivia questions!"),
    async execute(interaction) {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch('https://opentdb.com/api.php?amount=50&category=18&type=multiple');
        const data = await response.json();
        const questionData = data.results[0];

        // decode HTML entities in the question and answers
        const question = he.decode(questionData.question);
        const correctAnswer = he.decode(questionData.correct_answer);
        const answers = questionData.incorrect_answers.map(ans => he.decode(ans));
        answers.push(correctAnswer); 

        const correctIndex = answers.findIndex(ans => ans === correctAnswer) + 1;
        
        const options = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('1')
                .setLabel(answers[0])
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('2')
                .setLabel(answers[1])
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('3')
                .setLabel(answers[2])
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('4')
                .setLabel(answers[3])
                .setStyle(ButtonStyle.Primary)
        );

        const triviaEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Trivia Time!')
        .setDescription(`**Choose the correct answer from the options below**\n*You have 15 seconds to answer before time is up!*\n\n**${question}**`);

        await interaction.reply({
            embeds: [triviaEmbed],
            components: [options],
        });

        // Only accept the user's interactions
        const filter = (i) => i.user.id === interaction.user.id;
        const channel = await interaction.channel;

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000,
        });

        const responseEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Trivia Time!');

        collector.on('collect', async (i) => {
            if (i.customId === correctIndex.toString()) {
                await i.update({
                    embeds: [responseEmbed.setDescription(`*${question}*\n\n🎉 Correct! The answer is **${correctAnswer}**.`)],
                    components: [],
                });
            } else {
                await i.update({
                    embeds: [responseEmbed.setDescription(`*${question}*\n\n❌ Wrong! The correct answer was **${correctAnswer}**.`)],
                    components: [],
                });
            }
            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({
                    embeds: [responseEmbed.setDescription(`*${question}*\n\n⏳ Time's up! The correct answer was **${correctAnswer}**.`)],
                    components: [],
                });
            }
        });
    }
}