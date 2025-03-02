const { SlashCommandBuilder } = require('discord.js');
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
        
        let options = answers.map((ans, index) => `**${index + 1}.** ${ans}`).join('\n');

        await interaction.reply(`**Trivia Time! Choose the correct answer by typing its number.**
*You have 15 seconds to answer before time is up!*
\n${question}\n\n${options}`);

        const filter = (response) => {
            if (response.author.id !== interaction.user.id) return false; // Ignore messages from other users
            return /^\d+$/.test(response.content.trim());
        };

        const channel = await interaction.channel;
        channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] })
        .then(collected => {
            const userResponse = collected.first().content.trim();
            if (userResponse === correctIndex.toString()) {
                channel.send(`🎉 Correct! The answer is **${correctAnswer}**.`);
            } else {
                channel.send(`❌ Wrong! The correct answer was **${correctAnswer}**.`);
            }
        })
        .catch(() => {
            channel.send(`⏳ Time's up! The correct answer was **${correctAnswer}**.`);
        });
    }
}