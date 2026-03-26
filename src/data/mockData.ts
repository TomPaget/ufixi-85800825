export interface Issue {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "active" | "in_progress" | "resolved";
  urgency: "ignore" | "fix_soon" | "fix_now";
  severity: number;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  location: string;
  mediaUrl?: string;
  costs?: { diyMin: number; diyMax: number; proMin: number; proMax: number };
  causes?: string[];
  diySteps?: string[];
  productsNeeded?: { name: string; searchTerm: string }[];
  safetyWarnings?: string[];
  whenToCallPro?: string;
}

export const MOCK_ISSUES: Issue[] = [
  {
    id: "1",
    title: "Leaking Kitchen Tap Cartridge",
    description: "The kitchen mixer tap is dripping consistently from the spout when turned off. Likely a worn ceramic disc cartridge.",
    date: "Mar 22, 2026",
    status: "active",
    urgency: "fix_soon",
    severity: 6,
    priority: "medium",
    category: "Plumbing",
    location: "Kitchen",
    costs: { diyMin: 8, diyMax: 25, proMin: 80, proMax: 150 },
    causes: ["Worn ceramic disc cartridge", "Damaged O-ring seal", "Limescale buildup in valve"],
    diySteps: [
      "Turn off water supply under the sink",
      "Remove tap handle (usually a small grub screw under the cap)",
      "Unscrew the cartridge retaining nut",
      "Remove old cartridge and take to hardware store for matching replacement",
      "Insert new cartridge and reassemble",
    ],
    productsNeeded: [
      { name: "Replacement Tap Cartridge", searchTerm: "kitchen+tap+ceramic+cartridge" },
      { name: "Adjustable Wrench Set", searchTerm: "adjustable+wrench+plumbing" },
    ],
    safetyWarnings: ["Always turn off water supply before disassembly"],
    whenToCallPro: "If the tap body itself is corroded or cracked, a full replacement may be needed.",
  },
  {
    id: "2",
    title: "Damp Patch on Bedroom Wall",
    description: "A growing damp patch on the north-facing bedroom wall, approximately 50cm diameter. No visible external damage.",
    date: "Mar 18, 2026",
    status: "in_progress",
    urgency: "fix_now",
    severity: 8,
    priority: "high",
    category: "Structural",
    location: "Bedroom",
    costs: { diyMin: 20, diyMax: 60, proMin: 200, proMax: 800 },
    causes: ["Rising damp from failed DPC", "Condensation from poor ventilation", "Penetrating damp from external crack"],
    diySteps: [
      "Improve ventilation — open windows daily or install trickle vents",
      "Check guttering and downpipes outside for blockages",
      "Use a moisture meter to assess severity",
      "Apply anti-mould treatment to affected area",
    ],
    productsNeeded: [
      { name: "Digital Moisture Meter", searchTerm: "digital+moisture+meter+damp" },
      { name: "Anti-Mould Paint", searchTerm: "anti+mould+paint+damp+wall" },
    ],
    safetyWarnings: ["Damp can cause mould growth — wear a mask when cleaning affected areas", "If structural damp is suspected, do not delay professional assessment"],
    whenToCallPro: "If the moisture meter reads above 20%, or if the patch is growing rapidly, call a damp specialist immediately.",
  },
  {
    id: "3",
    title: "Cracked Render on External Wall",
    description: "Hairline crack running diagonally across external render on the front elevation. Approximately 1.5m long.",
    date: "Mar 10, 2026",
    status: "resolved",
    urgency: "ignore",
    severity: 4,
    priority: "low",
    category: "Structural",
    location: "Exterior",
    costs: { diyMin: 15, diyMax: 40, proMin: 150, proMax: 400 },
    causes: ["Thermal expansion and contraction", "Settling of foundations", "Poor original render mix"],
    diySteps: [
      "Clean out the crack with a wire brush",
      "Apply exterior filler or flexible sealant",
      "Sand smooth when dry",
      "Paint over with masonry paint to match",
    ],
    productsNeeded: [
      { name: "Exterior Wall Filler", searchTerm: "exterior+wall+crack+filler" },
      { name: "Masonry Paint", searchTerm: "masonry+paint+exterior" },
    ],
    whenToCallPro: "If the crack is wider than 5mm or appears to be growing, get a structural survey.",
  },
  {
    id: "4",
    title: "Boiler Losing Pressure",
    description: "Combi boiler pressure drops from 1.5 to 0.5 bar within 24 hours. No visible leaks on radiators.",
    date: "Mar 24, 2026",
    status: "active",
    urgency: "fix_now",
    severity: 7,
    priority: "high",
    category: "HVAC",
    location: "Utility Room",
    costs: { diyMin: 0, diyMax: 10, proMin: 100, proMax: 350 },
    causes: ["Leaking pressure relief valve", "Microleaks in pipework", "Faulty expansion vessel"],
    diySteps: [
      "Check the pressure gauge — should read 1-1.5 bar when cold",
      "Top up via the filling loop (silver braided hose under boiler)",
      "Check all visible radiator valves for drips",
      "Look for damp patches along pipe runs",
    ],
    productsNeeded: [
      { name: "Boiler Pressure Gauge", searchTerm: "boiler+pressure+gauge" },
    ],
    safetyWarnings: ["Do not attempt to open the boiler casing — gas work is illegal without Gas Safe certification"],
    whenToCallPro: "If pressure continues to drop after refilling, call a Gas Safe registered engineer.",
  },
];

export interface ForumPostData {
  id: string;
  title: string;
  content: string;
  author: string;
  authorIsTrades: boolean;
  category: string;
  likes: number;
  commentCount: number;
  date: string;
  imageUrl?: string;
}

export const MOCK_FORUM_POSTS: ForumPostData[] = [
  { id: "1", title: "Best way to fix a dripping tap?", content: "My kitchen tap has been dripping for weeks. I've tried tightening the handle but no luck. Any advice?", author: "Sarah M.", authorIsTrades: false, category: "Plumbing", likes: 12, commentCount: 8, date: "Mar 20, 2026" },
  { id: "2", title: "How to deal with condensation on windows", content: "Every morning my bedroom windows are covered in condensation. What's the best solution?", author: "Mike P.", authorIsTrades: false, category: "General", likes: 24, commentCount: 15, date: "Mar 19, 2026" },
  { id: "3", title: "Rewiring a Victorian house — what to expect", content: "We're about to have our 1890s terrace rewired. Here's what I learned from getting quotes and going through the process.", author: "James K.", authorIsTrades: true, category: "Electrical", likes: 45, commentCount: 22, date: "Mar 17, 2026" },
  { id: "4", title: "DIY plastering — is it worth it?", content: "Thinking of trying to plaster a small bedroom myself. Has anyone done this successfully?", author: "Emma R.", authorIsTrades: false, category: "DIY", likes: 8, commentCount: 6, date: "Mar 15, 2026" },
];

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: "normal" | "high" | "urgent";
  actionUrl?: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "Issue Update", message: "Your 'Damp Patch on Bedroom Wall' issue has been updated with new recommendations.", date: "2 hours ago", read: false, priority: "high", actionUrl: "/issue/2" },
  { id: "2", title: "Scan Complete", message: "Your AI scan for 'Boiler Losing Pressure' is ready to view.", date: "5 hours ago", read: false, priority: "urgent", actionUrl: "/issue/4" },
  { id: "3", title: "Forum Reply", message: "Someone replied to your post about dripping taps.", date: "1 day ago", read: true, priority: "normal", actionUrl: "/forum/1" },
  { id: "4", title: "Premium Offer", message: "Get 50% off your first month of Ufixi Premium!", date: "2 days ago", read: true, priority: "normal", actionUrl: "/upgrade" },
];

export interface ContractorData {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  rating: number;
  notes: string;
  isFavorite: boolean;
}

export const MOCK_CONTRACTORS: ContractorData[] = [
  { id: "1", name: "Dave's Plumbing", specialty: "Plumbing", phone: "07700 900123", email: "dave@plumbing.co.uk", rating: 5, notes: "Very reliable, fixed the boiler last year", isFavorite: true },
  { id: "2", name: "Spark Right Electrical", specialty: "Electrical", phone: "07700 900456", email: "info@sparkright.co.uk", rating: 4, notes: "Did the kitchen rewire", isFavorite: false },
  { id: "3", name: "ABC Builders", specialty: "Structural", phone: "07700 900789", email: "abc@builders.co.uk", rating: 3, notes: "", isFavorite: false },
];
