import {
  GameAgent,
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

import { handleZoeyChat, ZoeyResponse } from "./zoeyAgent";
import {
  memoryManager,
  ZoeyMemory,
  HealthMetrics,
  UserPreferences,
} from "./zoeyMemory";

type ExecutableArgs<T extends { name: string }[]> = {
  [K in T[number]["name"]]: string;
};

// Master agent functions for high-level coordination
const masterFunctions = [
  new GameFunction({
    name: "analyze_user_state",
    description: "Analyzes user's current state and needs across all domains",
    args: [
      {
        name: "userId",
        type: "string",
        description: "User's unique identifier",
      },
    ] as const,
    executable: async (
      args: Partial<
        ExecutableArgs<
          [
            {
              readonly name: "userId";
              readonly type: "string";
              readonly description: "User's unique identifier";
            }
          ]
        >
      >,
      logMessage
    ) => {
      try {
        if (!args.userId) {
          throw new Error("userId is required");
        }
        const memory = memoryManager.getUserMemory(args.userId);
        if (!memory) throw new Error("User memory not found");

        const analysis = analyzeUserState(memory);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(analysis)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ error: "Failed to analyze user state" })
        );
      }
    },
  }),
  new GameFunction({
    name: "recommend_mode_switch",
    description:
      "Recommends whether to switch to a different mode based on context",
    args: [
      {
        name: "userId",
        type: "string",
        description: "User's unique identifier",
      },
      {
        name: "currentMode",
        type: "string",
        description: "Current mode of interaction",
      },
      {
        name: "message",
        type: "string",
        description: "User's message",
      },
    ] as const,
    executable: async (
      args: Partial<
        ExecutableArgs<
          [
            {
              readonly name: "userId";
              readonly type: "string";
              readonly description: "User's unique identifier";
            },
            {
              readonly name: "currentMode";
              readonly type: "string";
              readonly description: "Current mode of interaction";
            },
            {
              readonly name: "message";
              readonly type: "string";
              readonly description: "User message";
            }
          ]
        >
      >,
      logMessage
    ) => {
      try {
        if (!args.userId || !args.currentMode || !args.message) {
          throw new Error("userId, currentMode, and message are required");
        }
        const recommendation = analyzeModeSwitch(
          args.userId,
          args.currentMode,
          args.message
        );
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(recommendation)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ error: "Failed to analyze mode switch" })
        );
      }
    },
  }),
  new GameFunction({
    name: "generate_insights",
    description: "Generates cross-domain insights from user interactions",
    args: [
      {
        name: "userId",
        type: "string",
        description: "User's unique identifier",
      },
    ] as const,
    executable: async (
      args: Partial<
        ExecutableArgs<
          [
            {
              readonly name: "userId";
              readonly type: "string";
              readonly description: "User's unique identifier";
            }
          ]
        >
      >,
      logMessage
    ) => {
      try {
        if (!args.userId) {
          throw new Error("userId is required");
        }
        const insights = generateCrossDomainInsights(args.userId);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(insights)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ error: "Failed to generate insights" })
        );
      }
    },
  }),
];

// Master worker for high-level coordination
const masterWorker = new GameWorker({
  id: "zoey_master_worker",
  name: "Zoey Master Coordinator",
  description:
    "Coordinates between different modes and maintains overall context",
  functions: masterFunctions,
  getEnvironment: async () => ({
    currentTime: new Date().toISOString(),
    platform: "mobile",
    mode: "master",
  }),
});

// Initialize master agent
const initializeMasterAgent = (apiKey: string) => {
  return new GameAgent(apiKey, {
    name: "Zoey Master",
    goal: "To provide coordinated, context-aware assistance across all health and wellness domains",
    description: "Master coordinator for Zoey's specialized modes",
    getAgentState: async () => ({
      status: "active",
      mood: "analytical",
      knowledgeBase: [
        "cross-domain coordination",
        "context awareness",
        "user state analysis",
        "mode switching logic",
        "insight generation",
      ],
    }),
    workers: [masterWorker],
  });
};

// Helper function to analyze user state
function analyzeUserState(memory: ZoeyMemory) {
  if (!memory.userId) throw new Error("User ID is required");
  const recentConversations = memory.conversationHistory.slice(-10);
  const modeFrequency = recentConversations.reduce((acc, conv) => {
    acc[conv.mode] = (acc[conv.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantTopics = Object.entries(memory.modeContexts).reduce(
    (acc, [mode, context]) => {
      const topTopics = context.frequentTopics
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      acc[mode] = topTopics;
      return acc;
    },
    {} as Record<string, { topic: string; count: number }[]>
  );

  return {
    modeUsagePattern: modeFrequency,
    dominantTopics,
    lastInteractions: Object.entries(memory.modeContexts).reduce(
      (acc, [mode, context]) => {
        acc[mode] = context.lastInteraction;
        return acc;
      },
      {} as Record<string, Date>
    ),
    healthStatus: memory.healthMetrics,
    preferences: memory.userPreferences,
  };
}

// Helper function to analyze mode switching
function analyzeModeSwitch(
  userId: string,
  currentMode: string,
  message: string
) {
  if (!userId || !currentMode || !message) {
    throw new Error("Missing required parameters");
  }
  const memory = memoryManager.getUserMemory(userId);
  if (!memory) return { shouldSwitch: false };

  const keywords: Record<string, string[]> = {
    DOCTOR: ["medicine", "symptoms", "pain", "medication", "doctor"],
    NUTRITIONIST: ["food", "diet", "nutrition", "eating", "meal"],
    TRAINER: ["exercise", "workout", "fitness", "training", "muscles"],
    SLEEP: ["sleep", "tired", "rest", "insomnia", "nap"],
    MEDITATION: ["stress", "anxiety", "meditation", "relax", "calm"],
  };

  const messageLower = message.toLowerCase();
  let bestMatch = {
    mode: currentMode,
    count: 0,
  };

  Object.entries(keywords).forEach(([mode, words]) => {
    const matchCount = words.filter((word) =>
      messageLower.includes(word)
    ).length;
    if (matchCount > bestMatch.count) {
      bestMatch = { mode, count: matchCount };
    }
  });

  return {
    shouldSwitch: bestMatch.mode !== currentMode && bestMatch.count > 0,
    recommendedMode: bestMatch.mode,
    confidence: bestMatch.count / 5, // Normalize confidence
  };
}

// Helper function to generate cross-domain insights
function generateCrossDomainInsights(userId: string) {
  if (!userId) throw new Error("User ID is required");
  const memory = memoryManager.getUserMemory(userId);
  if (!memory) return { insights: [] };

  const insights: string[] = [];

  // Analyze sleep and exercise correlation
  const sleepContext = memory.modeContexts.SLEEP;
  const trainerContext = memory.modeContexts.TRAINER;
  if (sleepContext && trainerContext) {
    insights.push(
      "Regular exercise patterns appear to correlate with improved sleep quality"
    );
  }

  // Analyze nutrition and meditation correlation
  const nutritionContext = memory.modeContexts.NUTRITIONIST;
  const meditationContext = memory.modeContexts.MEDITATION;
  if (nutritionContext && meditationContext) {
    insights.push(
      "Mindful eating practices combined with meditation show positive effects"
    );
  }

  // Analyze overall health patterns
  const healthMetrics = memory.healthMetrics;
  if (healthMetrics.stressLevel && healthMetrics.sleepQuality) {
    insights.push(
      `Stress levels appear to have a ${
        healthMetrics.stressLevel > 5 ? "negative" : "positive"
      } impact on sleep quality`
    );
  }

  return { insights };
}

// Main interface for the master agent
export async function handleMasterAgent(
  userId: string,
  mode: string,
  message: string,
  apiKey: string
) {
  try {
    // Initialize memory if not exists
    memoryManager.initializeMemory(userId);

    // Analyze if mode switch is needed
    const masterAgent = initializeMasterAgent(apiKey);
    await masterAgent.init();

    const modeSwitchResponse = await masterWorker.functions
      .find((f) => f.name === "recommend_mode_switch")
      ?.executable({ userId, currentMode: mode, message }, console.log);

    if (!modeSwitchResponse) throw new Error("Failed to analyze mode switch");

    const switchAnalysis = JSON.parse(modeSwitchResponse.feedback);

    // If mode switch is recommended, handle it
    const effectiveMode = switchAnalysis.shouldSwitch
      ? switchAnalysis.recommendedMode
      : mode;

    // Get response from appropriate specialized agent
    const response = await handleZoeyChat(effectiveMode, message, apiKey);

    // Store conversation in memory
    const parsedResponse = JSON.parse(response) as ZoeyResponse;
    memoryManager.storeConversation(
      userId,
      effectiveMode,
      message,
      parsedResponse
    );

    // Generate insights
    const insightsResponse = await masterWorker.functions
      .find((f) => f.name === "generate_insights")
      ?.executable({ userId }, console.log);

    if (insightsResponse) {
      const { insights } = JSON.parse(insightsResponse.feedback);
      insights.forEach((insight: string) => {
        memoryManager.addInsight(userId, effectiveMode, insight);
      });
    }

    // Persist memory
    await memoryManager.persistMemory(userId);

    // Return enhanced response
    return {
      ...parsedResponse,
      modeSwitched: switchAnalysis.shouldSwitch,
      recommendedMode: switchAnalysis.recommendedMode,
      insights: insightsResponse
        ? JSON.parse(insightsResponse.feedback).insights
        : [],
    };
  } catch (error) {
    console.error("Error in master agent:", error);
    throw error;
  }
}

export type { ZoeyMemory, HealthMetrics, UserPreferences };
