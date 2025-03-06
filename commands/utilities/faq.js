const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ActionRow,
  EmbedBuilder,
} = require("discord.js");

const faqData = require('../../data/faqs.json')
const Fuse = require('fuse.js')

const f = new Fuse(faqData, {
  keys: ['question'],
  includeScore: true,
  threshold: 0.6 // The maximum score that an entry can have to show up
})

const score_buffer = 0.2 // Every successive faq must be within the score threshold of the best matching question to be included
const max_questions = 3 // Maximum number of displayed questions with answers, after which 

module.exports = {
  data: new SlashCommandBuilder()
  .setName("faq")
  .setDescription("Answers to FAQ")
  .addStringOption(option => 
    option.setName('question')
    .setDescription('The FAQ question keyword to search for')),
    
  async execute(interaction) {
    const query = interaction.options.getString('question')
    const faqList = faqData.map((faq, index) => `${index + 1}. ${faq.question}`).join('\n') // Display version of faq questions
    let faqsToShow

    if (query) {
      // Check to see if a question number was put or if it was a specific question query
      if (isNaN(query)) {
        // A specific question was asked, parse possible question selection
        found_questions = f.search(query.toLowerCase()) // The relevant questions that are found by fuzzy search
        console.log(found_questions)
        if (found_questions.length > 0) {
          // There was at least one found question, display it or them
          const score_to_match = found_questions[0].score
          faqsToShow = found_questions.filter(found_question => found_question.score - score_buffer < score_to_match)
          if (faqsToShow.length > max_questions) {
            // Too many questions match, only show the maximum
            faqsToShow = faqsToShow.map((faq, index) => `${index + 1}. ${faq.item.question}`).join('\n')
            return interaction.reply({ content: `The following FAQs matched the query:\n${faqsToShow}\nType \`\`/faq {question text}\`\` or \`\`/faq {question #}\`\` to answer your question!`, ephemeral: true })
          } else {
            faqsToShow = faqsToShow.map(faq => faq.item)
          }
        } else {
          // If no questions were found, list all available questions
          return interaction.reply({ content: `Question not found! Available FAQs:\n${faqList}\nType \`\`/faq {question text}\`\` or \`\`/faq {question #}\`\` to answer your question!`, ephemeral: true })
        }
      } else {
        // Fetch the specific question number requested
        question_number = parseInt(query)
        if (question_number < 1 || question_number > faqData.length) {
          // Error case
          return interaction.reply({ content: `Invalid question #! Available FAQs:\n${faqList}\nType \`\`/faq {question text}\`\` or \`\`/faq {question #}\`\` to answer your question!`, ephemeral: true })
        } else {
          faqsToShow = [faqData[question_number - 1]]
        }
      }
      
    } else {
      console.log('no query :(')
      // If no questions were found, list all available questions
      const faqList = faqData.map((faq, index) => `${index + 1}. ${faq.question}`).join('\n')
      return interaction.reply({ content: `Available FAQs:\n${faqList}\nType \`\`/faq {question text}\`\` or \`\`/faq {question #}\`\` to answer your question!`, ephemeral: true })
    }
    
    
        
    // Create an embed with the FAQ details
    const embed = new EmbedBuilder()
    .setColor(0x00AE86)

    if (faqsToShow.length > 1) embed.setTitle('Matching Questions')

    faqsToShow.map(faq => {
      embed.addFields({name: 'Question', value: faq.question})
      embed.addFields({name: 'Answer', value: faq.answer})
    })
    return interaction.reply({ embeds: [embed] })
  }
}

