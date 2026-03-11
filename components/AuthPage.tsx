import React, { useState } from 'react';
import { Zap, Mail, Lock, UserPlus, LogIn, AlertCircle, Loader2, CheckCircle2, Languages, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import AuraBackground from './AuraBackground';

const AUTH_TRANSLATIONS = {
    en: {
        title: "MEMORY",
        subtitle: "CORRIDOR",
        loginTitle: "Access the Corridor",
        loginDesc: "Sign in to access your neural memory archives.",
        registerTitle: "Create Your Identity",
        registerDesc: "Register to begin archiving your neural memories.",
        email: "Neural ID (Email)",
        password: "Access Key (Password)",
        confirmPassword: "Confirm Access Key",
        loginBtn: "Enter the Corridor",
        registerBtn: "Create Identity",
        switchToRegister: "No identity? Create one",
        switchToLogin: "Already have an identity? Sign in",
        loggingIn: "Authenticating...",
        registering: "Creating identity...",
        registerSuccess: "Identity created! Please check your email to verify your account, then sign in.",
        passwordMismatch: "Access keys do not match.",
        passwordTooShort: "Access key must be at least 6 characters.",
        emailRequired: "Neural ID (Email) is required.",
    },
    zh: {
        title: "记忆",
        subtitle: "回廊",
        loginTitle: "进入回廊",
        loginDesc: "登录以访问你的神经记忆档案。",
        registerTitle: "创建你的身份",
        registerDesc: "注册以开始归档你的神经记忆。",
        email: "神经 ID（邮箱）",
        password: "访问密钥（密码）",
        confirmPassword: "确认访问密钥",
        loginBtn: "进入回廊",
        registerBtn: "创建身份",
        switchToRegister: "没有身份？创建一个",
        switchToLogin: "已有身份？直接登录",
        loggingIn: "正在验证身份...",
        registering: "正在创建身份...",
        registerSuccess: "身份已创建！请检查邮箱验证您的账户，然后登录。",
        passwordMismatch: "访问密钥不匹配。",
        passwordTooShort: "访问密钥至少需要6个字符。",
        emailRequired: "神经 ID（邮箱）不能为空。",
    },
};

interface AuthPageProps {
    language: Language;
    onToggleLanguage: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ language, onToggleLanguage }) => {
    const { signIn, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const t = AUTH_TRANSLATIONS[language];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email.trim()) {
            setError(t.emailRequired);
            return;
        }
        if (password.length < 6) {
            setError(t.passwordTooShort);
            return;
        }
        if (!isLogin && password !== confirmPassword) {
            setError(t.passwordMismatch);
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    setSuccess(t.registerSuccess);
                    setIsLogin(true);
                    setPassword('');
                    setConfirmPassword('');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setSuccess(null);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center font-sans relative overflow-hidden">
            <AuraBackground />

            {/* Header */}
            <header className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform">
                            <Zap className="text-white w-5 h-5 fill-current" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter uppercase">
                            {t.title} <span className="text-indigo-400">{t.subtitle}</span>
                        </h1>
                    </div>
                    <button
                        onClick={onToggleLanguage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-400"
                    >
                        <Languages className="w-4 h-4" />
                        {language === 'en' ? 'EN' : 'ZH'}
                    </button>
                </div>
            </header>

            {/* Auth Form */}
            <main className="flex-1 flex items-center justify-center w-full px-4 py-16 relative z-10">
                <div className="w-full max-w-lg">
                    <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white/10 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-[100px]" />
                        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-500/10 rounded-full blur-[100px]" />

                        {/* Title */}
                        <div className="text-center mb-10 relative z-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[1.5rem] shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6">
                                {isLogin ? <LogIn className="w-9 h-9 text-white" /> : <UserPlus className="w-9 h-9 text-white" />}
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-white mb-3">
                                {isLogin ? t.loginTitle : t.registerTitle}
                            </h2>
                            <p className="text-zinc-500 text-sm font-medium">
                                {isLogin ? t.loginDesc : t.registerDesc}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            {/* Email */}
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    type="email"
                                    placeholder={t.email}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-zinc-950/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base font-medium text-zinc-300 placeholder:text-zinc-600"
                                />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t.password}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-14 py-5 rounded-2xl bg-zinc-950/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base font-medium text-zinc-300 placeholder:text-zinc-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-indigo-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Confirm Password (Register only) */}
                            {!isLogin && (
                                <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t.confirmPassword}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-zinc-950/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base font-medium text-zinc-300 placeholder:text-zinc-600"
                                    />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 text-sm animate-in fade-in duration-300">
                                    <AlertCircle className="shrink-0 w-5 h-5 mt-0.5" />
                                    <p className="font-bold">{error}</p>
                                </div>
                            )}

                            {/* Success */}
                            {success && (
                                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 text-sm animate-in fade-in duration-300">
                                    <CheckCircle2 className="shrink-0 w-5 h-5 mt-0.5" />
                                    <p className="font-bold">{success}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 font-black py-5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5" />
                                        <span className="text-sm uppercase tracking-widest">{isLogin ? t.loggingIn : t.registering}</span>
                                    </>
                                ) : (
                                    <>
                                        {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                        <span>{isLogin ? t.loginBtn : t.registerBtn}</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle */}
                        <div className="mt-8 text-center relative z-10">
                            <button
                                onClick={toggleMode}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold text-sm hover:underline underline-offset-4"
                            >
                                {isLogin ? t.switchToRegister : t.switchToLogin}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AuthPage;
