import { useState } from 'react';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

export default function AuthStack() {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <LoginScreen onSwitch={() => setIsLogin(false)} />;
  }
  return <RegisterScreen onSwitch={() => setIsLogin(true)} />;
}
