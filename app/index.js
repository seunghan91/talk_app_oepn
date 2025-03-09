// app/index.js
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>expo-router 홈 화면</Text>
      <Link href="/auth">Auth 화면으로 이동</Link>
    </View>
  );
}