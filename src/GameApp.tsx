import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

type GameMode = "antonym" | "synonym" | "wordFamily" | "lexicalField";

const gameModeLabels = {
  antonym: "Antonymes",
  synonym: "Synonymes", 
  wordFamily: "Famille de mots",
  lexicalField: "Champ lexical"
};

const gameModeDescriptions = {
  antonym: "Trouve le contraire du mot proposé",
  synonym: "Trouve un mot qui a le même sens",
  wordFamily: "Trouve un mot de la même famille",
  lexicalField: "Trouve le thème qui regroupe ces mots"
};

export function GameApp() {
  const [currentTeamId, setCurrentTeamId] = useState<Id<"teams"> | null>(null);
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "results">("menu");
  
  const createTeam = useMutation(api.teams.createTeam);
  const initializeVocabulary = useMutation(api.games.initializeVocabulary);
  const leaderboard = useQuery(api.teams.getLeaderboard);
  const teamStats = useQuery(api.games.getTeamStats, 
    currentTeamId ? { teamId: currentTeamId } : "skip"
  );

  useEffect(() => {
    // Initialize vocabulary on first load
    initializeVocabulary().catch(console.error);
  }, [initializeVocabulary]);

  const handleCreateTeam = async () => {
    try {
      const result = await createTeam();
      setCurrentTeamId(result.teamId);
      toast.success(`Équipe créée: ${result.teamName}! 🎉`);
    } catch (error) {
      toast.error("Erreur lors de la création de l'équipe");
    }
  };

  const startGame = (mode: GameMode) => {
    setCurrentMode(mode);
    setGameState("playing");
  };

  const endGame = () => {
    setGameState("results");
  };

  const backToMenu = () => {
    setGameState("menu");
    setCurrentMode(null);
  };

  if (!currentTeamId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Bienvenue dans le jeu de vocabulaire français! 🇫🇷
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Crée ton équipe pour commencer à jouer
        </p>
        <button
          onClick={handleCreateTeam}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Créer une équipe 🦁
        </button>
      </div>
    );
  }

  if (gameState === "playing" && currentMode) {
    return (
      <GamePlay 
        teamId={currentTeamId}
        mode={currentMode}
        onGameEnd={endGame}
        onBackToMenu={backToMenu}
      />
    );
  }

  if (gameState === "results" && currentMode) {
    return (
      <GameResults 
        teamId={currentTeamId}
        mode={currentMode}
        onBackToMenu={backToMenu}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Game Mode Selection */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Choisis ton mode de jeu
        </h1>
        {teamStats && (
          <p className="text-lg text-gray-600">
            Score total: {teamStats.total.score} points
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(gameModeLabels) as GameMode[]).map((mode) => (
          <div
            key={mode}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
            onClick={() => startGame(mode)}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {gameModeLabels[mode]}
            </h3>
            <p className="text-gray-600 mb-4">
              {gameModeDescriptions[mode]}
            </p>
            {teamStats && (
              <div className="text-sm text-blue-600">
                Score: {teamStats[mode].score} points ({teamStats[mode].games} parties)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 Classement</h2>
        {leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((team, index) => (
              <div
                key={team.teamName}
                className={`flex justify-between items-center p-3 rounded ${
                  index === 0 ? 'bg-yellow-100' : 
                  index === 1 ? 'bg-gray-100' : 
                  index === 2 ? 'bg-orange-100' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <span className="font-semibold">{team.teamName}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{team.total} pts</div>
                  <div className="text-sm text-gray-600">{team.gamesPlayed} parties</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Aucun score enregistré pour le moment</p>
        )}
      </div>
    </div>
  );
}

function GamePlay({ 
  teamId, 
  mode, 
  onGameEnd, 
  onBackToMenu 
}: { 
  teamId: Id<"teams">;
  mode: GameMode;
  onGameEnd: () => void;
  onBackToMenu: () => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);

  const getRandomQuestion = useQuery(api.games.getRandomQuestion, { mode, key: questionKey });
  const submitAnswer = useMutation(api.games.submitAnswer);

  const totalQuestions = 5;

  useEffect(() => {
    if (getRandomQuestion && questions.length <= currentQuestion) {
      setQuestions(prev => [...prev, getRandomQuestion]);
    }
  }, [getRandomQuestion, questions.length, currentQuestion]);

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    // Store the answer
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    const isCorrect = answer === questions[currentQuestion]?.answer;
    if (isCorrect) {
      setScore(prev => prev + 10);
      toast.success("Correct! +10 points 🎉");
    } else {
      toast.error(`Incorrect. La bonne réponse était: ${questions[currentQuestion]?.answer}`);
    }

    setTimeout(() => {
      if (currentQuestion + 1 >= totalQuestions) {
        finishGame();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentQuestion(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    // Trigger a new random question by changing the key
    setQuestionKey(prev => prev + 1);
  };

  const finishGame = async () => {
    let correctAnswers = 0;
    
    // Calculate correct answers from stored answers
    for (let i = 0; i < Math.min(answers.length, totalQuestions); i++) {
      if (questions[i] && answers[i] === questions[i].answer) {
        correctAnswers++;
      }
    }

    try {
      await submitAnswer({
        teamId,
        mode,
        isCorrect: correctAnswers > 0,
        score,
        totalQuestions,
        correctAnswers,
      });
      setGameFinished(true);
      onGameEnd();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du score");
    }
  };

  if (questions.length <= currentQuestion) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de la question...</p>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBackToMenu}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Retour au menu
          </button>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Question {currentQuestion + 1}/{totalQuestions}
            </div>
            <div className="font-bold text-lg">Score: {score}</div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {gameModeLabels[mode]}
          </h2>
          <p className="text-gray-600 mb-4">{gameModeDescriptions[mode]}</p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-xl font-semibold text-blue-800">
              {question.word}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option: string, index: number) => {
            let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all ";
            
            if (showResult) {
              if (option === question.answer) {
                buttonClass += "border-green-500 bg-green-100 text-green-800";
              } else if (option === selectedAnswer && option !== question.answer) {
                buttonClass += "border-red-500 bg-red-100 text-red-800";
              } else {
                buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
              }
            } else {
              buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult}
                className={buttonClass}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameResults({ 
  teamId, 
  mode, 
  onBackToMenu 
}: { 
  teamId: Id<"teams">;
  mode: GameMode;
  onBackToMenu: () => void;
}) {
  const teamStats = useQuery(api.games.getTeamStats, { teamId });

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Partie terminée! 🎉
        </h2>
        
        <div className="text-6xl mb-4">
          {teamStats && teamStats[mode].score >= 40 ? '🏆' : 
           teamStats && teamStats[mode].score >= 20 ? '🥈' : '🥉'}
        </div>

        {teamStats && (
          <div className="space-y-4 mb-8">
            <div className="text-2xl font-bold text-blue-600">
              Score {gameModeLabels[mode]}: {teamStats[mode].score} points
            </div>
            <div className="text-lg text-gray-600">
              Score total: {teamStats.total.score} points
            </div>
            <div className="text-sm text-gray-500">
              Parties jouées en {gameModeLabels[mode]}: {teamStats[mode].games}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onBackToMenu}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Retour au menu principal
          </button>
        </div>
      </div>
    </div>
  );
}
