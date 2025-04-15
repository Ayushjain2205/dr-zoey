import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Easing,
  ActionSheetIOS,
  GestureResponderEvent,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme, CHAT_MODES } from "../../context/ThemeContext";
import { sendMessage, Message as OpenAIMessage } from "../../utils/openai";
import Markdown from "react-native-markdown-display";
import {
  WorkoutCard,
  StreakTracker,
  legWorkout,
  handleCoachMessage,
  WorkoutTemplate,
  Exercise,
} from "../coach/CoachTemplates";
import {
  ProductGrid,
  handleShopperMessage,
  ProductCollection,
} from "../shopper/ShopperTemplates";
import {
  CalendarView,
  handleManagerMessage,
  DaySchedule,
} from "../manager/ManagerTemplates";
import * as ImagePicker from "expo-image-picker";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledTextInput = styled(TextInput);
const StyledScrollView = styled(ScrollView);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledImage = styled(Image);

type ChatMode =
  | "DOCTOR"
  | "NUTRITIONIST"
  | "THERAPIST"
  | "TRAINER"
  | "SLEEP"
  | "MEDITATION";

interface ThemeColors {
  main: string;
  light: string;
  lighter: string;
}

interface Activity {
  time: string;
  activity: string;
  duration: number;
}

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  time: string;
  duration: number;
  isOnline: boolean;
  participants: string[];
}

interface MedicationSchedule {
  medications: {
    name: string;
    dosage: string;
    time: string;
    frequency: string;
    withFood: boolean;
  }[];
}

interface NutritionLog {
  mealType: string;
  timestamp: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  micronutrients: {
    name: string;
    amount: string;
  }[];
}

interface GuidedMeditation {
  duration: number;
  currentTime: number;
  title: string;
  phase: "intro" | "breathing" | "body" | "mind" | "closing";
  isPlaying: boolean;
}

interface SleepAnalysis {
  date: string;
  totalSleep: {
    hours: number;
    minutes: number;
  };
  sleepStages: {
    awake: number[];
    rem: number[];
    core: number[];
    deep: number[];
  };
  timeMarkers: string[];
  sleepScore: number;
  insights: {
    title: string;
    value: string;
    icon: FeatherIconName;
  }[];
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  workoutTemplate?: WorkoutTemplate;
  productCollection?: ProductCollection;
  daySchedule?: DaySchedule;
  medicationSchedule?: MedicationSchedule;
  nutritionLog?: NutritionLog;
  guidedMeditation?: GuidedMeditation;
  sleepAnalysis?: SleepAnalysis;
  image?: string;
}

interface SimulatedResponse {
  text: string;
  delay?: number;
  workoutTemplate?: WorkoutTemplate;
  productCollection?: ProductCollection;
  daySchedule?: DaySchedule;
  medicationSchedule?: MedicationSchedule;
  nutritionLog?: NutritionLog;
  guidedMeditation?: GuidedMeditation;
  sleepAnalysis?: SleepAnalysis;
}

interface SimulatedFlow {
  responses: SimulatedResponse[];
}

const modeColors: Record<string, ThemeColors> = {
  DOCTOR: {
    main: "#BAE1FF",
    light: "#E5F4FF",
    lighter: "#F5FAFF",
  },
  NUTRITIONIST: {
    main: "#BAFFC9",
    light: "#E5FFE9",
    lighter: "#F5FFF7",
  },
  THERAPIST: {
    main: "#E0B3FF",
    light: "#F0E5FF",
    lighter: "#F8F5FF",
  },
  TRAINER: {
    main: "#FFB3BA",
    light: "#FFE5E8",
    lighter: "#FFF5F7",
  },
  SLEEP: {
    main: "#7EE8E8",
    light: "#E5FDFD",
    lighter: "#F5FEFE",
  },
  MEDITATION: {
    main: "#FFE4B3",
    light: "#FFF4E5",
    lighter: "#FFF9F5",
  },
};

const modeIntroMessages: Record<ChatMode, string> = {
  DOCTOR:
    "You were supposed to take Cetirizine at 8pm post dinner did you take it? 👨‍⚕️",
  NUTRITIONIST:
    "Welcome! I'm here to help you make healthy food choices. What would you like to know about your nutrition today? 🥗",
  THERAPIST:
    "Hi! This is a safe space to share your thoughts and feelings. How are you feeling today? 💭",
  TRAINER:
    "Ready to crush your fitness goals! What type of workout would you like to do today? 💪",
  SLEEP:
    "Let's work on improving your sleep quality. How can I help you get better rest? 😴",
  MEDITATION:
    "Welcome to your mindfulness session. How would you like to center yourself today? 🧘‍♀️",
};

// Conversation step counter for each mode
const conversationSteps: Record<ChatMode, number> = {
  DOCTOR: 0,
  NUTRITIONIST: 0,
  THERAPIST: 0,
  TRAINER: 0,
  SLEEP: 0,
  MEDITATION: 0,
};

const mockFlows: Record<ChatMode, SimulatedFlow> = {
  DOCTOR: {
    responses: [
      {
        text: "How are your symptoms today?",
        delay: 1000,
      },
      {
        text: "That's great to hear! The medication seems to be working. Any side effects like drowsiness?",
        delay: 1500,
      },
      {
        text: "Perfect! Let's continue with the current dosage. Remember to take it at the same time tomorrow. Would you like me to set a reminder for you?",
        delay: 2000,
      },
      {
        text: "Here's your updated medication schedule:",
        delay: 2000,
        medicationSchedule: {
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
            {
              name: "Omega-3",
              dosage: "1000mg",
              time: "13:00",
              frequency: "Daily",
              withFood: true,
            },
          ],
        },
      },
    ],
  },
  NUTRITIONIST: {
    responses: [
      {
        text: "That looks like a healthy and balanced snack choice! Let me analyze the nutritional content for you.",
        delay: 1000,
      },
      {
        text: "Here's the nutritional breakdown of your snack:",
        delay: 1500,
        nutritionLog: {
          mealType: "Afternoon Snack",
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
            { name: "Calcium", amount: "80mg" },
            { name: "Iron", amount: "1.2mg" },
            { name: "Potassium", amount: "250mg" },
          ],
        },
      },
      {
        text: "This is a great choice for a snack! The combination of protein and fiber will help keep you satisfied. Would you like some suggestions for your next meal?",
        delay: 2000,
      },
    ],
  },
  TRAINER: {
    responses: [
      {
        text: "I've got the perfect leg workout for you! This will target all major muscle groups in your legs:",
        delay: 1000,
      },
      {
        text: "WORKOUT_TEMPLATE",
        workoutTemplate: {
          title: "Lower Body Power",
          description:
            "A comprehensive leg workout targeting all major muscle groups",
          exercises: [
            {
              name: "Squats",
              sets: 4,
              reps: "12",
              rest: "60 sec",
              icon: "chevrons-down" as const,
            },
            {
              name: "Romanian Deadlifts",
              sets: 3,
              reps: "12",
              rest: "60 sec",
              icon: "arrow-up" as const,
            },
            {
              name: "Walking Lunges",
              sets: 3,
              reps: "20",
              rest: "45 sec",
              icon: "chevrons-right" as const,
            },
          ],
          tips: ["Keep proper form", "Stay hydrated", "Rest between sets"],
        },
        delay: 1500,
      },
      {
        text: "How does this workout look? We can adjust the intensity if needed.",
        delay: 2000,
      },
    ],
  },
  SLEEP: {
    responses: [
      {
        text: "I'll analyze your sleep data from yesterday. Here's what I found:",
        delay: 1000,
      },
      {
        text: "Here's your detailed sleep analysis:",
        delay: 1500,
        sleepAnalysis: {
          date: "14 Apr 2025",
          totalSleep: {
            hours: 4,
            minutes: 35,
          },
          sleepStages: {
            awake: [0, 0, 0, 0.8, 0, 0, 0, 0.6, 0.9, 0.7, 0.3],
            rem: [0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0],
            core: [0.6, 0.8, 0.9, 0, 0, 0, 0, 0, 0, 0, 0],
            deep: [0, 0.7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          },
          timeMarkers: ["8 AM", "10 AM", "12 PM", "2 PM"],
          sleepScore: 65,
          insights: [
            {
              title: "Sleep Continuity",
              value: "Multiple interruptions detected during your sleep",
              icon: "activity",
            },
            {
              title: "Deep Sleep",
              value: "Only 45 minutes of deep sleep recorded",
              icon: "moon",
            },
            {
              title: "Sleep Schedule",
              value: "Irregular sleep pattern detected",
              icon: "clock",
            },
          ],
        },
      },
      {
        text:
          "Based on your sleep patterns, here are some recommendations to improve your sleep quality:\n\n" +
          "1. 🌙 Try to maintain a consistent sleep schedule\n" +
          "2. 📱 Avoid screen time 1 hour before bed\n" +
          "3. 🏃‍♂️ Consider light exercise in the morning\n" +
          "4. 🌡️ Keep your bedroom cool (around 65-68°F)\n" +
          "5. ⏰ Aim to get to bed by 10:30 PM for optimal rest\n\n" +
          "Would you like me to set up a bedtime reminder for you?",
        delay: 2000,
      },
    ],
  },
  MEDITATION: {
    responses: [
      {
        text: "I'll guide you through a calming meditation session. Find a comfortable position and let's begin when you're ready.",
        delay: 1000,
      },
      {
        text: "Starting your guided meditation session:",
        delay: 1500,
        guidedMeditation: {
          duration: 600, // 10 minutes in seconds
          currentTime: 30,
          title: "Mindful Relaxation",
          phase: "breathing",
          isPlaying: true,
        },
      },
      {
        text: "How do you feel? Would you like to try another meditation or perhaps a different mindfulness exercise?",
        delay: 2000,
      },
    ],
  },
  THERAPIST: {
    responses: [
      {
        text: "I understand presentations can be nerve-wracking. Let's break this down - what specific aspects of the presentation are making you feel anxious?",
        delay: 1500,
      },
      {
        text: "That's a common concern. Have you prepared any strategies to help you remember your key points? We could work on some memory techniques and confidence-building exercises together.",
        delay: 2000,
      },
      {
        text: "Here's a quick grounding exercise we can try: Take 3 deep breaths, and on each exhale, remind yourself of one thing you know really well about your presentation topic.",
        delay: 3000,
      },
    ],
  },
};

interface ChatModeConfig {
  name: ChatMode;
  image: any;
  color: string;
}

const modeConfig: Record<string, ChatModeConfig> = {
  DOCTOR: {
    name: "DOCTOR",
    image: require("../../assets/images/zoey/zoey_doctor.png"),
    color: modeColors.DOCTOR.main,
  },
  NUTRITIONIST: {
    name: "NUTRITIONIST",
    image: require("../../assets/images/zoey/zoey_nutritionist.png"),
    color: modeColors.NUTRITIONIST.main,
  },
  THERAPIST: {
    name: "THERAPIST",
    image: require("../../assets/images/zoey/zoey_therapist.png"),
    color: modeColors.THERAPIST.main,
  },
  TRAINER: {
    name: "TRAINER",
    image: require("../../assets/images/zoey/zoey_trainer.png"),
    color: modeColors.TRAINER.main,
  },
  SLEEP: {
    name: "SLEEP",
    image: require("../../assets/images/zoey/zoey_sleep.png"),
    color: modeColors.SLEEP.main,
  },
  MEDITATION: {
    name: "MEDITATION",
    image: require("../../assets/images/zoey/zoey_meditation.png"),
    color: modeColors.MEDITATION.main,
  },
};

// Add type for Feather icon names
type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const MedicationScheduleCard: React.FC<{
  schedule: MedicationSchedule;
  currentTheme: ThemeColors;
}> = ({ schedule, currentTheme }) => (
  <StyledView className="bg-white border-2 border-black rounded-xl overflow-hidden">
    <StyledView
      className="px-3 py-2 border-b-2 border-black"
      style={{ backgroundColor: currentTheme.main }}
    >
      <StyledText className="font-space text-base font-bold">
        💊 Medication Schedule
      </StyledText>
    </StyledView>

    <StyledView className="p-4">
      {schedule.medications.map((med, index) => (
        <StyledView
          key={index}
          className="flex-row items-center py-3 border-b border-gray-200 last:border-b-0"
        >
          <StyledView className="w-24">
            <StyledText className="font-space text-sm font-bold">
              {med.time}
            </StyledText>
          </StyledView>

          <StyledView className="flex-1">
            <StyledText className="font-space font-bold">{med.name}</StyledText>
            <StyledText className="font-space text-sm text-gray-600">
              {med.dosage} • {med.frequency}
            </StyledText>
            {med.withFood && (
              <StyledView className="flex-row items-center mt-1">
                <Feather
                  name="coffee"
                  size={12}
                  color="#666"
                  style={{ marginRight: 4 }}
                />
                <StyledText className="font-space text-xs text-gray-500">
                  Take with food
                </StyledText>
              </StyledView>
            )}
          </StyledView>
        </StyledView>
      ))}
    </StyledView>
  </StyledView>
);

const NutritionLogCard: React.FC<{
  log: NutritionLog;
  currentTheme: ThemeColors;
}> = ({ log, currentTheme }) => (
  <StyledView className="bg-white border-2 border-black rounded-xl overflow-hidden">
    <StyledView
      className="px-3 py-2 border-b-2 border-black"
      style={{ backgroundColor: currentTheme.main }}
    >
      <StyledText className="font-space text-base font-bold">
        🍎 Nutrition Log - {log.mealType}
      </StyledText>
    </StyledView>

    <StyledView className="p-4">
      {/* Calories */}
      <StyledView className="mb-4">
        <StyledText className="font-space text-2xl font-bold">
          {log.calories} kcal
        </StyledText>
        <StyledText className="font-space text-sm text-gray-600">
          {log.timestamp}
        </StyledText>
      </StyledView>

      {/* Macros */}
      <StyledView className="flex-row justify-between mb-4">
        <StyledView className="items-center">
          <StyledText className="font-space text-sm text-gray-600">
            Protein
          </StyledText>
          <StyledText className="font-space font-bold">
            {log.macros.protein}g
          </StyledText>
        </StyledView>
        <StyledView className="items-center">
          <StyledText className="font-space text-sm text-gray-600">
            Carbs
          </StyledText>
          <StyledText className="font-space font-bold">
            {log.macros.carbs}g
          </StyledText>
        </StyledView>
        <StyledView className="items-center">
          <StyledText className="font-space text-sm text-gray-600">
            Fats
          </StyledText>
          <StyledText className="font-space font-bold">
            {log.macros.fats}g
          </StyledText>
        </StyledView>
        <StyledView className="items-center">
          <StyledText className="font-space text-sm text-gray-600">
            Fiber
          </StyledText>
          <StyledText className="font-space font-bold">
            {log.macros.fiber}g
          </StyledText>
        </StyledView>
      </StyledView>

      {/* Micronutrients */}
      <StyledView>
        <StyledText className="font-space font-bold mb-2">
          Micronutrients
        </StyledText>
        <StyledView className="flex-row flex-wrap">
          {log.micronutrients.map((micro, index) => (
            <StyledView
              key={index}
              className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2"
            >
              <StyledText className="font-space text-xs">
                {micro.name}: {micro.amount}
              </StyledText>
            </StyledView>
          ))}
        </StyledView>
      </StyledView>
    </StyledView>
  </StyledView>
);

const GuidedMeditationCard: React.FC<{
  meditation: GuidedMeditation;
  currentTheme: ThemeColors;
}> = ({ meditation: initialMeditation, currentTheme }) => {
  const [meditation, setMeditation] = useState({
    ...initialMeditation,
    currentTime: 0,
    isPlaying: false,
  });
  const [wavePoints, setWavePoints] = useState(
    Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2)
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<View>(null);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Handle play/pause
  const togglePlayPause = () => {
    setMeditation((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // Handle seek
  const handleSeek = (event: GestureResponderEvent) => {
    if (!progressBarRef.current) return;

    progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
      const touchX = event.nativeEvent.pageX - pageX;
      const percentage = Math.max(0, Math.min(1, touchX / width));
      const newTime = Math.round(percentage * meditation.duration);
      setMeditation((prev) => ({ ...prev, currentTime: newTime }));
    });
  };

  // Timer effect
  useEffect(() => {
    if (meditation.isPlaying && meditation.currentTime < meditation.duration) {
      timerRef.current = setInterval(() => {
        setMeditation((prev) => {
          const newTime = prev.currentTime + 1;
          if (newTime >= prev.duration) {
            clearInterval(timerRef.current!);
            return { ...prev, currentTime: prev.duration, isPlaying: false };
          }
          return { ...prev, currentTime: newTime };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [meditation.isPlaying]);

  // Wave animation effect
  useEffect(() => {
    if (meditation.isPlaying) {
      waveAnimationRef.current = setInterval(() => {
        setWavePoints(
          Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2)
        );
      }, 200);
    }

    return () => {
      if (waveAnimationRef.current) {
        clearInterval(waveAnimationRef.current);
      }
    };
  }, [meditation.isPlaying]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <StyledView className="bg-white border-2 border-black rounded-xl overflow-hidden">
      <StyledView
        className="px-3 py-2 border-b-2 border-black"
        style={{ backgroundColor: currentTheme.main }}
      >
        <StyledText className="font-space text-base font-bold">
          🧘‍♀️ Guided Meditation
        </StyledText>
      </StyledView>

      <StyledView className="p-4">
        {/* Title and Phase */}
        <StyledView className="items-center mb-6">
          <StyledText className="font-space text-2xl font-bold mb-2">
            {meditation.title}
          </StyledText>
          <StyledText className="font-space text-sm text-gray-600 capitalize">
            {meditation.phase} Phase
          </StyledText>
        </StyledView>

        {/* Audio Wave Visualization */}
        <StyledView className="h-24 flex-row items-center justify-center space-x-1 mb-6">
          {wavePoints.map((height, index) => (
            <Animated.View
              key={index}
              style={{
                width: 4,
                height: `${height * 100}%`,
                backgroundColor: meditation.isPlaying
                  ? currentTheme.main
                  : "#E5E5E5",
                opacity: meditation.isPlaying ? 1 : 0.5,
                borderRadius: 2,
              }}
            />
          ))}
        </StyledView>

        {/* Progress Bar */}
        <StyledPressable
          onLayout={(event) =>
            setProgressBarWidth(event.nativeEvent.layout.width)
          }
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleSeek}
          onResponderMove={handleSeek}
          className="mb-4"
        >
          <StyledView
            ref={progressBarRef}
            className="h-2 bg-gray-200 rounded-full overflow-hidden"
          >
            <StyledView
              className="h-full rounded-full"
              style={{
                width: `${
                  (meditation.currentTime / meditation.duration) * 100
                }%`,
                backgroundColor: currentTheme.main,
              }}
            />
          </StyledView>
        </StyledPressable>

        {/* Time */}
        <StyledView className="flex-row justify-between mb-6">
          <StyledText className="font-space text-sm text-gray-600">
            {formatTime(meditation.currentTime)}
          </StyledText>
          <StyledText className="font-space text-sm text-gray-600">
            {formatTime(meditation.duration)}
          </StyledText>
        </StyledView>

        {/* Controls */}
        <StyledPressable
          onPress={togglePlayPause}
          className="flex-row justify-center space-x-4"
        >
          <StyledView
            className="w-12 h-12 rounded-full border-2 border-black items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            style={{ backgroundColor: currentTheme.main }}
          >
            <Feather
              name={meditation.isPlaying ? "pause" : "play"}
              size={24}
              color="black"
            />
          </StyledView>
        </StyledPressable>
      </StyledView>
    </StyledView>
  );
};

const SleepAnalysisCard: React.FC<{
  analysis: SleepAnalysis;
  currentTheme: ThemeColors;
}> = ({ analysis, currentTheme }) => {
  const graphHeight = 200;
  const graphWidth = 300;

  const renderSleepStage = (data: number[], color: string, yOffset: number) => {
    return data.map((height, index) => (
      <StyledView
        key={`${yOffset}-${index}`}
        style={{
          position: "absolute",
          left: (index * graphWidth) / data.length,
          bottom: yOffset * (graphHeight / 4),
          width: graphWidth / data.length,
          height: height * (graphHeight / 4),
          backgroundColor: color,
          opacity: 0.8,
          borderRadius: 8,
        }}
      />
    ));
  };

  return (
    <StyledView className="bg-white border-2 border-black rounded-xl overflow-hidden">
      <StyledView
        className="px-3 py-2 border-b-2 border-black"
        style={{ backgroundColor: currentTheme.main }}
      >
        <StyledText className="font-space text-base font-bold">
          😴 Sleep Analysis - {analysis.date}
        </StyledText>
      </StyledView>

      <StyledView className="p-4">
        {/* Total Sleep Time */}
        <StyledView className="items-center mb-6">
          <StyledText className="font-space text-4xl font-bold">
            {analysis.totalSleep.hours}hr {analysis.totalSleep.minutes}min
          </StyledText>
          <StyledText className="font-space text-sm text-gray-600 mt-1">
            Total Sleep Time
          </StyledText>
        </StyledView>

        {/* Sleep Graph */}
        <StyledView className="mb-6">
          <StyledView className="h-[200px] relative">
            {/* Stage Labels */}
            <StyledView className="absolute left-0 h-full w-16 justify-between">
              {["Awake", "REM", "Core", "Deep"].map((label, i) => (
                <StyledText
                  key={label}
                  className="font-space text-xs text-gray-600"
                >
                  {label}
                </StyledText>
              ))}
            </StyledView>

            {/* Graph Area */}
            <StyledView className="ml-16 h-full relative border-l border-gray-200">
              {/* Sleep Stages */}
              {renderSleepStage(analysis.sleepStages.awake, "#FF6B6B", 3)}
              {renderSleepStage(analysis.sleepStages.rem, "#4ECDC4", 2)}
              {renderSleepStage(analysis.sleepStages.core, "#45B7D1", 1)}
              {renderSleepStage(analysis.sleepStages.deep, "#2C3E50", 0)}

              {/* Time Markers */}
              <StyledView className="absolute bottom-0 w-full flex-row justify-between">
                {analysis.timeMarkers.map((time, index) => (
                  <StyledText
                    key={index}
                    className="font-space text-xs text-gray-600"
                  >
                    {time}
                  </StyledText>
                ))}
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Sleep Insights */}
        <StyledView className="space-y-3">
          {analysis.insights.map((insight, index) => (
            <StyledView
              key={index}
              className="flex-row items-center p-3 border-2 border-black rounded-xl"
              style={{ backgroundColor: currentTheme.lighter }}
            >
              <StyledView
                className="w-8 h-8 items-center justify-center rounded-full mr-3"
                style={{ backgroundColor: currentTheme.main }}
              >
                <Feather name={insight.icon} size={16} color="black" />
              </StyledView>
              <StyledView className="flex-1">
                <StyledText className="font-space text-sm font-bold">
                  {insight.title}
                </StyledText>
                <StyledText className="font-space text-xs text-gray-600">
                  {insight.value}
                </StyledText>
              </StyledView>
            </StyledView>
          ))}
        </StyledView>
      </StyledView>
    </StyledView>
  );
};

export const ChatScreen = () => {
  const { selectedMode, setSelectedMode, currentTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: modeIntroMessages[selectedMode.name],
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isModePickerVisible, setIsModePickerVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Voice call states
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const blobAnimation = useRef(new Animated.Value(0)).current;
  const voiceAnimation = useRef(new Animated.Value(0)).current;

  // Blob animation
  useEffect(() => {
    if (isInCall) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blobAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(blobAnimation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Simulate voice activity
      const voiceInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(voiceAnimation, {
            toValue: Math.random(),
            duration: 200,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
        ]).start();
      }, 200);

      return () => {
        clearInterval(voiceInterval);
        blobAnimation.setValue(0);
        voiceAnimation.setValue(0);
      };
    }
  }, [isInCall]);

  const handleCallPress = () => {
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const renderCallInterface = () => {
    if (!isInCall) return null;

    const scale = blobAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const voiceScale = voiceAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });

    return (
      <Modal
        transparent
        visible={isInCall}
        animationType="fade"
        onRequestClose={handleEndCall}
      >
        <StyledView
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: currentTheme.light }}
        >
          {/* Animated Blob */}
          <StyledView className="relative items-center justify-center w-80 h-80">
            <Animated.View
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: 140,
                backgroundColor: currentTheme.main,
                opacity: 0.5,
                transform: [{ scale }],
              }}
            />
            <Animated.View
              style={{
                position: "absolute",
                width: 240,
                height: 240,
                borderRadius: 120,
                backgroundColor: currentTheme.main,
                opacity: 0.7,
                transform: [{ scale: voiceScale }],
              }}
            />
            <StyledView
              className="w-48 h-48 rounded-full items-center justify-center border-2 border-black"
              style={{ backgroundColor: currentTheme.main }}
            >
              <StyledImage
                source={selectedMode.image}
                className="w-40 h-40"
                resizeMode="contain"
              />
            </StyledView>
          </StyledView>

          {/* Call Controls */}
          <StyledView className="flex-row space-x-4 mt-8">
            <StyledPressable
              onPress={handleToggleMute}
              className="w-14 h-14 rounded-full border-2 border-black items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
              style={{ backgroundColor: isMuted ? "#FF6B6B" : "white" }}
            >
              <Feather
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color="black"
              />
            </StyledPressable>
            <StyledPressable
              onPress={handleEndCall}
              className="w-14 h-14 bg-red-500 rounded-full border-2 border-black items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Feather name="phone-off" size={24} color="white" />
            </StyledPressable>
          </StyledView>
        </StyledView>
      </Modal>
    );
  };

  // Reset conversation steps when mode changes
  useEffect(() => {
    conversationSteps[selectedMode.name] = 0;
    setMessages([
      {
        id: "1",
        text: modeIntroMessages[selectedMode.name],
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setInputText("");
    setIsTyping(false);
  }, [selectedMode]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessageToAPI = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    scrollToBottom();

    // Show typing indicator
    setIsTyping(true);

    // Get next response in the flow
    const currentStep = conversationSteps[selectedMode.name];
    const flow = mockFlows[selectedMode.name];

    if (currentStep < flow.responses.length) {
      const response = flow.responses[currentStep];
      await new Promise((resolve) =>
        setTimeout(resolve, response.delay || 1000)
      );

      const zoeyResponse: Message = {
        id: Date.now().toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        workoutTemplate: response.workoutTemplate,
        productCollection: response.productCollection,
        daySchedule: response.daySchedule,
        medicationSchedule: response.medicationSchedule,
        nutritionLog: response.nutritionLog,
        guidedMeditation: response.guidedMeditation,
        sleepAnalysis: response.sleepAnalysis,
      };

      setMessages((prev) => [...prev, zoeyResponse]);
      conversationSteps[selectedMode.name]++;
    } else {
      // Reset the conversation if we've reached the end
      conversationSteps[selectedMode.name] = 0;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const defaultResponse: Message = {
        id: Date.now().toString(),
        text: "Let's start a new conversation. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, defaultResponse]);
    }

    setIsTyping(false);
    scrollToBottom();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageResponse = async () => {
    // Show typing indicator
    setIsTyping(true);

    // Get next response in the flow
    const currentStep = conversationSteps[selectedMode.name];
    const flow = mockFlows[selectedMode.name];

    if (currentStep < flow.responses.length) {
      const response = flow.responses[currentStep];
      await new Promise((resolve) =>
        setTimeout(resolve, response.delay || 1000)
      );

      const zoeyResponse: Message = {
        id: Date.now().toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        workoutTemplate: response.workoutTemplate,
        productCollection: response.productCollection,
        daySchedule: response.daySchedule,
        medicationSchedule: response.medicationSchedule,
        nutritionLog: response.nutritionLog,
        guidedMeditation: response.guidedMeditation,
        sleepAnalysis: response.sleepAnalysis,
      };

      setMessages((prev) => [...prev, zoeyResponse]);
      conversationSteps[selectedMode.name]++;
    } else {
      // Reset the conversation if we've reached the end
      conversationSteps[selectedMode.name] = 0;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const defaultResponse: Message = {
        id: Date.now().toString(),
        text: "I received your image! How can I help you further?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, defaultResponse]);
    }

    setIsTyping(false);
    scrollToBottom();
  };

  const handleImagePicker = async () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Take Photo
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status === "granted") {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
              });

              if (!result.canceled) {
                const newMessage: Message = {
                  id: Date.now().toString(),
                  text: "",
                  isUser: true,
                  timestamp: new Date(),
                  image: result.assets[0].uri,
                };
                setMessages((prev) => [...prev, newMessage]);
                scrollToBottom();
                await handleImageResponse();
              }
            }
          } else if (buttonIndex === 2) {
            // Choose from Library
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status === "granted") {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
              });

              if (!result.canceled) {
                const newMessage: Message = {
                  id: Date.now().toString(),
                  text: "",
                  isUser: true,
                  timestamp: new Date(),
                  image: result.assets[0].uri,
                };
                setMessages((prev) => [...prev, newMessage]);
                scrollToBottom();
                await handleImageResponse();
              }
            }
          }
        }
      );
    } else {
      // For Android, directly open image picker
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === "granted") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });

        if (!result.canceled) {
          const newMessage: Message = {
            id: Date.now().toString(),
            text: "",
            isUser: true,
            timestamp: new Date(),
            image: result.assets[0].uri,
          };
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
          await handleImageResponse();
        }
      }
    }
  };

  const renderMessage = (message: Message) => {
    if (message.image) {
      return (
        <StyledView
          key={message.id}
          className={`mb-4 flex-row ${
            message.isUser ? "justify-end" : "justify-start"
          }`}
        >
          <StyledView
            className={`p-1 border-2 border-black ${
              message.isUser
                ? `rounded-tl-xl rounded-tr-xl rounded-bl-xl`
                : "bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl"
            } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            style={{
              backgroundColor: message.isUser ? currentTheme.main : "white",
            }}
          >
            <StyledImage
              source={{ uri: message.image }}
              className="w-60 h-60 rounded-lg"
              resizeMode="cover"
            />
          </StyledView>
        </StyledView>
      );
    }

    if (
      !message.isUser &&
      message.text === "WORKOUT_TEMPLATE" &&
      message.workoutTemplate
    ) {
      return (
        <StyledView key={message.id} className="mb-4">
          <WorkoutCard
            workout={message.workoutTemplate}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    if (!message.isUser && message.text === "SHOW_STREAK_TRACKER") {
      return (
        <StyledView key={message.id} className="mb-4">
          <StreakTracker currentTheme={currentTheme} />
        </StyledView>
      );
    }

    if (
      !message.isUser &&
      message.text === "PRODUCT_COLLECTION" &&
      message.productCollection
    ) {
      return (
        <StyledView key={message.id} className="mb-4">
          <ProductGrid
            collection={message.productCollection}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    if (
      !message.isUser &&
      message.text === "CALENDAR_VIEW" &&
      message.daySchedule
    ) {
      return (
        <StyledView key={message.id} className="mb-4">
          <CalendarView
            schedule={message.daySchedule}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    if (!message.isUser && message.medicationSchedule) {
      return (
        <StyledView key={message.id} className="mb-4">
          <MedicationScheduleCard
            schedule={message.medicationSchedule}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    if (!message.isUser && message.nutritionLog) {
      return (
        <StyledView key={message.id} className="mb-4">
          <NutritionLogCard
            log={message.nutritionLog}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    if (!message.isUser && message.guidedMeditation) {
      return (
        <StyledView key={message.id} className="mb-4">
          <GuidedMeditationCard
            meditation={message.guidedMeditation}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    if (!message.isUser && message.sleepAnalysis) {
      return (
        <StyledView key={message.id} className="mb-4">
          <SleepAnalysisCard
            analysis={message.sleepAnalysis}
            currentTheme={currentTheme}
          />
        </StyledView>
      );
    }

    return (
      <StyledView
        key={message.id}
        className={`mb-4 flex-row ${
          message.isUser ? "justify-end" : "justify-start"
        }`}
      >
        <StyledView
          className={`px-4 py-3 max-w-[80%] border-2 border-black ${
            message.isUser
              ? `rounded-tl-xl rounded-tr-xl rounded-bl-xl`
              : "bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl"
          } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
          style={{
            backgroundColor: message.isUser ? currentTheme.main : "white",
          }}
        >
          <Markdown
            style={{
              body: {
                fontFamily: "SpaceGrotesk_400Regular",
                fontSize: 16,
                color: message.isUser ? "#000000" : "#000000",
              },
              code: {
                fontFamily: "SpaceGrotesk_400Regular",
                backgroundColor: message.isUser
                  ? currentTheme.lighter
                  : "#F0F0F0",
                padding: 4,
                borderRadius: 4,
              },
              code_inline: {
                fontFamily: "SpaceGrotesk_400Regular",
                backgroundColor: message.isUser
                  ? currentTheme.lighter
                  : "#F0F0F0",
                padding: 2,
                borderRadius: 4,
              },
            }}
          >
            {message.text}
          </Markdown>
        </StyledView>
      </StyledView>
    );
  };

  const renderTypingIndicator = () => (
    <StyledView className="flex-row mb-4">
      <StyledView className="px-4 py-3 bg-white border-2 border-black rounded-tl-xl rounded-tr-xl rounded-br-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <StyledView className="flex-row items-center space-x-2">
          <ActivityIndicator size="small" color="#000" />
          <StyledText className="font-space text-sm">
            Zoey is typing...
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );

  const renderModePicker = () => (
    <Modal
      transparent
      visible={isModePickerVisible}
      animationType="fade"
      onRequestClose={() => setIsModePickerVisible(false)}
    >
      <StyledPressable
        className="flex-1 bg-black/50"
        onPress={() => setIsModePickerVisible(false)}
      >
        <StyledView className="mt-32 mx-4">
          <StyledView className="bg-white border-2 border-black rounded-xl overflow-hidden">
            {CHAT_MODES.map((mode) => (
              <StyledPressable
                key={mode.name}
                className={`flex-row items-center p-4 border-b-2 border-black last:border-b-0 active:opacity-70`}
                style={{ backgroundColor: mode.color }}
                onPress={() => {
                  setSelectedMode(mode);
                  setIsModePickerVisible(false);
                }}
              >
                <StyledImage
                  source={mode.image}
                  className="w-10 h-10 rounded-full border-2 border-black"
                />
                <StyledText className="ml-3 font-space font-bold">
                  {mode.name} MODE
                </StyledText>
              </StyledPressable>
            ))}
          </StyledView>
        </StyledView>
      </StyledPressable>
    </Modal>
  );

  return (
    <StyledSafeAreaView
      className="flex-1"
      style={{ backgroundColor: currentTheme.light }}
    >
      {/* Header */}
      <StyledView className="flex-row items-center justify-between p-4">
        <StyledView className="flex-row items-center flex-1">
          <StyledPressable
            onPress={() => router.back()}
            className="bg-white border-2 border-black rounded-xl w-10 h-10 items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Feather name="arrow-left" size={20} color="black" />
          </StyledPressable>

          <StyledPressable
            onPress={() => setIsModePickerVisible(true)}
            className="ml-4"
          >
            <StyledView
              className="px-4 py-2 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-row items-center"
              style={{ backgroundColor: currentTheme.main }}
            >
              <StyledText className="font-space font-bold mr-2">
                {selectedMode.name} MODE
              </StyledText>
              <Feather name="chevron-down" size={16} color="black" />
            </StyledView>
          </StyledPressable>
        </StyledView>

        <StyledView className="flex-row space-x-2">
          <StyledPressable
            onPress={handleImagePicker}
            className="border-2 border-black rounded-xl w-10 h-10 items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            style={{ backgroundColor: currentTheme.main }}
          >
            <Feather name="camera" size={20} color="black" />
          </StyledPressable>
          <StyledPressable
            onPress={handleCallPress}
            className="border-2 border-black rounded-xl w-10 h-10 items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            style={{ backgroundColor: currentTheme.main }}
          >
            <Feather name="phone" size={20} color="black" />
          </StyledPressable>
        </StyledView>
      </StyledView>

      {renderModePicker()}
      {renderCallInterface()}

      {/* Chat Container */}
      <StyledView className="flex-1 justify-between">
        {/* Messages */}
        <StyledView className="flex-1 relative">
          <StyledScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <StyledView className="flex-1">
              {messages.length <= 1 && (
                <StyledView className="absolute left-0 right-0 top-[35%] items-center">
                  <StyledImage
                    source={selectedMode.image}
                    className="w-80 h-80 opacity-40"
                    resizeMode="contain"
                  />
                </StyledView>
              )}
              <StyledView className="w-full pt-4">
                {messages.map((message) => renderMessage(message))}
                {isTyping && renderTypingIndicator()}
              </StyledView>
            </StyledView>
            <StyledView className="h-6" />
          </StyledScrollView>
        </StyledView>

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <StyledView
            className="py-6 px-4 border-t-2 border-black"
            style={{ backgroundColor: currentTheme.main }}
          >
            <StyledView className="flex-row items-center">
              <StyledTextInput
                className="flex-1 bg-white px-4 py-3 rounded-xl border-2 border-black font-space mr-2"
                placeholder="Type your message..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessageToAPI(inputText)}
                returnKeyType="send"
              />
              <StyledPressable
                onPress={() => sendMessageToAPI(inputText)}
                disabled={!inputText.trim() || isTyping}
                className={`border-2 border-black rounded-xl w-10 h-10 items-center justify-center ${
                  !inputText.trim() || isTyping
                    ? "bg-gray-200"
                    : "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
                }`}
                style={{
                  backgroundColor:
                    !inputText.trim() || isTyping
                      ? "#E5E5E5"
                      : currentTheme.lighter,
                }}
              >
                <Feather
                  name="send"
                  size={20}
                  color={!inputText.trim() || isTyping ? "#666" : "#000"}
                />
              </StyledPressable>
            </StyledView>
          </StyledView>
        </KeyboardAvoidingView>
      </StyledView>
    </StyledSafeAreaView>
  );
};
