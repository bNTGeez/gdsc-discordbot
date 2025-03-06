const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data:
    new SlashCommandBuilder()
        .setName("8ball")
        .setDescription("Ask me a question! I will give you an answer."),
    async execute(interaction) {
        const responses = ['Without a doubt', 'Signs point to yes', 'It is decidedly so', 'Outlook good',
            'You may rely on it', 'As I see it, yes', 'Reply hazy, try again', 'Ask again later', 
            "Don't count on it", 'My sources say no', 'Very doubtful', 'Outlook not so good'];
        const randomIndex = Math.floor(Math.random() * responses.length);
        const response = responses[randomIndex];
        await interaction.reply(response);
    }
}