module.exports = {
  name: "messageReactionRemove",
  async execute(reaction, user) {
    // Ignore reactions from bots
    if (user.bot) return;

    // Handle partial reactions by fetching the complete data
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Error fetching reaction:", error);
        return;
      }
    }

    // Map of emoji to role names
    const roleMap = {
      "🧍": "General Member",
      "👨‍💻": "Explore Cohort",
      "👨‍🎨": "Product Cohort",
      "👨‍🎤": "Research Cohort",
      "👨": "Board Member",
    };

    // Check if the removed reaction emoji corresponds to a role
    if (roleMap.hasOwnProperty(reaction.emoji.name)) {
      const roleName = roleMap[reaction.emoji.name];
      // Find the role object in the guild
      const role = reaction.message.guild.roles.cache.find(
        (r) => r.name === roleName
      );

      if (!role) return;

      // Get the member who removed the reaction
      const member = reaction.message.guild.members.cache.get(user.id);
      // Remove the role from the member
      try {
        await member.roles.remove(role);
      } catch (error) {
        console.error("Error removing role:", error);
      }
    }
  },
};
