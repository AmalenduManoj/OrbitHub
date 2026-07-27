import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Props {
  onSwitch: () => void;
}

export default function RegisterScreen({ onSwitch }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await register({ username, email, password });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { error?: string } } }).response?.data?.error || 'Registration failed'
          : 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#0A0A0A] justify-center px-6" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text className="text-3xl font-bold text-center mb-2 text-[#7C3AED]">Orbit</Text>
      <Text className="text-center text-[#9D9DA3] mb-8">Create your account</Text>

      {error ? (
        <View className="bg-red-900/40 border border-red-500/50 rounded-xl px-4 py-2 mb-4">
          <Text className="text-red-200 text-sm">{error}</Text>
        </View>
      ) : null}

      <TextInput
        className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#2C2C2E] text-white placeholder-[#636366] mb-4"
        placeholder="Username"
        placeholderTextColor="#636366"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#2C2C2E] text-white placeholder-[#636366] mb-4"
        placeholder="Email"
        placeholderTextColor="#636366"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#2C2C2E] text-white placeholder-[#636366] mb-6"
        placeholder="Password"
        placeholderTextColor="#636366"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-[#7C3AED] items-center disabled:opacity-50"
      >
        <Text className="text-white font-semibold">{submitting ? 'Creating account…' : 'Create Account'}</Text>
      </TouchableOpacity>

      <Text className="text-center text-[#9D9DA3] text-sm mt-6">
        Already have an account?{' '}
        <Text className="text-[#7C3AED]" onPress={onSwitch}>Sign in</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}
