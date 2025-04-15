import { Text, View, Pressable, Dimensions } from "react-native";
import { useLogin } from "@privy-io/expo";
import { useState, useRef, useEffect } from "react";
import { Video, ResizeMode } from "expo-av";
import { styled } from "nativewind";
import { NeuButton } from "../functional/NeuButton";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledVideo = styled(Video);

const TypewriterText = ({
  text,
  delay = 50,
}: {
  text: string;
  delay?: number;
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((c) => c + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return (
    <StyledView className="min-h-[64px] w-[90%] justify-center">
      <StyledText
        style={{ fontFamily: "SpaceGrotesk_400Regular" }}
        className="text-2xl text-black text-center leading-8"
      >
        {displayText}
      </StyledText>
    </StyledView>
  );
};

export default function LoginScreen() {
  const [error, setError] = useState("");
  const { login } = useLogin();
  const screenWidth = Dimensions.get("window").width;
  const videoRef = useRef<Video>(null);

  return (
    <StyledView className="flex-1 bg-[#F0E5FF] p-5">
      {/* Video and Title Container */}
      <StyledView className="flex-1 items-center justify-center">
        <StyledView
          className="relative mb-5"
          style={{ width: screenWidth - 40, aspectRatio: 1 }}
        >
          {/* Shadow box - following neubrutalism design system */}
          <StyledView className="absolute w-full h-full bg-black rounded-xl top-[5px] left-[5px]" />
          {/* Main container - following neubrutalism design system */}
          <StyledView className="w-full h-full bg-white rounded-xl border-2 border-black overflow-hidden relative">
            <StyledVideo
              ref={videoRef}
              source={require("../../assets/videos/splash.mp4")}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
              className="w-full h-full"
              onError={(error) => {
                console.error("Video playback error:", error);
                setError("Failed to load video");
              }}
            />
          </StyledView>
        </StyledView>

        <TypewriterText text="Hey! I am Zoey. Lets begin a journey to a healthier you!" />
      </StyledView>

      {/* Login Button Container */}
      <StyledView className="mb-10">
        <NeuButton
          onPress={() => {
            login({ loginMethods: ["email"] })
              .then((session) => {
                console.log("User logged in", session.user);
              })
              .catch((err) => {
                setError(JSON.stringify(err.error) as string);
              });
          }}
        >
          <Text
            style={{
              fontFamily: "SpaceGrotesk_400Regular",
              fontSize: 24,
              color: "#000000",
              textAlign: "center",
            }}
          >
            Login
          </Text>
        </NeuButton>

        {error && (
          <StyledText
            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
            className="text-red-500 mt-5"
          >
            Error: {error}
          </StyledText>
        )}
      </StyledView>
    </StyledView>
  );
}
