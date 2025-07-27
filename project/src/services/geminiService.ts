import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedAdContent {
  caption: string;
  hashtags: string[];
  mediaType: 'image' | 'video' | 'both';
  mediaDescription: string;
  mediaStyle?: 'modern' | 'minimalist' | 'vibrant' | 'professional' | 'luxury' | 'fun' | 'aesthetic';
  videoDescription?: string;
  tone?: string;
  platform?: string;
  productCategory?: string;
  generatedMedia?: Array<{
    type: 'image' | 'video';
    url: string;
    description: string;
    duration?: number;
  }>;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  initialize(apiKey: "AIzaSyBWPsUmdRr3dQKzISYQ4tysFhQ63ZOuawA") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateAdContent(prompt: string): Promise<GeneratedAdContent> {
    if (!this.model) {
      throw new Error('Gemini API not initialized. Please provide an API key.');
    }

    const enhancedPrompt = `
      You are an expert Instagram ad creator. Create comprehensive ad content based on this description: "${prompt}"
      
      Generate the following ad content automatically:
      1. A clean, visually appealing image description showing the product from a natural angle, using vibrant or brand-appropriate colors that reflect the product's key features or use case
      2. A catchy ad caption (50-150 words) that focuses on emotional appeal, benefits, or excitement (not just features)
      3. A list of 10-15 trending, platform-optimized hashtags based on the product category
      
      Analyze the input to determine:
      - Product/service type and category
      - Target audience (Gen Z, millennials, professionals, etc.)
      - Tone/style (modern, luxury, fun, aesthetic, professional, etc.)
      - Platform optimization (Instagram focus)
      
      Please respond with a JSON object containing:
      {
        "caption": "An emotionally engaging Instagram caption focusing on benefits and excitement (50-150 words, include relevant emojis)",
        "hashtags": ["array", "of", "10-15", "trending", "platform-optimized", "hashtags", "without", "#"],
        "mediaType": "image",
        "mediaDescription": "Detailed description of a clean, visually appealing product image from natural angle with vibrant/brand-appropriate colors showing key features",
        "mediaStyle": "modern" or "minimalist" or "vibrant" or "professional" or "luxury" or "fun" or "aesthetic",
        "tone": "detected tone from input",
        "platform": "Instagram",
        "productCategory": "detected product category"
      }
      
      Requirements:
      - Caption must be emotionally compelling and benefit-focused
      - Hashtags must be trending and category-specific (tech, beauty, fashion, etc.)
      - Image description must specify natural angles, colors, and key features
      - Style must match the detected tone and target audience
    `;

    try {
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const generatedContent = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!generatedContent.caption || !generatedContent.hashtags || !generatedContent.mediaDescription) {
        throw new Error('Incomplete response from Gemini API');
      }
      
      return {
        caption: generatedContent.caption,
        hashtags: generatedContent.hashtags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`),
        mediaType: 'image',
        mediaDescription: generatedContent.mediaDescription || 'Generated content',
        mediaStyle: generatedContent.mediaStyle || 'modern',
        tone: generatedContent.tone,
        platform: generatedContent.platform || 'Instagram',
        productCategory: generatedContent.productCategory
      };
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate content. Please try again.');
    }
  }
}

export const geminiService = new GeminiService();