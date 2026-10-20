import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authorized Admin list
const ADMIN_EMAILS = [
  'kavikavik999@gmail.com',
  'mrdharanieditormrdharanieditor@gmail.com',
];

// Initialize Gemini SDK with runtime key
const ai = new GoogleGenAI();

// Endpoint: Verify Admin authorization securely on the server
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ isAdmin: false, error: 'Email is required' });
  }

  const normalized = email.trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(normalized);
  return res.json({ isAdmin, email: normalized });
});

// Endpoint: Automatic Daily AI Content Generation
// Generates 2 Tamil-cinema-inspired AI prompt items (one male actor-inspired, one female actor-inspired)
app.post('/api/generate-daily-prompts', async (req: Request, res: Response) => {
  try {
    const { requestedBy } = req.body;
    console.log(`[Daily AI Generation] Triggered by ${requestedBy || 'system/admin'}`);

    // Generate prompt text & metadata via Gemini 3.8 Flash
    const textPrompt = `
You are an expert AI prompt engineer for cinematic photography, Kollywood & South Indian cinema visual aesthetics, and modern photographic art.
Generate exactly TWO high-quality image prompts inspired by Tamil cinema:
1. One featuring a female actor-inspired subject (inspired by actresses like Sai Pallavi, Nayanthara, Trisha, Samantha, or Keerthy Suresh in traditional or modern cinematic attire).
2. One featuring a male actor-inspired subject (inspired by actors like Suriya, Thalapathy Vijay, Dhanush, Sivakarthikeyan, or Karthi in stylish cinematic portraits).

Return ONLY a valid JSON object matching this exact structure:
{
  "femalePrompt": {
    "title": "Short catchy title (under 50 chars)",
    "promptText": "Detailed Midjourney/Flux style prompt description with camera lens, lighting (golden hour, volumetric, anamorphic lens), attire, facial expressions, aesthetic color grading, 8k resolution, cinematic atmosphere",
    "category": "Portrait",
    "description": "Short 1-2 sentence description highlighting the Tamil cinema aesthetic",
    "tags": ["Tamil Cinema", "Kollywood", "Portrait", "Cinematic", "Saree/Modern", "8K"]
  },
  "malePrompt": {
    "title": "Short catchy title (under 50 chars)",
    "promptText": "Detailed Midjourney/Flux style prompt description with dramatic lighting, tailored suit or traditional veshti, intense cinematic gaze, 35mm film grain, rim light, shallow depth of field, 8k resolution",
    "category": "Cinematic",
    "description": "Short 1-2 sentence description highlighting the Tamil cinema aesthetic",
    "tags": ["Tamil Cinema", "Kollywood", "Male Actor", "Cinematic", "Dramatic", "8K"]
  }
}
`;

    const textResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: textPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedData = JSON.parse(textResponse.text || '{}');

    // Attempt image generation for both prompts using gemini-3.1-flash-lite-image
    let femaleImageUrl = '';
    let maleImageUrl = '';

    try {
      if (parsedData.femalePrompt?.promptText) {
        const femaleImgResp = await ai.models.generateImages({
          model: 'gemini-3.1-flash-lite-image',
          prompt: `Cinematic Tamil cinema portrait of a graceful South Indian actress, ${parsedData.femalePrompt.title}, warm ambient lighting, beautiful traditional saree, natural skin texture, masterpiece, photorealistic, 8k`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '3:4',
          },
        });
        const imgBytes = femaleImgResp.generatedImages?.[0]?.image?.imageBytes;
        if (imgBytes) {
          femaleImageUrl = `data:image/jpeg;base64,${imgBytes}`;
        }
      }
    } catch (imgErr) {
      console.warn('Female image generation fallback used:', imgErr);
      // High quality curated fallback image matching Tamil cinema aesthetic
      femaleImageUrl = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80';
    }

    try {
      if (parsedData.malePrompt?.promptText) {
        const maleImgResp = await ai.models.generateImages({
          model: 'gemini-3.1-flash-lite-image',
          prompt: `Cinematic Tamil cinema portrait of a charismatic South Indian male actor, ${parsedData.malePrompt.title}, sharp blazer or silk shirt, dramatic studio rim lighting, photorealistic, high resolution, 8k`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '3:4',
          },
        });
        const imgBytes = maleImgResp.generatedImages?.[0]?.image?.imageBytes;
        if (imgBytes) {
          maleImageUrl = `data:image/jpeg;base64,${imgBytes}`;
        }
      }
    } catch (imgErr) {
      console.warn('Male image generation fallback used:', imgErr);
      maleImageUrl = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80';
    }

    const result = {
      success: true,
      generatedAt: new Date().toISOString(),
      items: [
        {
          ...parsedData.femalePrompt,
          imageUrl: femaleImageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
          isDailyGenerated: true,
          gender: 'female',
        },
        {
          ...parsedData.malePrompt,
          imageUrl: maleImageUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
          isDailyGenerated: true,
          gender: 'male',
        },
      ],
    };

    res.json(result);
  } catch (error: any) {
    console.error('Daily AI generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate daily AI prompts',
    });
  }
});

// Configure dev or production static serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`DN Prompts server running on http://localhost:${PORT}`);
  });
}

setupServer();
