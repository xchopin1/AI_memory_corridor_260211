import React, { useState } from 'react';
import {
    Zap, Settings, Mail, Lock, LogOut, AlertCircle, Loader2, CheckCircle2,
    Languages, ArrowLeft, Eye, EyeOff, KeyRound, Shield, User as UserIcon, Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import AuraBackground from './AuraBackground';

const SETTINGS_TRANSLATIONS = {
    en: {
        title: "MEMORY",
        subtitle: "CORRIDOR",
        settingsTitle: "Account Settings",
        settingsDesc: "Manage your neural identity and access credentials.",
        profileSection: "Neural Profile",
        email: "Registered Email",
        memberSince: "Member Since",
        securitySection: "Security Protocol",
        changePasswordTitle: "Change Access Key",
        changePasswordDesc: "We'll send a password reset link to your registered email address. Click the link in the email to set a new password.",
        sendResetEmail: "Send Reset Email",
        sendingEmail: "Transmitting...",
        resetEmailSent: "Password reset email sent! Please check your inbox (and spam folder) for the reset link.",
        newPassword: "New Access Key",
        confirmNewPassword: "Confirm New Access Key",
        updatePassword: "Update Access Key",
        updatingPassword: "Updating...",
        passwordUpdated: "Access key updated successfully! You can now use your new password to sign in.",
        passwordTooShort: "New access key must be at least 6 characters.",
        passwordMismatch: "New access keys do not match.",
        logoutSection: "Session Control",
        logoutTitle: "Terminate Session",
        logoutDesc: "Sign out of your current neural link session.",
        logoutBtn: "Sign Out",
        loggingOut: "Disconnecting...",
        back: "Back",
        recoveryMode: "You arrived via a password reset link. Please set your new password below.",
    },
    zh: {
        title: "记忆",
        subtitle: "回廊",
        settingsTitle: "账户设置",
        settingsDesc: "管理你的神经身份和访问凭证。",
        profileSection: "神经档案",
        email: "注册邮箱",
        memberSince: "注册时间",
        securitySection: "安全协议",
        changePasswordTitle: "更改访问密钥",
        changePasswordDesc: "我们将向您的注册邮箱发送密码重置链接。点击邮件中的链接即可设置新密码。",
        sendResetEmail: "发送重置邮件",
        sendingEmail: "发送中...",
        resetEmailSent: "密码重置邮件已发送！请检查您的收件箱（和垃圾邮件文件夹）。",
        newPassword: "新访问密钥",
        confirmNewPassword: "确认新访问密钥",
        updatePassword: "更新访问密钥",
        updatingPassword: "更新中...",
        passwordUpdated: "访问密钥已成功更新！您现在可以使用新密码登录。",
        passwordTooShort: "新访问密钥至少需要6个字符。",
        passwordMismatch: "新访问密钥不匹配。",
        logoutSection: "会话控制",
        logoutTitle: "终止会话",
        logoutDesc: "登出当前神经链路会话。",
        logoutBtn: "登出",
        loggingOut: "正在断开连接...",
        back: "返回",
        recoveryMode: "您通过密码重置链接到达此页面。请在下方设置新密码。",
    },
};

interface AccountSettingsProps {
    language: Language;
    onToggleLanguage: () => void;
    onBack: () => void;
    isRecoveryMode?: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ language, onToggleLanguage, onBack, isRecoveryMode = false }) => {
    const { user, signOut, resetPasswordForEmail, updatePassword } = useAuth();
    const t = SETTINGS_TRANSLATIONS[language];

    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);

    // For recovery mode (direct password update)
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [logoutLoading, setLogoutLoading] = useState(false);

    const handleSendResetEmail = async () => {
        if (!user?.email) return;
        setResetError(null);
        setResetSuccess(null);
        setResetLoading(true);

        try {
            const { error } = await resetPasswordForEmail(user.email);
            if (error) {
                setResetError(error.message);
            } else {
                setResetSuccess(t.resetEmailSent);
            }
        } catch (err: any) {
            setResetError(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateError(null);
        setUpdateSuccess(null);

        if (newPassword.length < 6) {
            setUpdateError(t.passwordTooShort);
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setUpdateError(t.passwordMismatch);
            return;
        }

        setUpdateLoading(true);
        try {
            const { error } = await updatePassword(newPassword);
            if (error) {
                setUpdateError(error.message);
            } else {
                setUpdateSuccess(t.passwordUpdated);
                setNewPassword('');
                setConfirmNewPassword('');
            }
        } catch (err: any) {
            setUpdateError(err.message);
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleSignOut = async () => {
        setLogoutLoading(true);
        try {
            await signOut();
        } finally {
            setLogoutLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center font-sans relative overflow-hidden">
            <AuraBackground />

            {/* Header */}
            <header className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={onBack}>
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform">
                            <Zap className="text-white w-5 h-5 fill-current" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter uppercase">
                            {t.title} <span className="text-indigo-400">{t.subtitle}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleLanguage}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-400"
                        >
                            <Languages className="w-4 h-4" />
                            {language === 'en' ? 'EN' : 'ZH'}
                        </button>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-400"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.back}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 relative z-10">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[1.5rem] shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6">
                        <Settings className="w-9 h-9 text-white" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-white mb-3">
                        {t.settingsTitle}
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">
                        {t.settingsDesc}
                    </p>
                </div>

                {/* Recovery Mode Banner */}
                {isRecoveryMode && (
                    <div className="mb-8 flex items-start gap-3 p-5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 text-sm animate-in fade-in duration-300">
                        <KeyRound className="shrink-0 w-5 h-5 mt-0.5" />
                        <p className="font-bold">{t.recoveryMode}</p>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Profile Section */}
                    <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-[100px]" />

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <UserIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white uppercase">
                                {t.profileSection}
                            </h3>
                        </div>

                        <div className="space-y-5 relative z-10">
                            {/* Email */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-5 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3 text-zinc-500 min-w-[140px]">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">{t.email}</span>
                                </div>
                                <span className="text-zinc-200 font-bold text-base break-all">{user?.email || '—'}</span>
                            </div>

                            {/* Member Since */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-5 bg-zinc-950/50 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3 text-zinc-500 min-w-[140px]">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">{t.memberSince}</span>
                                </div>
                                <span className="text-zinc-200 font-bold text-base">{formatDate(user?.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-500/5 rounded-full blur-[100px]" />

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <KeyRound className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white uppercase">
                                {t.changePasswordTitle}
                            </h3>
                        </div>

                        {/* Recovery mode: direct password update form */}
                        {isRecoveryMode ? (
                            <form onSubmit={handleUpdatePassword} className="space-y-5 relative z-10">
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder={t.newPassword}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-14 pr-14 py-5 rounded-2xl bg-zinc-950/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base font-medium text-zinc-300 placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-indigo-400 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder={t.confirmNewPassword}
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-zinc-950/50 border-2 border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base font-medium text-zinc-300 placeholder:text-zinc-600"
                                    />
                                </div>

                                {updateError && (
                                    <div className="flex items-start gap-3 p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 text-sm animate-in fade-in duration-300">
                                        <AlertCircle className="shrink-0 w-5 h-5 mt-0.5" />
                                        <p className="font-bold">{updateError}</p>
                                    </div>
                                )}

                                {updateSuccess && (
                                    <div className="flex items-start gap-3 p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 text-sm animate-in fade-in duration-300">
                                        <CheckCircle2 className="shrink-0 w-5 h-5 mt-0.5" />
                                        <p className="font-bold">{updateSuccess}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(99,102,241,0.3)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-base"
                                >
                                    {updateLoading ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span className="text-sm uppercase tracking-widest">{t.updatingPassword}</span>
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="w-5 h-5" />
                                            <span>{t.updatePassword}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* Normal mode: send reset email */
                            <div className="space-y-5 relative z-10">
                                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                    {t.changePasswordDesc}
                                </p>

                                <div className="flex items-center gap-3 p-5 bg-zinc-950/50 rounded-2xl border border-white/5">
                                    <Mail className="w-5 h-5 text-zinc-500" />
                                    <span className="text-zinc-300 font-bold">{user?.email || '—'}</span>
                                </div>

                                {resetError && (
                                    <div className="flex items-start gap-3 p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 text-sm animate-in fade-in duration-300">
                                        <AlertCircle className="shrink-0 w-5 h-5 mt-0.5" />
                                        <p className="font-bold">{resetError}</p>
                                    </div>
                                )}

                                {resetSuccess && (
                                    <div className="flex items-start gap-3 p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 text-sm animate-in fade-in duration-300">
                                        <CheckCircle2 className="shrink-0 w-5 h-5 mt-0.5" />
                                        <p className="font-bold">{resetSuccess}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSendResetEmail}
                                    disabled={resetLoading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(99,102,241,0.3)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-base"
                                >
                                    {resetLoading ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span className="text-sm uppercase tracking-widest">{t.sendingEmail}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>{t.sendResetEmail}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sign Out Section */}
                    <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute -top-20 -left-20 w-60 h-60 bg-rose-500/5 rounded-full blur-[100px]" />

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <LogOut className="w-6 h-6 text-rose-400" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white uppercase">
                                {t.logoutTitle}
                            </h3>
                        </div>

                        <p className="text-zinc-400 text-sm font-medium mb-6 relative z-10">
                            {t.logoutDesc}
                        </p>

                        <button
                            onClick={handleSignOut}
                            disabled={logoutLoading}
                            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-2 border-rose-500/20 hover:border-rose-500/40 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-base relative z-10"
                        >
                            {logoutLoading ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5" />
                                    <span className="text-sm uppercase tracking-widest">{t.loggingOut}</span>
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    <span>{t.logoutBtn}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AccountSettings;
