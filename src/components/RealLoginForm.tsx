import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { AuthService } from "../services/authService";
import { LoginForm as LoginFormType } from "../types";
import { sanitizeErrorMessage } from "../utils/arabicUtils";

interface RealLoginFormProps {
  onLogin: () => void;
}

export const RealLoginForm: React.FC<RealLoginFormProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<LoginFormType>({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await AuthService.login(formData);
      onLogin();
    } catch (err: any) {
      setError(
        sanitizeErrorMessage(
          err instanceof Error ? err.message : "خطأ في تسجيل الدخول",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-moe-900 to-moe-500 flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* شعار SAMAYA */}
        <div className="flex justify-center mb-8">
          <img
            src="/samaya.png"
            alt="Samaya Logo"
            className="h-14 object-contain"
          />
        </div>

        {/* صندوق تسجيل الدخول */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-500/20 border border-red-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-200" />
                  <p className="text-red-100 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* اسم المستخدم */}
            <div>
              <label className="text-sm text-white/80 mb-1 block">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="أدخل اسم المستخدم"
                  className="w-full pr-10 pl-3 py-2 rounded-lg bg-white text-gray-800 placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-moe-300"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="text-sm text-white/80 mb-1 block">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-moe-600 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="أدخل كلمة المرور"
                  className="w-full pr-10 pl-10 py-2 rounded-lg bg-white text-gray-800 placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-moe-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-moe-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* تذكرني */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                تذكرني
              </label>
              <button type="button" className="text-white/80 hover:text-white">
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-moe-700 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-gray-100 transition shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>
        </div>

        {/* الحقوق */}
        <p className="text-center text-white/60 text-sm mt-6">
          © 2026 نظام الحراسات. جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};
