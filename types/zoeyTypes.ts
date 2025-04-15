// Type for Feather icon names
export type FeatherIconName =
  | "activity"
  | "arrow-up"
  | "chevrons-down"
  | "chevrons-right"
  | "clock"
  | "moon"
  | "coffee"
  | "mic"
  | "mic-off"
  | "phone"
  | "phone-off"
  | "camera"
  | "send"
  | "arrow-left"
  | "chevron-down"
  | "pause"
  | "play";

// Exercise type for workout templates
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  icon: FeatherIconName;
}

// Workout template type
export interface WorkoutTemplate {
  title: string;
  description: string;
  exercises: Exercise[];
  tips: string[];
}

// Product type for shopping recommendations
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating: number;
}

// Product collection type
export interface ProductCollection {
  title: string;
  products: Product[];
}

// Activity type for scheduling
export interface Activity {
  time: string;
  activity: string;
  duration: number;
}

// Meeting type for scheduling
export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  time: string;
  duration: number;
  isOnline: boolean;
  participants: string[];
}

// Day schedule type
export interface DaySchedule {
  date: string;
  activities: Activity[];
  meetings: Meeting[];
}

// Medication type
export interface Medication {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  withFood: boolean;
}

// Medication schedule type
export interface MedicationSchedule {
  medications: Medication[];
}

// Nutrition macros type
export interface NutritionMacros {
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

// Micronutrient type
export interface Micronutrient {
  name: string;
  amount: string;
}

// Nutrition log type
export interface NutritionLog {
  mealType: string;
  timestamp: string;
  calories: number;
  macros: NutritionMacros;
  micronutrients: Micronutrient[];
}

// Guided meditation type
export interface GuidedMeditation {
  duration: number;
  currentTime: number;
  title: string;
  phase: "intro" | "breathing" | "body" | "mind" | "closing";
  isPlaying: boolean;
}

// Sleep stages type
export interface SleepStages {
  awake: number[];
  rem: number[];
  core: number[];
  deep: number[];
}

// Sleep insight type
export interface SleepInsight {
  title: string;
  value: string;
  icon: FeatherIconName;
}

// Sleep analysis type
export interface SleepAnalysis {
  date: string;
  totalSleep: {
    hours: number;
    minutes: number;
  };
  sleepStages: SleepStages;
  timeMarkers: string[];
  sleepScore: number;
  insights: SleepInsight[];
}
