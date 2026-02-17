import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const animalNames = [
  "Lion", "Tigre", "Éléphant", "Girafe", "Zèbre", "Rhinocéros", "Hippopotame", "Crocodile",
  "Pingouin", "Dauphin", "Baleine", "Requin", "Aigle", "Faucon", "Hibou", "Perroquet",
  "Panda", "Koala", "Kangourou", "Loup", "Renard", "Ours", "Cerf", "Lapin",
  "Chat", "Chien", "Cheval", "Vache", "Mouton", "Cochon", "Poule", "Canard"
];

export const createTeam = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    // Generate a random animal name
    const randomAnimal = animalNames[Math.floor(Math.random() * animalNames.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    const teamName = `${randomAnimal} ${randomNumber}`;
    
    const teamId = await ctx.db.insert("teams", {
      name: teamName,
      userId: userId || undefined,
    });
    
    return { teamId, teamName };
  },
});

export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("games").collect();
    const teams = await ctx.db.query("teams").collect();
    
    const teamScores = new Map();
    
    // Initialize team scores
    teams.forEach(team => {
      teamScores.set(team._id, {
        teamName: team.name,
        antonym: 0,
        synonym: 0,
        wordFamily: 0,
        lexicalField: 0,
        total: 0,
        gamesPlayed: 0,
      });
    });
    
    // Calculate scores by mode
    games.forEach(game => {
      const teamScore = teamScores.get(game.teamId);
      if (teamScore) {
        teamScore[game.mode] += game.score;
        teamScore.total += game.score;
        teamScore.gamesPlayed += 1;
      }
    });
    
    return Array.from(teamScores.values())
      .filter(team => team.gamesPlayed > 0)
      .sort((a, b) => b.total - a.total);
  },
});
