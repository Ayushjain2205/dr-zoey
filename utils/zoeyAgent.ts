import {
  GameAgent,
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

import {
  WorkoutTemplate,
  ProductCollection,
  DaySchedule,
  MedicationSchedule,
  NutritionLog,
  GuidedMeditation,
  SleepAnalysis,
} from "../types/zoeyTypes";

// Define response type for all functions
interface ZoeyResponse {
  text: string;
  medicationSchedule?: MedicationSchedule;
  nutritionLog?: NutritionLog;
  workoutTemplate?: WorkoutTemplate;
  sleepAnalysis?: SleepAnalysis;
  guidedMeditation?: GuidedMeditation;
}

// Doctor Mode Functions
const doctorFunctions = [
  new GameFunction({
    name: "check_medication",
    description: "Checks medication adherence and provides schedule",
    args: [
      {
        name: "message",
        type: "string",
        description: "User's message about medication",
      },
    ] as const,
    executable: async (args, logMessage) => {
      try {
        const medicationSchedule: MedicationSchedule = {
          medications: [
            {
              name: "Cetirizine",
              dosage: "10mg",
              time: "20:00",
              frequency: "Daily",
              withFood: true,
            },
            {
              name: "Vitamin D3",
              dosage: "2000 IU",
              time: "08:00",
              frequency: "Daily",
              withFood: true,
            },
          ],
        };

        const response: ZoeyResponse = {
          text: "Here's your updated medication schedule:",
          medicationSchedule,
        };

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(response)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ text: "Failed to process medication check" })
        );
      }
    },
  }),
];

// Nutritionist Mode Functions
const nutritionistFunctions = [
  new GameFunction({
    name: "analyze_nutrition",
    description: "Analyzes nutritional content and provides feedback",
    args: [
      {
        name: "meal_description",
        type: "string",
        description: "Description of meal or food item",
      },
    ] as const,
    executable: async (args, logMessage) => {
      try {
        const nutritionLog: NutritionLog = {
          mealType: "Snack",
          timestamp: new Date().toLocaleTimeString(),
          calories: 185,
          macros: {
            protein: 8,
            carbs: 22,
            fats: 6,
            fiber: 4,
          },
          micronutrients: [
            { name: "Vitamin A", amount: "120mcg" },
            { name: "Vitamin C", amount: "15mg" },
          ],
        };

        const response: ZoeyResponse = {
          text: "Here's the nutritional breakdown of your meal:",
          nutritionLog,
        };

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(response)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ text: "Failed to analyze nutrition" })
        );
      }
    },
  }),
];

// Trainer Mode Functions
const trainerFunctions = [
  new GameFunction({
    name: "create_workout",
    description: "Creates personalized workout plans",
    args: [
      {
        name: "preferences",
        type: "string",
        description: "User's workout preferences and goals",
      },
    ] as const,
    executable: async (args, logMessage) => {
      try {
        const workoutTemplate: WorkoutTemplate = {
          title: "Lower Body Power",
          description:
            "A comprehensive leg workout targeting all major muscle groups",
          exercises: [
            {
              name: "Squats",
              sets: 4,
              reps: "12",
              rest: "60 sec",
              icon: "chevrons-down",
            },
            {
              name: "Romanian Deadlifts",
              sets: 3,
              reps: "12",
              rest: "60 sec",
              icon: "arrow-up",
            },
          ],
          tips: ["Keep proper form", "Stay hydrated", "Rest between sets"],
        };

        const response: ZoeyResponse = {
          text: "I've created a workout plan for you:",
          workoutTemplate,
        };

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(response)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ text: "Failed to create workout plan" })
        );
      }
    },
  }),
];

// Sleep Mode Functions
const sleepFunctions = [
  new GameFunction({
    name: "analyze_sleep",
    description: "Analyzes sleep patterns and provides recommendations",
    args: [
      {
        name: "sleep_data",
        type: "string",
        description: "User's sleep data or concerns",
      },
    ] as const,
    executable: async (args, logMessage) => {
      try {
        const sleepAnalysis: SleepAnalysis = {
          date: new Date().toLocaleDateString(),
          totalSleep: {
            hours: 7,
            minutes: 30,
          },
          sleepStages: {
            awake: [0, 0.2, 0.1],
            rem: [0.3, 0.4, 0.3],
            core: [0.5, 0.6, 0.5],
            deep: [0.7, 0.8, 0.7],
          },
          timeMarkers: ["10 PM", "2 AM", "6 AM"],
          sleepScore: 85,
          insights: [
            {
              title: "Sleep Quality",
              value: "Good deep sleep achieved",
              icon: "moon",
            },
          ],
        };

        const response: ZoeyResponse = {
          text: "Here's your sleep analysis:",
          sleepAnalysis,
        };

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(response)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ text: "Failed to analyze sleep data" })
        );
      }
    },
  }),
];

// Meditation Mode Functions
const meditationFunctions = [
  new GameFunction({
    name: "start_meditation",
    description: "Starts a guided meditation session",
    args: [
      {
        name: "preferences",
        type: "string",
        description: "User's meditation preferences",
      },
    ] as const,
    executable: async (args, logMessage) => {
      try {
        const guidedMeditation: GuidedMeditation = {
          duration: 600,
          currentTime: 0,
          title: "Mindful Relaxation",
          phase: "breathing",
          isPlaying: true,
        };

        const response: ZoeyResponse = {
          text: "Starting your guided meditation session:",
          guidedMeditation,
        };

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(response)
        );
      } catch (e) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({ text: "Failed to start meditation" })
        );
      }
    },
  }),
];

// Create workers for each mode
const doctorWorker = new GameWorker({
  id: "zoey_doctor_worker",
  name: "Zoey Doctor Mode",
  description:
    "A medical professional focused on health monitoring and medication management",
  functions: doctorFunctions,
  getEnvironment: async () => ({
    currentTime: new Date().toISOString(),
    platform: "mobile",
    mode: "doctor",
  }),
});

const nutritionistWorker = new GameWorker({
  id: "zoey_nutritionist_worker",
  name: "Zoey Nutritionist Mode",
  description: "A nutrition expert providing dietary advice and meal analysis",
  functions: nutritionistFunctions,
  getEnvironment: async () => ({
    currentTime: new Date().toISOString(),
    platform: "mobile",
    mode: "nutritionist",
  }),
});

const trainerWorker = new GameWorker({
  id: "zoey_trainer_worker",
  name: "Zoey Trainer Mode",
  description: "A fitness trainer creating personalized workout plans",
  functions: trainerFunctions,
  getEnvironment: async () => ({
    currentTime: new Date().toISOString(),
    platform: "mobile",
    mode: "trainer",
  }),
});

const sleepWorker = new GameWorker({
  id: "zoey_sleep_worker",
  name: "Zoey Sleep Mode",
  description:
    "A sleep specialist analyzing sleep patterns and providing recommendations",
  functions: sleepFunctions,
  getEnvironment: async () => ({
    currentTime: new Date().toISOString(),
    platform: "mobile",
    mode: "sleep",
  }),
});

const meditationWorker = new GameWorker({
  id: "zoey_meditation_worker",
  name: "Zoey Meditation Mode",
  description: "A meditation guide providing mindfulness sessions",
  functions: meditationFunctions,
  getEnvironment: async () => ({
    currentTime: new Date().toISOString(),
    platform: "mobile",
    mode: "meditation",
  }),
});

// Initialize Zoey agent with all modes
const initializeZoey = (apiKey: string) => {
  return new GameAgent(apiKey, {
    name: "Zoey",
    goal: "To assist users with health, fitness, nutrition, sleep, and mindfulness while maintaining appropriate expertise for each context",
    description:
      "Zoey is a versatile AI health assistant that can switch between different specialist modes to best serve user needs",
    getAgentState: async () => ({
      status: "active",
      mood: "professional",
      knowledgeBase: [
        "medical expertise",
        "nutrition science",
        "fitness training",
        "sleep science",
        "meditation techniques",
      ],
    }),
    workers: [
      doctorWorker,
      nutritionistWorker,
      trainerWorker,
      sleepWorker,
      meditationWorker,
    ],
  });
};

const logMessage = (msg: string) => console.log(msg);

export async function handleZoeyChat(
  mode: string,
  message: string,
  apiKey: string
) {
  try {
    const zoey = initializeZoey(apiKey);
    await zoey.init();

    // Select the appropriate worker based on mode
    const getWorker = (mode: string) => {
      switch (mode) {
        case "DOCTOR":
          return doctorWorker;
        case "NUTRITIONIST":
          return nutritionistWorker;
        case "TRAINER":
          return trainerWorker;
        case "SLEEP":
          return sleepWorker;
        case "MEDITATION":
          return meditationWorker;
        default:
          throw new Error("Invalid mode");
      }
    };

    const worker = getWorker(mode);
    let response;

    switch (mode) {
      case "DOCTOR":
        response = await worker.functions
          .find((f) => f.name === "check_medication")
          ?.executable({ message }, logMessage);
        break;
      case "NUTRITIONIST":
        response = await worker.functions
          .find((f) => f.name === "analyze_nutrition")
          ?.executable({ meal_description: message }, logMessage);
        break;
      case "TRAINER":
        response = await worker.functions
          .find((f) => f.name === "create_workout")
          ?.executable({ preferences: message }, logMessage);
        break;
      case "SLEEP":
        response = await worker.functions
          .find((f) => f.name === "analyze_sleep")
          ?.executable({ sleep_data: message }, logMessage);
        break;
      case "MEDITATION":
        response = await worker.functions
          .find((f) => f.name === "start_meditation")
          ?.executable({ preferences: message }, logMessage);
        break;
      default:
        throw new Error("Invalid mode");
    }

    if (!response) {
      throw new Error("Function not found for the specified mode");
    }

    return response.feedback;
  } catch (error) {
    console.error("Error in handleZoeyChat:", error);
    throw error;
  }
}

export type {
  WorkoutTemplate,
  ProductCollection,
  DaySchedule,
  MedicationSchedule,
  NutritionLog,
  GuidedMeditation,
  SleepAnalysis,
  ZoeyResponse,
};
