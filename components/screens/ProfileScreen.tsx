import React, { useState, useCallback } from "react";
import {
  Text,
  TextInput,
  View,
  Button,
  ScrollView,
  Pressable,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import {
  usePrivy,
  useEmbeddedEthereumWallet,
  getUserEmbeddedEthereumWallet,
  PrivyEmbeddedWalletProvider,
} from "@privy-io/expo";
import { PrivyUser } from "@privy-io/public-api";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

const toMainIdentifier = (x: PrivyUser["linked_accounts"][number]) => {
  if (x.type === "phone") {
    return x.phoneNumber;
  }
  if (x.type === "email" || x.type === "wallet") {
    return x.address;
  }

  if (x.type === "twitter_oauth" || x.type === "tiktok_oauth") {
    return x.username;
  }

  if (x.type === "custom_auth") {
    return x.custom_user_id;
  }

  return x.type;
};

export const ProfileScreen = () => {
  const { currentTheme } = useTheme();
  const { logout, user } = usePrivy();
  const account = getUserEmbeddedEthereumWallet(user);
  const [isDeviceConnected, setIsDeviceConnected] = useState(true);

  if (!user) {
    return null;
  }

  return (
    <StyledSafeAreaView
      className="flex-1"
      style={{ backgroundColor: currentTheme.light }}
      edges={["top"]}
    >
      <StyledScrollView className="flex-1">
        <StyledView className="flex-1 px-4">
          {/* Header with back button */}
          <StyledView className="flex-row items-center py-4">
            <StyledPressable
              onPress={() => router.back()}
              className="bg-white border-2 border-black rounded-xl w-10 h-10 items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Feather name="arrow-left" size={20} color="black" />
            </StyledPressable>
            <StyledText className="font-space text-2xl ml-4">
              Profile
            </StyledText>
          </StyledView>

          {/* Connected Devices */}
          <StyledView className="bg-white border-2 border-black rounded-xl p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] mb-4">
            <StyledText className="font-space text-lg mb-3">
              Connected Devices
            </StyledText>

            <StyledView className="flex-row items-center justify-between bg-[#F5F5F5] p-3 rounded-xl">
              <StyledView className="flex-row items-center">
                <StyledView className="w-10 h-10 bg-black rounded-full items-center justify-center">
                  <Feather name="watch" size={20} color="white" />
                </StyledView>
                <StyledView className="ml-3">
                  <StyledText className="font-space text-base">
                    Apple Watch SE
                  </StyledText>
                  <StyledText className="font-space text-sm text-gray-500">
                    Last sync: Just now
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledPressable
                onPress={() => setIsDeviceConnected(!isDeviceConnected)}
                className="bg-white border-2 border-black rounded-lg px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <StyledText className="font-space text-sm">
                  {isDeviceConnected ? "Disconnect" : "Connect"}
                </StyledText>
              </StyledPressable>
            </StyledView>
          </StyledView>

          {/* Wallet content */}
          <StyledView className="flex-1 space-y-4">
            {/* Wallet Address Card */}
            <StyledView className="bg-white border-2 border-black rounded-xl p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <StyledText className="font-space text-sm text-gray-600 mb-2">
                Your Wallet Address
              </StyledText>
              <StyledView className="flex-row items-center justify-between">
                <StyledText className="font-space text-sm flex-1 mr-2">
                  {account?.address || "No wallet connected"}
                </StyledText>
                <StyledPressable
                  onPress={() => {
                    if (account?.address) {
                      // TODO: Implement clipboard copy
                      alert("Address copied to clipboard!");
                    }
                  }}
                  className="bg-white border-2 border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Feather name="copy" size={16} color="black" />
                </StyledPressable>
              </StyledView>
            </StyledView>

            {/* Action Buttons */}
            <StyledView className="flex-row space-x-4">
              <StyledPressable
                onPress={() => {}}
                className="flex-1 bg-white border-2 border-black rounded-xl p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px]"
                style={{ backgroundColor: currentTheme.main }}
              >
                <StyledView className="flex-row items-center justify-center">
                  <Feather name="plus-circle" size={20} color="black" />
                  <StyledText className="font-space text-lg ml-2">
                    Add Funds
                  </StyledText>
                </StyledView>
              </StyledPressable>

              <StyledPressable
                onPress={() => {}}
                className="flex-1 bg-white border-2 border-black rounded-xl p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px]"
                style={{ backgroundColor: currentTheme.main }}
              >
                <StyledView className="flex-row items-center justify-center">
                  <Feather name="arrow-up-circle" size={20} color="black" />
                  <StyledText className="font-space text-lg ml-2">
                    Withdraw
                  </StyledText>
                </StyledView>
              </StyledPressable>
            </StyledView>

            {/* Logout Button */}
            <StyledPressable
              onPress={() => {
                logout();
                router.replace("/user");
              }}
              className="bg-white border-2 border-black rounded-xl p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px]"
              style={{ backgroundColor: currentTheme.main }}
            >
              <StyledView className="flex-row items-center justify-center">
                <Feather name="log-out" size={20} color="black" />
                <StyledText className="font-space text-lg ml-2">
                  Logout
                </StyledText>
              </StyledView>
            </StyledPressable>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
};
