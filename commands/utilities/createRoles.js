const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createroles")
    .setDescription("Creates a role selection menu")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Only admins can use this

  async execute(interaction) {

    // roles
    const roleMap = {
      "🧍": "General Member",
      "👨‍💻": "Explore Cohort",
      "👨‍🎨": "Product Cohort",
      "👨‍🎤": "Research Cohort",
      "👨": "Board Member",
    };

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle("Choose Your Roles!")
      .setDescription(
        Object.entries(roleMap)
          .map(([emoji, role]) => `${emoji} - ${role}`)
          .join("\n")
      )
      .setColor("#FF69B4");

    // Send embed and add reactions
    const message = await interaction.channel.send({ embeds: [embed] });
    for (const emoji of Object.keys(roleMap)) {
      await message.react(emoji);
    }

    await interaction.reply({ content: "Role menu created!", ephemeral: true });
  },
};
