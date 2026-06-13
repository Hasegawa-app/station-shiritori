export type Station = {
  id: string;
  name: string;
  shortName: string;
  kana: string;
  line?: string;
};

export type JudgeResult =
  | {
      ok: true;
      station: Station;
      nextHead: string;
    }
  | {
      ok: false;
      reason: string;
      lose?: boolean;
    };

const SMALL_KANA_MAP: Record<string, string> = {
  ぁ: "あ",
  ぃ: "い",
  ぅ: "う",
  ぇ: "え",
  ぉ: "お",
  ゃ: "や",
  ゅ: "ゆ",
  ょ: "よ",
  っ: "つ",
  ゎ: "わ",
};

const DAKUTEN_GROUPS: Record<string, string[]> = {
  か: ["か", "が"],
  き: ["き", "ぎ"],
  く: ["く", "ぐ"],
  け: ["け", "げ"],
  こ: ["こ", "ご"],

  さ: ["さ", "ざ"],
  し: ["し", "じ"],
  す: ["す", "ず"],
  せ: ["せ", "ぜ"],
  そ: ["そ", "ぞ"],

  た: ["た", "だ"],
  ち: ["ち", "ぢ"],
  つ: ["つ", "づ"],
  て: ["て", "で"],
  と: ["と", "ど"],

  は: ["は", "ば", "ぱ"],
  ひ: ["ひ", "び", "ぴ"],
  ふ: ["ふ", "ぶ", "ぷ"],
  へ: ["へ", "べ", "ぺ"],
  ほ: ["ほ", "ぼ", "ぽ"],
};

function getAllowedHeads(requiredHead: string | null) {
  if (!requiredHead) return [];

  for (const group of Object.values(DAKUTEN_GROUPS)) {
    if (group.includes(requiredHead)) {
      return group;
    }
  }

  return [requiredHead];
}

export function normalizeKana(input: string) {
  return input
    .trim()
    .replace(/[ァ-ン]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
    .replace(/ー/g, "")
    .replace(/[ぁぃぅぇぉゃゅょっゎ]/g, ch => SMALL_KANA_MAP[ch] ?? ch);
}

export function normalizeStationName(input: string) {
  return input.trim().replace(/駅(\(.+\))?$/, "");
}

export function getFirstKana(kana: string) {
  return normalizeKana(kana).at(0) ?? "";
}

export function removeStationSuffix(kana: string) {
  const normalized = normalizeKana(kana);

  if (normalized.endsWith("えき")) {
    return normalized.slice(0, -2);
  }

  return normalized;
}

export function getLastKana(kana: string) {
  const base = removeStationSuffix(kana);
  return base.at(-1) ?? "";
}

export function judgeStation(params: {
  input: string;
  stations: Station[];
  usedStationIds: string[];
  requiredHead: string | null;
}): JudgeResult {
  const { input, stations, usedStationIds, requiredHead } = params;

  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, reason: "駅名を入力してください" };
  }

  const normalizedName = normalizeStationName(trimmed);
  const normalizedKana = normalizeKana(trimmed);

  const station = stations.find(station => {
    const stationKana = normalizeKana(station.kana);
    const stationKanaWithoutEki = removeStationSuffix(station.kana);

    return (
      station.name === trimmed ||
      station.shortName === normalizedName ||
      stationKana === normalizedKana ||
      stationKanaWithoutEki === normalizedKana
    );
  });

  if (!station) {
    return { ok: false, reason: "駅DBにない駅です" };
  }

  if (usedStationIds.includes(station.id)) {
    return { ok: false, reason: "その駅は使用済みです" };
  }

  const first = getFirstKana(station.kana);
  const allowedHeads = getAllowedHeads(requiredHead);

  if (requiredHead && !allowedHeads.includes(first)) {
    return {
      ok: false,
      reason: `「${allowedHeads.join(" / ")}」から始まる駅を入力してください`,
    };
  }

  const last = getLastKana(station.kana);

  if (last === "ん") {
    return {
      ok: false,
      reason: `「${station.name}」は「ん」で終わるので負けです`,
      lose: true,
    };
  }

  return {
    ok: true,
    station,
    nextHead: last,
  };
}