import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { supabase } from '../lib/supabase'

type Screen = 'splash' | 'login' | 'register'
type Role = 'patient' | 'doctor'

export default function Auth() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('patient')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Sign in failed', error.message)
    setLoading(false)
  }

  async function signUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) Alert.alert('Sign up failed', error.message)
    setLoading(false)
  }

  if (screen === 'splash') {
    return (
      <View style={styles.splashScreen}>
        <View style={styles.splashBody}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🩷</Text>
          </View>
          <Text style={styles.appName}>VitalLink</Text>
          <Text style={styles.appTagline}>Your health, connected.</Text>
        </View>

        <View style={styles.splashButtons}>
          <TouchableOpacity style={styles.loginBtn} onPress={() => setScreen('login')}>
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => setScreen('register')}>
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.splashFooter}>Secure · HIPAA Compliant · Encrypted</Text>
      </View>
    )
  }

  if (screen === 'login') {
    return (
      <KeyboardAvoidingView
        style={styles.formScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.formInner} keyboardShouldPersistTaps="handled">
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome back 👋</Text>
            <Text style={styles.formSubtitle}>Sign in to your account</Text>
          </View>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="gish@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={signIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <Text style={styles.switchText}>
            Don't have an account?{' '}
            <Text style={styles.switchLink} onPress={() => setScreen('register')}>
              Register
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.formScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.formInner} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Create account</Text>
          <Text style={styles.formSubtitle}>Join VitalLink today</Text>
        </View>

        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Gligorco Gligorov"
          placeholderTextColor="#9ca3af"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="gish@example.com"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••••"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>I AM A...</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'patient' && styles.roleCardActive]}
            onPress={() => setRole('patient')}
          >
            <Text style={styles.roleEmoji}>🤒</Text>
            <Text style={[styles.roleLabel, role === 'patient' && styles.roleLabelActive]}>
              Patient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleCard, role === 'doctor' && styles.roleCardActive]}
            onPress={() => setRole('doctor')}
          >
            <Text style={styles.roleEmoji}>🩺</Text>
            <Text style={[styles.roleLabel, role === 'doctor' && styles.roleLabelActive]}>
              Doctor
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={signUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By registering you agree to our{' '}
          <Text style={styles.switchLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.switchLink}>Privacy Policy</Text>
        </Text>

        <Text style={[styles.switchText, { marginTop: 12 }]}>
          Already have an account?{' '}
          <Text style={styles.switchLink} onPress={() => setScreen('login')}>
            Log In
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const BLUE = '#2563eb'

const styles = StyleSheet.create({
  /* Splash */
  splashScreen: {
    flex: 1,
    backgroundColor: BLUE,
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  splashBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
  splashButtons: {
    gap: 12,
  },
  loginBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    color: BLUE,
    fontSize: 16,
    fontWeight: '700',
  },
  registerBtn: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  splashFooter: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 24,
  },

  /* Form screens */
  formScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formInner: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  formHeader: {
    backgroundColor: BLUE,
    marginHorizontal: -24,
    marginTop: -60,
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 20,
  },
  forgotText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
    marginVertical: 16,
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  switchLink: {
    color: BLUE,
    fontWeight: '700',
  },

  /* Role selector */
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  roleCardActive: {
    borderColor: BLUE,
    backgroundColor: '#eff6ff',
  },
  roleEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleLabelActive: {
    color: BLUE,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 16,
    lineHeight: 18,
  },
})
