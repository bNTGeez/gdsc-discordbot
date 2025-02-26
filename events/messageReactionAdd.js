module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user) {
    // Skip if a bot reacted
    if (user.bot) return;

    // Load full reaction data if needed
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Error fetching reaction:", error);
        return;
      }
    }

    // List of emojis and their roles
    const roleMap = {
      "🧍": "General Member",
      "👨‍💻": "Explore Cohort",
      "👨‍🎨": "Product Cohort",
      "👨‍🎤": "Research Cohort",
      "👨": "Board Member",
    };

    // Give role based on emoji
    if (roleMap.hasOwnProperty(reaction.emoji.name)) {
      const roleName = roleMap[reaction.emoji.name];
      const role = reaction.message.guild.roles.cache.find(
        (r) => r.name === roleName
      );

      if (!role) return;

      // Add the role to user
      const member = reaction.message.guild.members.cache.get(user.id);
      try {
        await member.roles.add(role);
      } catch (error) {
        console.error("Error adding role:", error);
      }
    }
  },
};
