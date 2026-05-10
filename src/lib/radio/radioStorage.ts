import { SavedRadio } from "@/types/radio";

const SAVED_RADIOS_KEY = "antimusic_saved_radios";

export const radioStorage = {
  getSavedRadios(): SavedRadio[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(SAVED_RADIOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRadio(radio: SavedRadio): void {
    if (typeof window === "undefined") return;
    try {
      const list = this.getSavedRadios();
      const filtered = list.filter((r) => r.id !== radio.id);
      const updated = [radio, ...filtered];
      localStorage.setItem(SAVED_RADIOS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save radio configuration:", err);
    }
  },

  removeRadio(radioId: string): void {
    if (typeof window === "undefined") return;
    try {
      const list = this.getSavedRadios();
      const updated = list.filter((r) => r.id !== radioId);
      localStorage.setItem(SAVED_RADIOS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to remove radio configuration:", err);
    }
  },

  isRadioSaved(radioId: string): boolean {
    const list = this.getSavedRadios();
    return list.some((r) => r.id === radioId);
  }
};
