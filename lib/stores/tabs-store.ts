import { create } from 'zustand';

const tabOrder = [
    'story-theme',
    'research',
    'outline',
    'write',
    'enhance',
    'script',
    'shotlist',
    'subjects',
    'styles',
    'prompts',
    'images',
    'musiclab',
    'developer',
];

type TabsStore = {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    goNext: () => void;
    goBack: () => void;
};

export const useTabsStore = create<TabsStore>((set, get) => ({
    activeTab: 'story-theme',
    setActiveTab: (tab) => set({ activeTab: tab }),
    goNext: () => {
        const current = get().activeTab;
        const index = tabOrder.indexOf(current);
        const next = tabOrder[index + 1];
        if (next) set({ activeTab: next });
    },
    goBack: () => {
        const current = get().activeTab;
        const index = tabOrder.indexOf(current);
        const prev = tabOrder[index - 1];
        if (prev) set({ activeTab: prev });
    },
}));
