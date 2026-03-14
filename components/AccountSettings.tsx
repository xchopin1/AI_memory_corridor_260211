import React, { useState } from 'react';
import {
    Zap, Settings, Mail, Lock, LogOut, AlertCircle, Loader2, CheckCircle2,
    Languages, ArrowLeft, Eye, EyeOff, KeyRound, Shield, User as UserIcon, Send,
    Plus, Trash2, Play, ChevronUp, ChevronDown, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAIConfig } from '../contexts/AIConfigContext';
import { Language, AIProvider } from '../types';
import AuraBackground from './AuraBackground';
import logoImg from '../picture/logo.jpg';

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
        aiConfigSection: "AI Core Configuration",
        aiConfigDesc: "Customize your personal AI processing nodes and fallback chains.",
        addKey: "Initialize New Node",
        keyName: "Node Identifier (e.g. My OpenAI)",
        keyProvider: "Service Provider",
        apiKey: "API Access Token",
        testKey: "Test Link",
        testing: "Synchronizing...",
        testSuccess: "Neural link established!",
        testFail: "Connection timeout/invalid.",
        activeNode: "Active Node",
        priority: "Priority",
        fallbackTitle: "System Redundancy",
        fallbackDesc: "Automatically reroute to system-default Gemini (1.5 Flash) if all custom nodes fail.",
        noKeys: "No custom AI nodes deployed.",
        deleteConfirm: "Decommission this node?",
        statusTesting: "Syncing...",
        statusSuccess: "Connection established",
        statusFailed: "Neural link failed",
        testBtnTooltip: "Test node connectivity",
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
        aiConfigSection: "AI 核心配置",
        aiConfigDesc: "自定义您的个人 AI 处理节点和回退链。",
        addKey: "初始化新节点",
        keyName: "节点标识 (例如: 我的 OpenAI)",
        keyProvider: "服务提供商",
        apiKey: "API 访问令牌",
        testKey: "测试链接",
        testing: "正在同步...",
        testSuccess: "神经链路已建立！",
        testFail: "连接超时或无效。",
        activeNode: "活跃节点",
        priority: "优先级",
        fallbackTitle: "系统冗余",
        fallbackDesc: "如果所有自定义节点均失效，自动切换至系统默认的 Gemini (1.5 Flash)。",
        noKeys: "尚未部署自定义 AI 节点。",
        deleteConfirm: "停用并移除此节点？",
        statusTesting: "正在同步...",
        statusSuccess: "神经链路已建立",
        statusFailed: "链路连接失败",
        testBtnTooltip: "测试节点连通性",
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

    // AI Configuration State
    const { settings, addKey, removeKey, updateKey, setSelectedKey, setFallbackStrategy, testKey, setKeyPriority } = useAIConfig();
    const [isAddingKey, setIsAddingKey] = useState(false);
    const [newKey, setNewKey] = useState({ name: '', provider: 'openai' as AIProvider, apiKey: '' });
    const [testResults, setTestResults] = useState<Record<string, 'loading' | 'success' | 'fail' | null>>({});

    const handleAddKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey.name || !newKey.apiKey) return;
        addKey({
            name: newKey.name,
            provider: newKey.provider,
            apiKey: newKey.apiKey,
        });
        setNewKey({ name: '', provider: 'openai', apiKey: '' });
        setIsAddingKey(false);
    };

    const handleTestKey = async (id: string) => {
        setTestResults(prev => ({ ...prev, [id]: 'loading' }));
        const result = await testKey(id);
        setTestResults(prev => ({ ...prev, [id]: result.success ? 'success' : 'fail' }));
        setTimeout(() => {
            setTestResults(prev => ({ ...prev, [id]: null }));
        }, 3000);
    };

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
                        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform flex items-center justify-center shrink-0">
                            <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
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

                    {/* AI Configuration Section */}
                    <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-[100px]" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <Zap className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-white uppercase">
                                        {t.aiConfigSection}
                                    </h3>
                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{t.aiConfigDesc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Fallback Switch */}
                        <div className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-white/5 mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white uppercase tracking-tight">{t.fallbackTitle}</div>
                                    <div className="text-[10px] text-zinc-500 font-medium">{t.fallbackDesc}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setFallbackStrategy(!settings.useDefaultFallback)}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.useDefaultFallback ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.useDefaultFallback ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Keys List */}
                        <div className="space-y-4 mb-8 relative z-10">
                            {settings.customKeys.length === 0 && !isAddingKey && (
                                <div className="text-center py-10 bg-zinc-950/30 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">{t.noKeys}</p>
                                </div>
                            )}

                            {[...settings.customKeys].sort((a,b) => a.priority - b.priority).map((key) => (
                                <div 
                                    key={key.id} 
                                    className={`p-5 rounded-2xl border transition-all ${settings.selectedKeyId === key.id ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-zinc-950/50 border-white/5'}`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                                key.provider === 'openai' ? 'bg-emerald-500/20 text-emerald-400' :
                                                key.provider === 'gemini' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-purple-500/20 text-purple-400'
                                            }`}>
                                                {key.provider}
                                            </div>
                                            <div className="text-sm font-black text-white">{key.name}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                                        testResults[key.id] === 'success' ? 'text-emerald-400' :
                                                        testResults[key.id] === 'fail' ? 'text-rose-400' :
                                                        testResults[key.id] === 'loading' ? 'text-indigo-400' :
                                                        'text-zinc-600'
                                                    }`}>
                                                        {testResults[key.id] === 'success' ? t.statusSuccess :
                                                         testResults[key.id] === 'fail' ? t.statusFailed :
                                                         testResults[key.id] === 'loading' ? t.statusTesting :
                                                         t.testBtnTooltip}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleTestKey(key.id)}
                                                        disabled={testResults[key.id] === 'loading'}
                                                        title={t.testBtnTooltip}
                                                        className={`p-2 rounded-lg transition-all ${
                                                            testResults[key.id] === 'success' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' :
                                                            testResults[key.id] === 'fail' ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.2)]' :
                                                            'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                                        }`}
                                                    >
                                                        {testResults[key.id] === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { if(confirm(t.deleteConfirm)) removeKey(key.id); }}
                                                className="p-2 bg-zinc-800/50 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="text-[10px] text-zinc-600 font-mono flex-1 truncate bg-black/40 px-3 py-2.5 rounded-lg border border-white/5">
                                            {key.apiKey.substring(0, 8)}••••••••{key.apiKey.slice(-4)}
                                        </div>
                                        <button 
                                            onClick={() => setSelectedKey(key.id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                settings.selectedKeyId === key.id 
                                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                                            }`}
                                        >
                                            {settings.selectedKeyId === key.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current opacity-30" />}
                                            {t.activeNode}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Key Form Toggle */}
                        {!isAddingKey ? (
                            <button 
                                onClick={() => setIsAddingKey(true)}
                                className="w-full py-4 border-2 border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-zinc-500 hover:text-indigo-400 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest relative z-10"
                            >
                                <Plus className="w-4 h-4" />
                                {t.addKey}
                            </button>
                        ) : (
                            <form onSubmit={handleAddKey} className="p-6 bg-zinc-950/80 border border-indigo-500/30 rounded-2xl space-y-4 relative z-10 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{t.keyName}</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={newKey.name}
                                            onChange={e => setNewKey({...newKey, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold text-white transition-all"
                                            placeholder="MemoryNode-01"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{t.keyProvider}</label>
                                        <select 
                                            value={newKey.provider}
                                            onChange={e => setNewKey({...newKey, provider: e.target.value as AIProvider})}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold text-white transition-all appearance-none"
                                        >
                                            <option value="openai">OpenAI (GPT-4o)</option>
                                            <option value="gemini">Google Gemini</option>
                                            <option value="deepseek">Deepseek</option>
                                            <option value="kimi">Moonshot Kimi</option>
                                            <option value="grok">xAI Grok</option>
                                            <option value="claude">Anthropic Claude</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{t.apiKey}</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={newKey.apiKey}
                                        onChange={e => setNewKey({...newKey, apiKey: e.target.value})}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold text-white transition-all"
                                        placeholder="sk-••••••••••••••••"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                    >
                                        {t.addKey}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddingKey(false)}
                                        className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                    >
                                        {t.back}
                                    </button>
                                </div>
                            </form>
                        )}
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
