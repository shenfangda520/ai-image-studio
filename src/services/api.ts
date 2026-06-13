const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface GenerateParams {
  apiKey: string;
  prompt: string;
  model: string;
  size: string;
  images?: { name: string; dataUrl: string }[];
}

export interface GenerateResult {
  images: string[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getErrorMessage(data: any, fallback: string): string {
  const message =
    data?.error?.message ||
    data?.error ||
    data?.message ||
    data?.detail?.error?.message ||
    data?.detail?.message ||
    data?.detail?.detail ||
    data?.detail ||
    fallback;

  return typeof message === 'string' ? message : JSON.stringify(message);
}

function buildContent(prompt: string, images?: { name: string; dataUrl: string }[]): any[] {
  const content: any[] = [{ type: 'text', text: prompt }];

  if (images && images.length > 0) {
    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: { url: img.dataUrl }
      });
    }
  }

  return content;
}

function extractImageUrls(data: any): string[] {
  const images: string[] = [];

  // Strategy 1: data[].b64_json
  if (data?.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      if (item.b64_json) {
        images.push(`data:image/png;base64,${item.b64_json}`);
      } else if (item.url) {
        images.push(item.url);
      } else if (item.image_url) {
        images.push(item.image_url);
      }
    }
  }

  // Strategy 2: choices[].message.content
  if (images.length === 0 && data?.choices) {
    for (const choice of data.choices) {
      const content = choice?.message?.content;
      if (!content) continue;

      // Extract markdown images: ![...](data:image/...)
      const markdownRegex = /!\[[^\]]*\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g;
      let match;
      while ((match = markdownRegex.exec(content)) !== null) {
        images.push(match[1]);
      }

      // Extract markdown images with HTTP URLs
      const httpRegex = /!\[[^\]]*\]\((https?:\/\/[^\)]+)\)/g;
      while ((match = httpRegex.exec(content)) !== null) {
        images.push(match[1]);
      }

      // Extract raw data URLs
      if (images.length === 0) {
        const dataUrlRegex = /(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g;
        while ((match = dataUrlRegex.exec(content)) !== null) {
          images.push(match[1]);
        }
      }

      // Extract raw base64 (assume PNG if no prefix)
      if (images.length === 0 && content.length > 100) {
        const base64Regex = /^([A-Za-z0-9+/=]{100,})$/;
        if (base64Regex.test(content.trim())) {
          images.push(`data:image/png;base64,${content.trim()}`);
        }
      }
    }
  }

  // Strategy 3: image fallback
  if (images.length === 0 && data?.image) {
    images.push(data.image);
  }

  return images;
}

export async function generateImage(
  params: GenerateParams,
  apiUrl: string = DEFAULT_API_URL
): Promise<GenerateResult> {
  const { apiKey, prompt, model, size, images: refImages } = params;

  const requestBody = {
    model,
    messages: [
      {
        role: 'user',
        content: buildContent(prompt, refImages)
      }
    ],
    stream: false,
    ...(size !== 'auto' && { size })
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorBody: unknown = errorText;

    try {
      errorBody = JSON.parse(errorText);
    } catch {
      // keep raw text
    }

    throw new ApiError(
      `API error ${response.status}: ${getErrorMessage(errorBody, errorText || response.statusText)}`,
      response.status,
      errorBody
    );
  }

  const data = await response.json();

  const extractedImages = extractImageUrls(data);

  if (extractedImages.length === 0) {
    throw new Error('No images found in API response');
  }

  return {
    images: extractedImages,
    usage: data?.usage
  };
}
