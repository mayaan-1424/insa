// Gemini-Powered Media Generator Service

import { GoogleGenerativeAI } from '@google/generative-ai'; // Gemini SDK
const genAI = new GoogleGenerativeAI("AIzaSyBWPsUmdRr3dQKzISYQ4tysFhQ63ZOuawA");

export interface MediaGenerationOptions {
  prompt: string;
  type?: 'image' | 'video' | 'all';
  style?: string;
  tone?: string;
  productCategory?: string;
}

export interface GeneratedMedia {
  type: 'image' | 'video';
  url: string;
  description: string;
}

export interface MediaResponse {
  media: GeneratedMedia[];
  hashtags: string[];
}

class MediaGenerator {

  async generateMediaWithGemini(options: MediaGenerationOptions): Promise<MediaResponse> {
    const { prompt, type = 'all', style, tone, productCategory } = options;

    const generationPrompt = `
      Create Instagram ad content based on this:
      - Description: ${prompt}
      - Style: ${style || 'modern'}
      - Tone: ${tone || 'engaging'}
      - Product category: ${productCategory || 'general'}

      You must respond with:
      1. Image prompt: a descriptive image prompt for a product ad.
      2. Video idea: a short scene for a 5-10s Instagram ad video.
      3. Hashtags: a list of 5-10 trending hashtags related to the topic.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(generationPrompt);
    const text = await result.response.text();

    const imagePrompt = this.extractBetween(text, 'Image prompt:', 'Video idea:');
    const videoIdea = this.extractBetween(text, 'Video idea:', 'Hashtags:');
    const hashtagsText = this.extractBetween(text, 'Hashtags:', '');

    const hashtags = hashtagsText.split(/[,#\n]+/).map(tag => tag.trim()).filter(Boolean);

    // Image generation (you can replace this with an actual text-to-image model API call)
    const imageUrl = await this.generateFakeImage(imagePrompt); // Replace with real model if available

    // Video generation (you can use a service like Pika Labs, Sora, or DeepSeek)
    const videoUrl = await this.generateFakeVideo(videoIdea); // Replace with real model if available

    const media: GeneratedMedia[] = [];
    if (type === 'image' || type === 'all') {
      media.push({ type: 'image', url: imageUrl, description: imagePrompt });
    }
    if (type === 'video' || type === 'all') {
      media.push({ type: 'video', url: videoUrl, description: videoIdea });
    }

    return { media, hashtags };
  }

  // Simulate image generation (replace with real API)
  private async generateFakeImage(prompt: string): Promise<string> {
    return `https://dummyimage.com/1080x1080/000/fff.png&text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }

  // Simulate video generation (replace with real API)
  private async generateFakeVideo(idea: string): Promise<string> {
    return `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`;
  }

  // Utility to extract sections
  private extractBetween(text: string, start: string, end: string): string {
    const regex = new RegExp(`${start}(.*?)${end}`, 's');
    const match = text.match(regex);
    return match?.[1]?.trim() || '';
  }
}

export const mediaGenerator = new MediaGenerator();
