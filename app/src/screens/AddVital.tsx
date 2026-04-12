import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMedStore } from "../store/useMedStore";
import { Vital } from "../types/Vital";

// type AddVitalRouteProp = RouteProp<RootStackParamList, "AddVital">;

export default function AddVital() {
    // const route = useRoute<AddVitalRouteProp>();
    const navigation = useNavigation();
    const { addVital } = useMedStore();
    const [type, setType] = useState<Vital["type"]>("heart_rate");
    const [value, setValue] = useState("");
    const [unit, setUnit] = useState("");
    const [status, setStatus] = useState<Vital["status"]>("normal");
    const [recordedAt, setRecordedAt] = useState("");

    const handleSave = async () => {
        const newVital = {
            type,
            value,
            unit,
            status,
        };
        await addVital(newVital);

        setType("blood_pressure");
        setValue("");
        setUnit("");
        setStatus("normal");
        setRecordedAt("");
        navigation.goBack();
    }
    return (
        <View>
            <Text style={styles.title}>ADD NEW VITAL</Text>
            <TextInput value={type} onChangeText={(text) => setType(text as Vital["type"])} placeholderTextColor="#999"  placeholder="Type (e.g., heart_rate)" style={styles.input} />
            <TextInput value={value} onChangeText={(text) => setValue(text)} placeholderTextColor="#999" placeholder="Value (e.g., 72)" style={styles.input} keyboardType="numeric" />
            <TextInput value={unit} onChangeText={(text) => setUnit(text)} placeholderTextColor="#999" placeholder="Unit (e.g., bpm)" style={styles.input} />
            <TextInput value={status} onChangeText={(text) => setStatus(text as Vital["status"])} placeholderTextColor="#999" placeholder="Status (e.g., normal)" style={styles.input} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave()}>
                <Text style={styles.saveBtnText}>SAVE VITAL</Text>
            </TouchableOpacity>
            {/* Form fields for type, value, unit, status, recordedAt */}
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: "500",
        marginTop: 36,
        marginHorizontal: 16,
        color: "#555",
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,

    },
    saveBtn: {
        backgroundColor: "#007AFF",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignSelf: "center",
        marginTop: 24,
    },
    saveBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "500",
    },
});