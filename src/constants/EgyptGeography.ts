/**
 * Egypt governorates and cities - shared across onboarding and profile edit.
 * 27 governorates. Markaz (district) seats and major cities as selectable locations.
 * Source: Wikipedia - Governorates of Egypt, List of cities and towns in Egypt; Statoids.
 */
export const EGYPT_GEOGRAPHY: Record<string, string[]> = {
  "Alexandria": [
    "Alexandria", "Borg El Arab", "Dekhela", "Montaza", "Amreya", "Karmoz",
    "Muharam Bek", "Raml 1", "Raml 2", "Attareen", "Bab Sharq", "Gomrok",
    "Labban", "Mansheya", "Port al-Basal", "Sidi Jabir", "New Borg El Arab",
  ],
  "Aswan": [
    "Aswan", "Abu Simbel", "Daraw", "Edfu", "Kom Ombo", "Nasr", "New Aswan",
  ],
  "Asyut": [
    "Asyut", "Abnub", "Abu Tig", "Badari", "Dairut", "Fath", "Ghanayem",
    "Manfalut", "Qusiya", "Sahil Salim", "Sidfa", "New Asyut",
  ],
  "Beheira": [
    "Damanhur", "Abu El Matamir", "Abu Hummus", "Delengat", "Edku", "Hawsh Essa",
    "Itay El Barud", "Kafr El Dawwar", "Kom Hamada", "Mahmoudiya", "Rahmaniya",
    "Rosetta", "Shubra Khit", "Wadi El Natrun", "Badr", "West Nubariya",
  ],
  "Beni Suef": [
    "Beni Suef", "Fashn", "Biba", "Ihnasiya", "Nasir Bush", "Sumusta El Waqf",
    "Wasta", "New Beni Suef",
  ],
  "Cairo": [
    "Cairo", "Abdeen", "Ain Shams", "Basatin", "Darb El Ahmar", "Dawahy",
    "Gamaliya", "Heliopolis", "Helwan", "Khalifa", "Maadi", "Marg", "Matareya",
    "Muski", "Nasr City", "Nozha", "Sharabiya", "Sayeda Zeinab", "Shorouk",
    "Zamalek", "Zeitoun", "Zawya El Hamra", "New Cairo", "15th of May", "Badr",
  ],
  "Dakahlia": [
    "Mansoura", "Belqas", "Dekernes", "Manzala", "Mit Ghamr", "Senbellawein",
    "Sherbin", "Talkha", "Bani Ebeid", "Matareya", "Minyet El Nasr", "Nabaruh",
    "Timay El Imdid",
  ],
  "Damietta": [
    "Damietta", "Faraskur", "Kafr Saad", "Ras El Bar", "New Damietta", "Zarqa",
  ],
  "Faiyum": [
    "Faiyum", "Ibsheway", "Itsa", "Sinnuris", "Tamiya", "Yousef El Seddik",
    "New Faiyum",
  ],
  "Gharbia": [
    "Tanta", "Basyoun", "Kafr El Zayat", "Mahalla El Kubra", "Qutur", "Santa",
    "Samanoud", "Zefta",
  ],
  "Giza": [
    "Giza", "6th of October", "Sheikh Zayed", "Ayyat", "Badrashein", "Hawamdiya",
    "Imbaba", "Kerdasa", "Pyramids", "Warraq", "Wahat El Bahariya", "Awsim",
    "Atfih",
  ],
  "Ismailia": [
    "Ismailia", "Fayed", "Qantara", "Qantara Sharqiya", "Tell El Kebir",
  ],
  "Kafr El Sheikh": [
    "Kafr El Sheikh", "Burullus", "Desouk", "Hamool", "Riyad", "Biyala",
    "Fuwa", "Qallin", "Sidi Salem", "Metoubes",
  ],
  "Luxor": [
    "Luxor", "Armant", "Esna",
  ],
  "Matrouh": [
    "Marsa Matrouh", "Dabaa", "Hamam", "Salum", "Sidi Barrani", "Siwa",
    "North Coast", "El Alamein",
  ],
  "Minya": [
    "Minya", "Abu Qurqas", "Beni Mazar", "Deir Mawas", "Idwa", "Maghagha",
    "Mallawi", "Matay", "Samalut", "New Minya",
  ],
  "Monufia": [
    "Shibin El Kom", "Ashmoun", "Bagour", "Birket El Sab", "Menouf", "Quesna",
    "Shohada", "Sers El Lyan", "Tala", "Sadat City",
  ],
  "New Valley": [
    "Kharga", "Baris", "Dakhla", "Farafra",
  ],
  "North Sinai": [
    "Arish", "Bir El Abd", "Hassana", "Nakhl", "Rafah", "Sheikh Zuweid",
  ],
  "Port Said": [
    "Port Said", "Port Fuad",
  ],
  "Qalyubia": [
    "Banha", "Khanka", "Khusus", "Qanater El Khayreya", "Qalyub", "Shibin El Qanatir",
    "Shubra El Kheima", "Tukh", "Obour", "Qaha", "Kafr Shukr",
  ],
  "Qena": [
    "Qena", "Abu Tesht", "Dishna", "Farshut", "Nag Hammadi", "Naqada", "Qift",
    "Qus", "New Qena",
  ],
  "Red Sea": [
    "Hurghada", "El Qoseir", "Marsa Alam", "Ras Gharib", "Safaga", "Shalateen",
  ],
  "Sharqia": [
    "Zagazig", "Abu Hammad", "Abu Kebir", "Bilbeis", "Diyarb Negm", "Faqous",
    "Hihya", "Husseiniya", "Ibrahimiya", "Kafr Saqr", "Mashtool El Souk",
    "Minya El Qamh", "Qanayat", "Qurein", "10th of Ramadan", "New Salhia",
  ],
  "Sohag": [
    "Sohag", "Akhmim", "Balyana", "Dar El Salam", "Girga", "Juhayna", "Maragha",
    "Mansha", "Saqultah", "Tahta", "Tima", "Usayrat", "New Sohag", "New Akhmim",
  ],
  "South Sinai": [
    "El Tor", "Abu Zenima", "Dahab", "Nuweiba", "Ras Sidr", "Saint Catherine",
    "Sharm El Sheikh", "Taba", "Abu Radis",
  ],
  "Suez": [
    "Suez", "Ataka", "Faisal", "Arbain",
  ],
};
