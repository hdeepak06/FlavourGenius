import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div className="p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100 mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FlavorGenius AI</h1>
          <p className="text-gray-500 text-center mt-2">
            Unlock a world of intelligent recipes and personalized cooking.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-medium ${
              isLogin ? "bg-white shadow-sm text-red-600" : "text-gray-500"
            }`}
          >
            <LogIn size={18} />
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-medium ${
              !isLogin ? "bg-white shadow-sm text-red-600" : "text-gray-500"
            }`}
          >
            <UserPlus size={18} />
            Signup
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              placeholder="chef@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
          >
            {isLogin ? "Welcome Back" : "Start Cooking"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
