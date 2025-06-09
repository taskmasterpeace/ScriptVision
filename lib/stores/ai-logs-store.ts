"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"
import { storage } from "../db"

export interface AILogEntry {
  id: string
  type: "prompt" | "response"
  content: string
  timestamp: string
  template?: string
  metadata?: Record<string, any>
}

interface AILogsState {
  logs: AILogEntry[]
  addLog: (log: Omit<AILogEntry, "id" | "timestamp">) => void
  clearLogs: () => void
}

export const useAILogsStore = create<AILogsState>()(
  persist(
    (set) => ({
      logs: [],

      addLog: (log) => {
        set((state) => ({
          logs: [
            ...state.logs,
            {
              ...log,
              id: uuidv4(),
              timestamp: new Date().toISOString(),
            },
          ],
        }))
      },

      clearLogs: () => {
        set({ logs: [] })
      },
    }),
    {
      name: "page2prompt-ai-logs",
      storage: createJSONStorage(() => storage)
    },
  ),
)
