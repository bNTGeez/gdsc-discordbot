module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Error fetching reaction:", error);
        return;
      }
    }

    const roleMap = {
      "🧍": "General Member",
      "👨‍💻": "Explore Cohort",
      "👨‍🎨": "Product Cohort",
      "👨‍🎤": "Research Cohort",
      "👨": "Board Member",
    };

    if (roleMap.hasOwnProperty(reaction.emoji.name)) {
      const roleName = roleMap[reaction.emoji.name];
      const role = reaction.message.guild.roles.cache.find(
        (r) => r.name === roleName
      );

      if (!role) return;

      const member = reaction.message.guild.members.cache.get(user.id);
      try {
        await member.roles.add(role);
      } catch (error) {
        console.error("Error adding role:", error);
      }
    }
  },
};
