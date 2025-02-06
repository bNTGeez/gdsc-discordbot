const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ActionRow,
  EmbedBuilder,
} = require("discord.js");

const faqData = require('../../data/faqs.json')

module.exports = {
  data: new SlashCommandBuilder()
  .setName("faq")
  .setDescription("Answers to FAQ")
  .addStringOption(option => 
    option.setName('question')
    .setDescription('The FAQ question keyword to search for')),
    
  async execute(interaction) {
    const query = interaction.options.getString('question')
    let faqToShow
      
    if (query) {
      faqToShow = faqData.find(faq =>
        faq.question.toLowerCase().includes(query.toLowerCase()))
        if (!faqToShow) {
          return interaction.reply({ content: 'No FAQ found for that query.', ephemeral: true })
        }
    } else {
      // If no query is provided, list all available questions
      const faqList = faqData.map((faq, index) => `${index + 1}. ${faq.question}`).join('\n')
      return interaction.reply({ content: `Available FAQs:\n${faqList}`, ephemeral: true })
    }
        
    // Create an embed with the FAQ details
    const embed = new EmbedBuilder()
    .setTitle('Frequently Asked Question')
    .addFields(
      { name: 'Question', value: faqToShow.question },
      { name: 'Answer', value: faqToShow.answer }
      )
      .setColor(0x00AE86);
    return interaction.reply({ embeds: [embed] })
  }
}

