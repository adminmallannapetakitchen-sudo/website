import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavouritesState {
  ids: string[] // menuItemId list
  toggle: (id: string) => void
  has: (id: string) => boolean
}

/** Saved dishes, kept in localStorage so regulars can re-find them fast. */
export const useFavourites = create<FavouritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'mk-favourites' },
  ),
)
