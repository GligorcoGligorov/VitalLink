import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import Auth from "./src/components/Auth";
import { supabase } from "./src/lib/supabase";
import AddMedication from "./src/screens/AddMedication";
import AddVital from "./src/screens/AddVital";
import PatientDetail from "./src/screens/PatientDetail";
import Doctors from "./src/screens/Doctors";
import Meds from "./src/screens/Meds";
import Messages from "./src/screens/Messages";
import Patients from "./src/screens/Patients";
import Profiles from "./src/screens/Profiles";
import Vitals from "./src/screens/Vitals";
import { RootStackParamList } from "./src/types/navigation";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function PatientTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Vitals"   component={Vitals}   options={{ tabBarLabel: "Vitals",    tabBarIcon: () => <Text>📊</Text>, headerShown: false }} />
            <Tab.Screen name="Meds"     component={Meds}     options={{ tabBarLabel: "Meds",      tabBarIcon: () => <Text>💊</Text>, headerShown: false }} />
            <Tab.Screen name="Messages" component={Messages} options={{ tabBarLabel: "Messages",  tabBarIcon: () => <Text>💬</Text>, headerShown: false }} />
            <Tab.Screen name="Doctors"  component={Doctors}  options={{ tabBarLabel: "Doctors",   tabBarIcon: () => <Text>👨🏼‍⚕️</Text>, headerShown: false }} />
            <Tab.Screen name="Profiles" component={Profiles} options={{ tabBarLabel: "Profile",   tabBarIcon: () => <Text>👤</Text>, headerShown: false }} />
        </Tab.Navigator>
    );
}

function DoctorTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Patients" component={Patients} options={{ tabBarLabel: "Patients",  tabBarIcon: () => <Text>👥</Text>, headerShown: false }} />
            <Tab.Screen name="Messages" component={Messages} options={{ tabBarLabel: "Messages",  tabBarIcon: () => <Text>💬</Text>, headerShown: false }} />
            <Tab.Screen name="Profiles" component={Profiles} options={{ tabBarLabel: "Profile",   tabBarIcon: () => <Text>👤</Text>, headerShown: false }} />
        </Tab.Navigator>
    );
}

export default function App() {
    const [session, setSession] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchRole(session.user.id);
            else setLoading(false);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchRole(session.user.id);
            else { setRole(null); setLoading(false); }
        });
    }, []);

    async function fetchRole(userId: string) {
        const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
        setRole(data?.role ?? null);
        setLoading(false);
    }

    if (loading) return null;
    if (!session) return <Auth />;

    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name="Tabs"
                    component={role === "doctor" ? DoctorTabs : PatientTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="AddVital" component={AddVital} options={{ title: "Add Vital" }} />
                <Stack.Screen name="AddMedication" component={AddMedication} options={{ headerShown: false }} />
                <Stack.Screen name="PatientDetail" component={PatientDetail} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
