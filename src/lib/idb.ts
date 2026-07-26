import { get, set, del, createStore } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

const store = createStore('patrimoine-phones-db', 'state')

export const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name, store)) ?? null,
  setItem: async (name, value) => {
    await set(name, value, store)
  },
  removeItem: async (name) => {
    await del(name, store)
  },
}
