import { useSyncExternalStore } from 'react'
import { getPreferences, subscribePreferences } from './preferences.ts'
export function usePreferences() { return useSyncExternalStore(subscribePreferences, getPreferences, getPreferences) }
