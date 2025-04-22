import { useModelStore } from "@/lib/stores/model-store"
import type { ImageGenerationSettings } from "@/lib/stores/image-generation-store"

// Helper function to check if we're in a preview environment
const isPreviewEnvironment = () => {
  return (
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.NODE_ENV === "development")
  )
}

// Main function to generate an image using Replicate API
export async function generateImage(prompt: string, settings: ImageGenerationSettings): Promise<string[]> {
  const { replicateApiToken, useMockData } = useModelStore.getState()

  // If we're using mock data or in a preview environment, return mock images
  if (useMockData || isPreviewEnvironment()) {
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API delay
    return [`https://replicate.delivery/pbxt/JzRfbQgTkQIjqEWzLGQDNXQIYvnPFV9YGu7YZaFLGZOoHmFC/out-0.png`]
  }

  if (!replicateApiToken) {
    throw new Error("Replicate API token is required. Please add it in the Models tab.")
  }

  try {
    // Create a prediction
    const prediction = await createPrediction(prompt, settings)

    // Wait for the prediction to complete
    const result = await waitForPrediction(prediction.id)

    if (result.status === "succeeded") {
      return result.output
    } else {
      throw new Error(`Image generation failed: ${result.error || "Unknown error"}`)
    }
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}

// Create a prediction using the Replicate API
export async function createPrediction(prompt: string, settings: ImageGenerationSettings) {
  const { replicateApiToken } = useModelStore.getState()

  // Prepare the input for the Replicate API
  const input = {
    prompt,
    aspect_ratio: settings.aspectRatio,
    guidance: settings.guidance,
    num_inference_steps: settings.numInferenceSteps,
    seed: settings.seed !== null ? settings.seed : undefined,
    num_outputs: settings.numOutputs,
    lora_weights: settings.loraWeights || undefined,
  }

  // Make the API call to Replicate
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${replicateApiToken}`,
      // Add Prefer header for synchronous mode if needed
      // "Prefer": "wait=30", // Wait up to 30 seconds for completion
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-dev-lora",
      input,
      // Add webhook support
      // webhook: "https://your-webhook-url.com",
      // webhook_events_filter: ["completed"]
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Replicate API request failed: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return await response.json()
}

// Get a prediction by ID
export async function getPrediction(predictionId: string) {
  const { replicateApiToken } = useModelStore.getState()

  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      Authorization: `Token ${replicateApiToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get prediction: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

// Cancel a prediction by ID
export async function cancelPrediction(predictionId: string) {
  const { replicateApiToken } = useModelStore.getState()

  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Token ${replicateApiToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to cancel prediction: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

// List predictions
export async function listPredictions() {
  const { replicateApiToken } = useModelStore.getState()

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    headers: {
      Authorization: `Token ${replicateApiToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to list predictions: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

// Wait for a prediction to complete by polling
export async function waitForPrediction(predictionId: string, maxAttempts = 60, interval = 1000) {
  let attempts = 0

  while (attempts < maxAttempts) {
    const prediction = await getPrediction(predictionId)

    if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") {
      return prediction
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, interval))
    attempts++
  }

  throw new Error("Prediction timed out")
}

// Function to generate a mock image URL for testing
export function generateMockImageUrl(): string {
  // Generate a random image from Unsplash with a cinematic theme
  const themes = [
    "cinematic",
    "film",
    "movie",
    "scene",
    "camera",
    "director",
    "cinematography",
    "filmmaking",
    "production",
  ]
  const randomTheme = themes[Math.floor(Math.random() * themes.length)]
  const randomId = Math.floor(Math.random() * 1000)

  return `https://source.unsplash.com/random/800x600?${randomTheme}&sig=${randomId}`
}
