import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Sample vocabulary data for each mode
const vocabularyData = {
  antonym: [
    { word: "grand", answer: "petit", options: ["petit", "moyen", "énorme", "large"] },
    { word: "chaud", answer: "froid", options: ["froid", "tiède", "brûlant", "glacé"] },
    { word: "rapide", answer: "lent", options: ["lent", "moyen", "vite", "normal"] },
    { word: "heureux", answer: "triste", options: ["triste", "joyeux", "content", "gai"] },
    { word: "facile", answer: "difficile", options: ["difficile", "simple", "compliqué", "dur"] },
    { word: "nouveau", answer: "ancien", options: ["ancien", "récent", "moderne", "vieux"] },
    { word: "riche", answer: "pauvre", options: ["pauvre", "fortuné", "aisé", "démuni"] },
    { word: "fort", answer: "faible", options: ["faible", "puissant", "robuste", "fragile"] },
  ],
  
  synonym: [
    { word: "maison", answer: "habitation", options: ["habitation", "voiture", "jardin", "rue"] },
    { word: "content", answer: "heureux", options: ["heureux", "triste", "fâché", "inquiet"] },
    { word: "voiture", answer: "automobile", options: ["automobile", "vélo", "train", "avion"] },
    { word: "beau", answer: "joli", options: ["joli", "laid", "grand", "petit"] },
    { word: "intelligent", answer: "malin", options: ["malin", "bête", "grand", "fort"] },
    { word: "commencer", answer: "débuter", options: ["débuter", "finir", "continuer", "arrêter"] },
    { word: "regarder", answer: "observer", options: ["observer", "écouter", "toucher", "sentir"] },
    { word: "parler", answer: "discuter", options: ["discuter", "écouter", "chanter", "crier"] },
  ],
  
  wordFamily: [
    { word: "connaître", answer: "reconnaître", options: ["reconnaître", "paraître", "naître", "croître"] },
    { word: "faire", answer: "refaire", options: ["refaire", "défaire", "parfaire", "surfaire"] },
    { word: "porter", answer: "apporter", options: ["apporter", "emporter", "reporter", "supporter"] },
    { word: "venir", answer: "revenir", options: ["revenir", "devenir", "prévenir", "convenir"] },
    { word: "prendre", answer: "reprendre", options: ["reprendre", "apprendre", "comprendre", "surprendre"] },
    { word: "mettre", answer: "remettre", options: ["remettre", "permettre", "promettre", "admettre"] },
    { word: "tenir", answer: "retenir", options: ["retenir", "obtenir", "maintenir", "contenir"] },
    { word: "voir", answer: "revoir", options: ["revoir", "prévoir", "entrevoir", "pourvoir"] },
  ],
  
  lexicalField: [
    { word: "pomme, banane, orange", answer: "fruits", options: ["fruits", "légumes", "couleurs", "formes"] },
    { word: "chaise, table, lit", answer: "meubles", options: ["meubles", "vêtements", "animaux", "outils"] },
    { word: "rouge, bleu, vert", answer: "couleurs", options: ["couleurs", "nombres", "formes", "tailles"] },
    { word: "chat, chien, oiseau", answer: "animaux", options: ["animaux", "plantes", "objets", "personnes"] },
    { word: "pain, beurre, fromage", answer: "nourriture", options: ["nourriture", "boissons", "vêtements", "jouets"] },
    { word: "voiture, vélo, train", answer: "transports", options: ["transports", "sports", "métiers", "loisirs"] },
    { word: "médecin, professeur, boulanger", answer: "métiers", options: ["métiers", "loisirs", "sports", "animaux"] },
    { word: "football, tennis, natation", answer: "sports", options: ["sports", "métiers", "couleurs", "fruits"] },
  ],
};

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const initializeVocabulary = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if vocabulary is already initialized
    const existingVocab = await ctx.db.query("vocabulary").first();
    if (existingVocab) {
      return "Vocabulary already initialized";
    }
    
    // Insert vocabulary data
    for (const [type, words] of Object.entries(vocabularyData)) {
      for (const wordData of words) {
        await ctx.db.insert("vocabulary", {
          word: wordData.word,
          type: type as any,
          answer: wordData.answer,
          options: wordData.options,
        });
      }
    }
    
    return "Vocabulary initialized successfully";
  },
});

export const getRandomQuestion = query({
  args: { 
    mode: v.union(v.literal("antonym"), v.literal("synonym"), v.literal("wordFamily"), v.literal("lexicalField")),
    key: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("vocabulary")
      .withIndex("by_type", (q) => q.eq("type", args.mode))
      .collect();
    
    if (questions.length === 0) {
      return null;
    }
    
    // Use the key to ensure we get different questions each time
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];
    
    // Shuffle the options to randomize answer positions
    const shuffledOptions = shuffleArray(question.options);
    
    return {
      ...question,
      options: shuffledOptions
    };
  },
});

export const submitAnswer = mutation({
  args: {
    teamId: v.id("teams"),
    mode: v.union(v.literal("antonym"), v.literal("synonym"), v.literal("wordFamily"), v.literal("lexicalField")),
    isCorrect: v.boolean(),
    score: v.number(),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("games", {
      teamId: args.teamId,
      mode: args.mode,
      score: args.score,
      totalQuestions: args.totalQuestions,
      correctAnswers: args.correctAnswers,
    });
    
    return "Score submitted successfully";
  },
});

export const getTeamStats = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("games")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    const stats = {
      antonym: { score: 0, games: 0 },
      synonym: { score: 0, games: 0 },
      wordFamily: { score: 0, games: 0 },
      lexicalField: { score: 0, games: 0 },
      total: { score: 0, games: 0 },
    };
    
    games.forEach(game => {
      stats[game.mode].score += game.score;
      stats[game.mode].games += 1;
      stats.total.score += game.score;
      stats.total.games += 1;
    });
    
    return stats;
  },
});
