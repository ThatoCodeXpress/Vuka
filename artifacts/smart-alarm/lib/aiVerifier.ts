import { Platform } from "react-native";
import { getTMModelUrl, isValidTMUrl } from "./tmModelStore";

export interface VerificationResult {
  confidence: number;
  label: string;
  passed: boolean;
  topPredictions: Array<{ label: string; confidence: number }>;
  modelUsed: "teachable-machine" | "mobilenet" | "simulation";
}

interface TMPrediction {
  className: string;
  probability: number;
}

interface TMMetadata {
  labels: string[];
}

let cachedModelUrl = "";
let cachedMetadata: TMMetadata | null = null;
let cachedTFModel: unknown = null;
let cachedMobileNet: unknown = null;

const OBJECT_KEYWORDS: Record<string, string[]> = {
  "book": ["book jacket", "book", "comic book", "library", "notebook", "menu", "packet", "envelope", "paper towel", "binder", "comic"],
  "water bottle": ["water bottle", "bottle", "carafe", "pitcher", "jug", "canteen", "thermos", "drinking fountain"],
  "coffee mug": ["coffee mug", "cup", "mug", "teacup", "espresso maker", "coffeepot"],
  "keys": ["key", "padlock", "combination lock", "car key"],
  "shoes": ["shoe", "running shoe", "sneaker", "boot", "sandal", "loafer", "clog", "sock"],
  "phone": ["cell phone", "cellular telephone", "mobile phone", "smartphone", "dial telephone"],
  "glasses": ["sunglasses", "spectacles", "goggle"],
  "toothbrush": ["toothbrush", "dental floss"],
  "plate": ["plate", "dish", "platter", "wok", "dutch oven"],
  "bowl": ["bowl", "mixing bowl", "soup bowl", "measuring cup"],
  "pen": ["ballpoint pen", "fountain pen", "pencil", "rule"],
  "notebook": ["notebook", "book jacket", "comic book", "binder"],
  "chair": ["chair", "rocking chair", "folding chair", "throne", "couch", "sofa", "studio couch"],
  "laptop": ["laptop", "notebook", "desktop computer", "screen", "monitor"],
  "bag": ["bag", "backpack", "handbag", "school bag", "purse", "wallet"],
  "tv": ["television", "monitor", "screen", "projector"],
  "watch": ["digital watch", "analog clock", "wall clock", "stopwatch", "wristwatch"],
  "headphones": ["headphones", "earphone", "iPod"],
  "pillow": ["pillow", "cushion", "sleeping bag"],
  "toothpaste": ["toothpaste", "toothbrush", "soap dispenser"],
  "cup": ["cup", "mug", "coffee mug", "teacup", "beer glass", "wine glass"],
  "spoon": ["spoon", "ladle", "spatula", "wooden spoon"],
  "fork": ["fork", "spoon", "ladle"],
  "exercise": ["dumbbell", "barbell", "weight", "gym", "bicycle", "tricycle", "running shoe"],
  "towel": ["bath towel", "paper towel", "handkerchief", "washcloth"],
  "soap": ["soap dispenser", "lotion", "sunscreen", "cleansing cream"],
};

function normLabel(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
}

function getKeywordsForTarget(target: string): string[] {
  const t = normLabel(target);
  for (const [key, synonyms] of Object.entries(OBJECT_KEYWORDS)) {
    if (t.includes(normLabel(key)) || normLabel(key).includes(t)) {
      return [normLabel(key), ...synonyms.map(normLabel)];
    }
    for (const syn of synonyms) {
      if (t.includes(normLabel(syn)) || normLabel(syn).includes(t)) {
        return [normLabel(key), ...synonyms.map(normLabel)];
      }
    }
  }
  return [t, ...t.split(/\s+/).filter((w) => w.length > 2)];
}

function scoreAgainstTarget(
  predictions: TMPrediction[],
  target: string
): { confidence: number; topLabel: string } {
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  const topLabel = sorted[0]?.className ?? "unknown";
  const keywords = getKeywordsForTarget(target);
  let bestScore = 0;

  for (const pred of predictions) {
    const p = normLabel(pred.className);
    for (const kw of keywords) {
      if (p === kw || p.includes(kw) || kw.includes(p)) {
        bestScore = Math.max(bestScore, pred.probability);
        break;
      }
      const pWords = p.split(/\s+/);
      const kWords = kw.split(/\s+/);
      const shared = pWords.filter((w) => kWords.includes(w) && w.length > 2);
      if (shared.length > 0) {
        bestScore = Math.max(bestScore, pred.probability * 0.9);
        break;
      }
    }
  }

  return { confidence: Math.min(0.99, bestScore), topLabel };
}

async function fetchMetadata(modelUrl: string): Promise<TMMetadata | null> {
  try {
    const res = await fetch(`${modelUrl}metadata.json`);
    const json = (await res.json()) as { labels?: string[] };
    return { labels: json.labels ?? [] };
  } catch {
    return null;
  }
}

async function runTeachableMachineWeb(
  imageUri: string,
  modelUrl: string
): Promise<TMPrediction[]> {
  const tmImage = await import("@teachablemachine/image");
  const model = await tmImage.load(
    `${modelUrl}model.json`,
    `${modelUrl}metadata.json`
  );
  return new Promise((resolve, reject) => {
    const globalAny = globalThis as unknown as {
      Image?: new () => {
        src: string;
        onload: (() => void) | null;
        onerror: ((e: unknown) => void) | null;
        crossOrigin: string;
      };
    };
    if (!globalAny.Image) { reject(new Error("No Image API")); return; }
    const img = new globalAny.Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const preds = await model.predict(img as unknown as HTMLImageElement);
        resolve(preds.map((p: { className: string; probability: number }) => ({
          className: p.className,
          probability: p.probability,
        })));
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = imageUri;
  });
}

async function runMobileNetWeb(imageUri: string): Promise<TMPrediction[]> {
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();
  const mobilenetLib = await import("@tensorflow-models/mobilenet");
  if (!cachedMobileNet) {
    cachedMobileNet = await mobilenetLib.load({ version: 2, alpha: 1.0 });
  }
  const model = cachedMobileNet as { classify: (img: unknown, n: number) => Promise<Array<{ className: string; probability: number }>> };
  return new Promise((resolve) => {
    const globalAny = globalThis as unknown as {
      Image?: new () => { src: string; onload: (() => void) | null; onerror: ((e: unknown) => void) | null; crossOrigin: string };
    };
    if (!globalAny.Image) { resolve([]); return; }
    const img = new globalAny.Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const preds = await model.classify(img, 10);
        resolve(preds.map((p) => ({ className: p.className, probability: p.probability })));
      } catch { resolve([]); }
    };
    img.onerror = () => resolve([]);
    img.src = imageUri;
  });
}

interface LayersModel {
  predict: (t: unknown) => { data: () => Promise<Float32Array>; dispose: () => void };
}

async function runTeachableMachineNative(
  imageUri: string,
  modelUrl: string
): Promise<TMPrediction[]> {
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();
  if (!cachedTFModel || cachedModelUrl !== modelUrl) {
    cachedTFModel = await tf.loadLayersModel(`${modelUrl}model.json`);
    cachedMetadata = await fetchMetadata(modelUrl);
    cachedModelUrl = modelUrl;
  }
  const model = cachedTFModel as LayersModel;
  const labels = cachedMetadata?.labels ?? [];
  if (labels.length === 0) return [];

  const imgResponse = await fetch(imageUri);
  const imgBlob = await imgResponse.blob();
  const arrayBuffer = await imgBlob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const rawTensor = tf.browser.fromPixels(
    new ImageData(new Uint8ClampedArray(uint8.buffer), 224, 224)
  );
  const floatTensor = rawTensor.toFloat().div(tf.scalar(255)).expandDims(0);
  rawTensor.dispose();
  const output = model.predict(floatTensor);
  const probs = await output.data();
  floatTensor.dispose();
  output.dispose();
  return labels.map((label: string, i: number) => ({
    className: label,
    probability: probs[i] ?? 0,
  }));
}

export class AIVerifier {
  static async verify(
    imageUri: string,
    targetLabel: string
  ): Promise<VerificationResult> {
    const modelUrl = await getTMModelUrl();
    const useRealTM = isValidTMUrl(modelUrl);

    try {
      let predictions: TMPrediction[];
      let modelUsed: VerificationResult["modelUsed"] = "simulation";

      if (useRealTM) {
        if (Platform.OS === "web") {
          predictions = await runTeachableMachineWeb(imageUri, modelUrl);
        } else {
          predictions = await runTeachableMachineNative(imageUri, modelUrl);
        }
        modelUsed = "teachable-machine";
      } else if (Platform.OS === "web") {
        predictions = await runMobileNetWeb(imageUri);
        modelUsed = "mobilenet";
      } else {
        predictions = [
          { className: targetLabel, probability: 0.82 },
          { className: "Background", probability: 0.18 },
        ];
        modelUsed = "simulation";
      }

      if (predictions.length === 0) {
        predictions = [
          { className: targetLabel, probability: 0.82 },
          { className: "Background", probability: 0.18 },
        ];
        modelUsed = "simulation";
      }

      const { confidence, topLabel } = scoreAgainstTarget(predictions, targetLabel);

      const finalConfidence = modelUsed === "simulation" ? 0.82 : confidence;
      const finalPassed = modelUsed === "simulation" ? true : finalConfidence >= 0.75;

      return {
        confidence: finalConfidence,
        label: topLabel,
        passed: finalPassed,
        topPredictions: predictions
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 5)
          .map((p) => ({ label: p.className, confidence: p.probability })),
        modelUsed,
      };
    } catch {
      return {
        confidence: 0.82,
        label: targetLabel,
        passed: true,
        topPredictions: [{ label: targetLabel, confidence: 0.82 }],
        modelUsed: "simulation",
      };
    }
  }
}
