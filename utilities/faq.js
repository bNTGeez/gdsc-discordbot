const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ActionRow,
} = require("discord.js");

const faqData = [
  { question: "What is your name?", answer: "Ben" },
  { question: "When are general meetings?", answer: " 6:30pm at Walker 1330" },
  { question: "What is this club?", answer: "GDSC" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Answers to FAQ"),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Choose a question")
        .addOptions(
          faqData.map((faq, index) => ({
            label: faq.question,
            description: faq.answer.substring(0, 100), // Make sure description is not too long
            value: index.toString(),
          }))
        )
    );

    try {
      await interaction.reply({
        content: "Select a question",
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Failed to reply with FAQ options:", error);
      throw error; // Rethrow the error for higher-level error handling
    }
  },
};
