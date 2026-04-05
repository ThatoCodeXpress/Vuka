import { Platform } from "react-native";
import { getTMModelUrl, isValidTMUrl } from "./tmModelStore";

export interface VerificationResult {
  confidence: number;
  label: string;
  passed: boolean;
  topPredictions: Array<{ label: string; confidence: number }>;
  modelUsed: "teachable-machine" | "simulation";
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

function normLabel(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
}

function labelMatch(predicted: string, target: string): number {
  const p = normLabel(predicted);
  const t = normLabel(target);
  if (p === t) return 1.0;
  if (p.includes(t) || t.includes(p)) return 0.9;
  const pWords = p.split(/\s+/);
  const tWords = t.split(/\s+/);
  const shared = pWords.filter((w) => tWords.includes(w) && w.length > 2);
  if (shared.length > 0) return 0.7 + shared.length * 0.05;
  return 0;
}

async function fetchMetadata(modelUrl: string): Promise<TMMetadata | null> {
  try {
    const res = await fetch(`${modelUrl}metadata.json`);
    const json = await res.json() as { labels?: string[] };
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
      Image?: new () => { src: string; onload: (() => void) | null; onerror: ((e: unknown) => void) | null; crossOrigin: string };
    };
    if (!globalAny.Image) {
      reject(new Error("No Image API"));
      return;
    }
    const img = new globalAny.Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const predictions = await model.predict(img as unknown as HTMLImageElement);
        resolve(
          predictions.map((p: { className: string; probability: number }) => ({
            className: p.className,
            probability: p.probability,
          }))
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
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

function getSimulatedPredictions(target: string): TMPrediction[] {
  const base = 0.55 + Math.random() * 0.25;
  return [
    { className: target, probability: base },
    { className: "Background", probability: 1 - base },
  ];
}

function scoreAgainstTarget(
  predictions: TMPrediction[],
  target: string
): { confidence: number; topLabel: string } {
  let bestScore = 0;
  let topLabel = predictions[0]?.className ?? "unknown";
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  topLabel = sorted[0]?.className ?? topLabel;
  for (const pred of predictions) {
    const matchScore = labelMatch(pred.className, target);
    if (matchScore > 0) {
      const combined = pred.probability * matchScore;
      bestScore = Math.max(bestScore, combined);
    }
  }
  return { confidence: Math.min(0.99, bestScore), topLabel };
}

export class AIVerifier {
  static async verify(
    imageUri: string,
    targetLabel: string
  ): Promise<VerificationResult> {
    const modelUrl = await getTMModelUrl();
    const useRealModel = isValidTMUrl(modelUrl);

    try {
      let predictions: TMPrediction[];

      if (useRealModel) {
        if (Platform.OS === "web") {
          predictions = await runTeachableMachineWeb(imageUri, modelUrl);
        } else {
          predictions = await runTeachableMachineNative(imageUri, modelUrl);
        }
      } else {
        predictions = getSimulatedPredictions(targetLabel);
      }

      const { confidence, topLabel } = scoreAgainstTarget(predictions, targetLabel);

      return {
        confidence,
        label: topLabel,
        passed: confidence >= 0.75,
        topPredictions: predictions
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 5)
          .map((p) => ({ label: p.className, confidence: p.probability })),
        modelUsed: useRealModel ? "teachable-machine" : "simulation",
      };
    } catch {
      const fallback = getSimulatedPredictions(targetLabel);
      const { confidence, topLabel } = scoreAgainstTarget(fallback, targetLabel);
      return {
        confidence,
        label: topLabel,
        passed: confidence >= 0.75,
        topPredictions: fallback.map((p) => ({ label: p.className, confidence: p.probability })),
        modelUsed: "simulation",
      };
    }
  }
}
