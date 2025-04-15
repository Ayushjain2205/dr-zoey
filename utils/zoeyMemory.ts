import { ZoeyResponse } from "./zoeyAgent";

// Memory types
export interface HealthMetrics {
  weight?: number;
  height?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  sleepQuality?: number;
  stressLevel?: number;
  lastUpdated: Date;
}

export interface UserPreferences {
  name: string;
  age?: number;
  gender?: string;
  dietaryRestrictions?: string[];
  fitnessGoals?: string[];
  sleepSchedule?: {
    bedtime: string;
    wakeTime: string;
  };
  meditationPreferences?: {
    preferredDuration: number;
    preferredTypes: string[];
  };
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  lastUpdated: Date;
}

export interface ConversationTurn {
  mode: string;
  timestamp: Date;
  userMessage: string;
  agentResponse: ZoeyResponse;
  sentiment?: string;
  topics?: string[];
}

export interface ModeContext {
  lastInteraction: Date;
  frequentTopics: { topic: string; count: number }[];
  customPreferences: Record<string, any>;
  insights: string[];
}

export interface ZoeyMemory {
  userId: string;
  healthMetrics: HealthMetrics;
  userPreferences: UserPreferences;
  conversationHistory: ConversationTurn[];
  modeContexts: Record<string, ModeContext>;
  lastUpdated: Date;
}

class MemoryManager {
  private memories: Map<string, ZoeyMemory> = new Map();
  private static instance: MemoryManager;

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Initialize user memory
  initializeMemory(userId: string): void {
    if (!this.memories.has(userId)) {
      const newMemory: ZoeyMemory = {
        userId,
        healthMetrics: {
          lastUpdated: new Date(),
        },
        userPreferences: {
          name: "",
          lastUpdated: new Date(),
        },
        conversationHistory: [],
        modeContexts: {
          DOCTOR: {
            lastInteraction: new Date(),
            frequentTopics: [],
            customPreferences: {},
            insights: [],
          },
          NUTRITIONIST: {
            lastInteraction: new Date(),
            frequentTopics: [],
            customPreferences: {},
            insights: [],
          },
          TRAINER: {
            lastInteraction: new Date(),
            frequentTopics: [],
            customPreferences: {},
            insights: [],
          },
          SLEEP: {
            lastInteraction: new Date(),
            frequentTopics: [],
            customPreferences: {},
            insights: [],
          },
          MEDITATION: {
            lastInteraction: new Date(),
            frequentTopics: [],
            customPreferences: {},
            insights: [],
          },
        },
        lastUpdated: new Date(),
      };
      this.memories.set(userId, newMemory);
    }
  }

  // Store a conversation turn
  storeConversation(
    userId: string,
    mode: string,
    userMessage: string,
    agentResponse: ZoeyResponse
  ): void {
    const memory = this.memories.get(userId);
    if (!memory) return;

    const turn: ConversationTurn = {
      mode,
      timestamp: new Date(),
      userMessage,
      agentResponse,
    };

    memory.conversationHistory.push(turn);
    memory.modeContexts[mode].lastInteraction = new Date();
    memory.lastUpdated = new Date();

    // Update topic frequency
    const topics = this.extractTopics(userMessage);
    topics.forEach((topic) => {
      const existingTopic = memory.modeContexts[mode].frequentTopics.find(
        (t) => t.topic === topic
      );
      if (existingTopic) {
        existingTopic.count++;
      } else {
        memory.modeContexts[mode].frequentTopics.push({ topic, count: 1 });
      }
    });

    this.memories.set(userId, memory);
  }

  // Update health metrics
  updateHealthMetrics(userId: string, metrics: Partial<HealthMetrics>): void {
    const memory = this.memories.get(userId);
    if (!memory) return;

    memory.healthMetrics = {
      ...memory.healthMetrics,
      ...metrics,
      lastUpdated: new Date(),
    };
    memory.lastUpdated = new Date();

    this.memories.set(userId, memory);
  }

  // Update user preferences
  updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): void {
    const memory = this.memories.get(userId);
    if (!memory) return;

    memory.userPreferences = {
      ...memory.userPreferences,
      ...preferences,
      lastUpdated: new Date(),
    };
    memory.lastUpdated = new Date();

    this.memories.set(userId, memory);
  }

  // Add insight for a specific mode
  addInsight(userId: string, mode: string, insight: string): void {
    const memory = this.memories.get(userId);
    if (!memory) return;

    memory.modeContexts[mode].insights.push(insight);
    memory.lastUpdated = new Date();

    this.memories.set(userId, memory);
  }

  // Get recent conversations
  getRecentConversations(
    userId: string,
    limit: number = 10
  ): ConversationTurn[] {
    const memory = this.memories.get(userId);
    if (!memory) return [];

    return memory.conversationHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get mode-specific context
  getModeContext(userId: string, mode: string): ModeContext | null {
    const memory = this.memories.get(userId);
    if (!memory) return null;

    return memory.modeContexts[mode];
  }

  // Get user memory
  getUserMemory(userId: string): ZoeyMemory | null {
    return this.memories.get(userId) || null;
  }

  // Extract topics from message (simple implementation)
  private extractTopics(message: string): string[] {
    // This is a simple implementation. In a real system, you might want to use
    // NLP or a more sophisticated topic extraction method
    const keywords = [
      "medication",
      "exercise",
      "diet",
      "sleep",
      "stress",
      "meditation",
      "nutrition",
      "workout",
      "health",
      "wellness",
    ];

    return keywords.filter((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Persist memory to storage
  async persistMemory(userId: string): Promise<void> {
    const memory = this.memories.get(userId);
    if (!memory) return;

    try {
      // Here you would implement actual persistence logic
      // For example, saving to a database
      console.log(`Persisting memory for user ${userId}`);
      // await database.save('memories', userId, memory);
    } catch (error) {
      console.error("Error persisting memory:", error);
    }
  }

  // Load memory from storage
  async loadMemory(userId: string): Promise<void> {
    try {
      // Here you would implement actual loading logic
      // For example, loading from a database
      console.log(`Loading memory for user ${userId}`);
      // const memory = await database.load('memories', userId);
      // this.memories.set(userId, memory);
    } catch (error) {
      console.error("Error loading memory:", error);
      // Initialize new memory if loading fails
      this.initializeMemory(userId);
    }
  }
}

export const memoryManager = MemoryManager.getInstance();
