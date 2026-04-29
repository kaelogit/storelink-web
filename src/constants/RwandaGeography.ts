/**
 * Rwanda provinces and districts - shared across onboarding and profile edit.
 * 5 divisions: City of Kigali + 4 provinces. 30 districts as selectable locations.
 * Source: Wikipedia - Provinces of Rwanda, Districts of Rwanda.
 */
export const RWANDA_GEOGRAPHY: Record<string, string[]> = {
  "City of Kigali": [
    "Gasabo", "Kicukiro", "Nyarugenge", "Gisozi", "Kimihurura", "Remera",
    "Kacyiru", "Nyamirambo", "Gikondo", "Kanombe", "Kigarama", "Masaka",
  ],
  "Eastern Province": [
    "Rwamagana", "Nyagatare", "Ngoma", "Kirehe", "Kayonza", "Gatsibo", "Bugesera",
  ],
  "Northern Province": [
    "Musanze", "Gicumbi", "Gakenke", "Burera", "Rulindo",
  ],
  "Southern Province": [
    "Huye", "Nyanza", "Muhanga", "Kamonyi", "Ruhango", "Nyamagabe", "Gisagara",
    "Nyaruguru",
  ],
  "Western Province": [
    "Rubavu", "Rusizi", "Karongi", "Nyamasheke", "Nyabihu", "Ngororero", "Rutsiro",
  ],
};
