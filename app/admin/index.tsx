
import {
  ScrollView,
  View,
  Text,
  ImageBackground,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Users,
  PawPrint,
  Pill,
  ChartNoAxesColumn,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import { auth } from "../../config/firebaseConfig";

const GREEN = "#4D7C6B";
const GREEN_LIGHT = "#E8F0EB";
const CREAM = "#F5ECE3";
const BROWN = "#A1816D";
const DARK = "#3D5148";
const MUTED = "#81776F";
const BORDER = "#E9DDD4";

const sections = [
  {
    title: "Manage Users",
    description: "View registered Pawmetry accounts",
    route: "/admin/users" as const,
    Icon: Users,
  },
  {
    title: "Manage Pets",
    description: "Explore pet profiles and details",
    route: "/admin/pets" as const,
    Icon: PawPrint,
  },
  {
    title: "Medications",
    description: "Review pet medication records",
    route: "/admin/medications" as const,
    Icon: Pill,
  },
  {
    title: "Reports & Analytics",
    description: "View platform statistics",
    route: "/admin/reports" as const,
    Icon: ChartNoAxesColumn,
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Unable to sign out:", error);
    }
  }

  return (
    <ImageBackground
      source={require("../../assets/images/Login_bg.jpg")}
      style={styles.background}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <PawPrint size={23} color={GREEN} strokeWidth={2.2} />
              </View>

              <View>
                <Text style={styles.brandName}>Pawmetry</Text>
                <Text style={styles.brandCaption}>ADMINISTRATION</Text>
              </View>
            </View>

            <View style={styles.secureBadge}>
              <ShieldCheck size={15} color={GREEN} />
              <Text style={styles.secureText}>Admin</Text>
            </View>
          </View>

          <View style={styles.welcome}>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.heading}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>
              Manage your platform and keep track of your pet community.
            </Text>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Platform Management</Text>
            <Text style={styles.sectionCaption}>4 sections</Text>
          </View>

          {sections.map(({ title, description, route, Icon }) => (
            <Pressable
              key={route}
              onPress={() => router.push(route)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardIcon}>
                <Icon size={23} color={GREEN} strokeWidth={2} />
              </View>

              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
              </View>

              <View style={styles.arrow}>
                <ChevronRight size={20} color={BROWN} />
              </View>
            </Pressable>
          ))}

          <View style={styles.footerNote}>
            <PawPrint size={17} color={GREEN} />
            <Text style={styles.footerText}>
              Caring for pets, one profile at a time.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logout,
              pressed && styles.logoutPressed,
            ]}
            onPress={handleLogout}
          >
            <LogOut size={18} color={GREEN} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>

          <Text style={styles.version}>PAWMETRY • ADMIN PANEL</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: CREAM,
  },
  backgroundImage: {
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: DARK,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  brandCaption: {
    color: BROWN,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 3,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: GREEN_LIGHT,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secureText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "700",
  },
  welcome: {
    marginBottom: 30,
  },
  greeting: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 7,
  },
  heading: {
    color: DARK,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCaption: {
    color: MUTED,
    fontSize: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 88,
    shadowColor: "#5C493D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 7,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  cardIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  arrow: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 22,
    paddingVertical: 14,
  },
  footerText: {
    color: MUTED,
    fontSize: 12,
  },
  logout: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#D2E1D7",
  },
  logoutPressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "700",
  },
  version: {
    color: "#A69A90",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textAlign: "center",
    marginTop: 18,
  },
});
