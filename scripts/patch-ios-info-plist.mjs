#!/usr/bin/env node
/**
 * Patches ios/App/App/Info.plist with all keys required for App Store
 * compliance + AdMob. Idempotent — safe to run on every `npx cap sync`.
 *
 * Run manually: node scripts/patch-ios-info-plist.mjs
 * Auto-runs after `npx cap sync` via the "capacitor:sync:after" hook in
 * capacitor.config.ts.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PLIST_PATH = resolve(process.cwd(), "ios/App/App/Info.plist");

if (!existsSync(PLIST_PATH)) {
  console.log("[patch-info-plist] No iOS project found at", PLIST_PATH, "— skipping.");
  process.exit(0);
}

let plist = readFileSync(PLIST_PATH, "utf8");
let changed = false;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertBeforeRootDictClose(xmlBlock) {
  const match = plist.match(/\n([\t ]*)<\/dict>\s*<\/plist>\s*$/);
  if (!match) {
    console.error("[patch-info-plist] Could not find root </dict></plist> — aborting.");
    process.exit(1);
  }

  const indent = match[1] ?? "";
  const closingIndex = match.index ?? -1;
  plist = plist.slice(0, closingIndex) + `\n${xmlBlock}` + plist.slice(closingIndex);
  changed = true;
  return indent;
}

/**
 * Replaces an existing plist value for a key regardless of whether it is
 * currently a string, boolean, array, or dict. If the key does not exist, it
 * inserts the new block at the end of the root dict.
 */
function setRaw(key, xmlBlock) {
  const escapedKey = escapeRegex(key);
  const existingValuePattern = new RegExp(
    `([\\t ]*)<key>${escapedKey}<\\/key>\\s*(?:<string>[\\s\\S]*?<\\/string>|<true\\s*\\/>|<false\\s*\\/>|<array\\s*\\/>|<dict\\s*\\/>|<array>[\\s\\S]*?<\\/array>|<dict>[\\s\\S]*?<\\/dict>)`,
    "m",
  );

  if (existingValuePattern.test(plist)) {
    const before = plist;
    plist = plist.replace(existingValuePattern, (_, indent = "") => `${indent}${xmlBlock}`);
    if (plist !== before) {
      changed = true;
      console.log(`[patch-info-plist] Set ${key}`);
    } else {
      console.log(`[patch-info-plist] ${key} already up to date.`);
    }
    return;
  }

  insertBeforeRootDictClose(xmlBlock);
  console.log(`[patch-info-plist] Added ${key}`);
}

// --- 1. App Tracking Transparency (refined wording for ATT prompt) ---
const NEW_ATT_DESC =
  "We use this identifier to deliver personalised ads and measure ad performance. You can change this anytime in iOS Settings.";
setRaw(
  "NSUserTrackingUsageDescription",
  `\t<key>NSUserTrackingUsageDescription</key>\n\t<string>${NEW_ATT_DESC}</string>`,
);

// --- 2. Photo library add (saving the diagnosis PDF) ---
setRaw(
  "NSPhotoLibraryAddUsageDescription",
  `\t<key>NSPhotoLibraryAddUsageDescription</key>\n\t<string>Ufixi saves your repair diagnosis report to your photo library when you choose to download it.</string>`,
);

// --- 3. Export compliance: no non-exempt encryption ---
setRaw(
  "ITSAppUsesNonExemptEncryption",
  `\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>`,
);

// --- 4. App Transport Security: enforce HTTPS only ---
setRaw(
  "NSAppTransportSecurity",
  `\t<key>NSAppTransportSecurity</key>\n\t<dict>\n\t\t<key>NSAllowsArbitraryLoads</key>\n\t\t<false/>\n\t</dict>`,
);

// --- 5. AdMob GADApplicationIdentifier ---
setRaw(
  "GADApplicationIdentifier",
  `\t<key>GADApplicationIdentifier</key>\n\t<string>ca-app-pub-9591380465147865~7363598276</string>`,
);

// --- 6. SKAdNetworkItems (AdMob + mediation partners) ---
const SKAD_IDS = [
  "cstr6suwn9", "4fzdc2evr5", "2fnua5tdw4", "ydx93a7ass", "p78axxw29g",
  "v72qych5uu", "ludvb6z3bs", "cp8zw746q7", "3sh42y64q3", "c6k4g5qg8m",
  "s39g8k73mm", "3qy4746246", "3rd42ekr43", "hs6bdukanm", "mlmmfzh3r3",
  "v4nxqhlyqp", "wzmmz9fp6w", "yclnxrl5pm", "t38b2kh725", "7ug5zh24hu",
  "9rd848q2bz", "y5ghdn5j9k", "n6fk4nfna4", "v9wttpbfk9", "n38lu8286q",
  "47vhws6wlr", "kbd757ywx3", "9t245vhmpl", "a2p9lx4jpn", "22mmun2rn5",
  "4468km3ulz", "2u9pt9hc89", "8s468mfl3y", "klf5c3l5u5", "ppxm28t8ap",
  "ecpz2srf59", "uw77j35x4d", "pwa73g5rt2", "578prtvx9j", "4dzt52r2t5",
  "e5fvkxwrpn", "8c4e2ghe7u", "zq492l623r", "3qcr597p9d",
];
const skadXml =
  `\t<key>SKAdNetworkItems</key>\n\t<array>\n` +
  SKAD_IDS.map(
    (id) =>
      `\t\t<dict>\n\t\t\t<key>SKAdNetworkIdentifier</key>\n\t\t\t<string>${id}.skadnetwork</string>\n\t\t</dict>`,
  ).join("\n") +
  `\n\t</array>`;
setRaw("SKAdNetworkItems", skadXml);

if (changed) {
  writeFileSync(PLIST_PATH, plist, "utf8");
  console.log("[patch-info-plist] ✓ Info.plist updated.");
} else {
  console.log("[patch-info-plist] ✓ Info.plist already up to date.");
}
