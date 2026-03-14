
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AISettings, AIKeyConfig, AIProvider } from '../types';

interface AIConfigContextType {
  settings: AISettings;
  addKey: (key: Omit<AIKeyConfig, 'id' | 'priority' | 'isActive'>) => void;
  removeKey: (id: string) => void;
  updateKey: (id: string, updates: Partial<AIKeyConfig>) => void;
  setSelectedKey: (id: string | null) => void;
  setFallbackStrategy: (useDefault: boolean) => void;
  setKeyPriority: (id: string, priority: number) => void;
  testKey: (id: string) => Promise<{ success: boolean; message: string }>;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AISettings = {
  customKeys: [],
  useDefaultFallback: true,
  selectedKeyId: null,
};

const STORAGE_KEY = 'ai_memory_corridor_ai_settings';

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved AI settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const addKey = (keyData: Omit<AIKeyConfig, 'id' | 'priority' | 'isActive'>) => {
    const newKey: AIKeyConfig = {
      ...keyData,
      id: Math.random().toString(36).substr(2, 9),
      priority: settings.customKeys.length,
      isActive: true,
    };
    setSettings(prev => ({
      ...prev,
      customKeys: [...prev.customKeys, newKey]
    }));
  };

  const removeKey = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customKeys: prev.customKeys.filter(k => k.id !== id),
      selectedKeyId: prev.selectedKeyId === id ? null : prev.selectedKeyId
    }));
  };

  const updateKey = (id: string, updates: Partial<AIKeyConfig>) => {
    setSettings(prev => ({
      ...prev,
      customKeys: prev.customKeys.map(k => k.id === id ? { ...k, ...updates } : k)
    }));
  };

  const setSelectedKey = (id: string | null) => {
    setSettings(prev => ({ ...prev, selectedKeyId: id }));
  };

  const setFallbackStrategy = (useDefault: boolean) => {
    setSettings(prev => ({ ...prev, useDefaultFallback: useDefault }));
  };

  const setKeyPriority = (id: string, priority: number) => {
    // Basic priority update logic
    setSettings(prev => {
        const keys = [...prev.customKeys];
        const keyIndex = keys.findIndex(k => k.id === id);
        if (keyIndex === -1) return prev;
        
        keys[keyIndex].priority = priority;
        return {
            ...prev,
            customKeys: keys.sort((a, b) => a.priority - b.priority)
        };
    });
  };

  const testKey = async (id: string): Promise<{ success: boolean; message: string }> => {
    const key = settings.customKeys.find(k => k.id === id);
    if (!key) return { success: false, message: 'Key not found' };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: 'Test connection. Return "OK".', 
          language: 'en',
          userConfig: {
            apiKey: key.apiKey,
            provider: key.provider
          }
        }),
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful!' };
      } else {
        const err = await response.json();
        return { success: false, message: err.error || 'Failed to connect.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Unknown error' };
    }
  };

  return (
    <AIConfigContext.Provider value={{ 
      settings, 
      addKey, 
      removeKey, 
      updateKey, 
      setSelectedKey, 
      setFallbackStrategy, 
      setKeyPriority,
      testKey
    }}>
      {children}
    </AIConfigContext.Provider>
  );
};

export const useAIConfig = () => {
  const context = useContext(AIConfigContext);
  if (context === undefined) {
    throw new Error('useAIConfig must be used within an AIConfigProvider');
  }
  return context;
};
