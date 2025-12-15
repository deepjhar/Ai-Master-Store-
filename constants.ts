import { Product, Banner } from './types';

export const APP_NAME = "Ai Master";
export const CURRENCY = "INR";

export const CASHFREE_MODE = "sandbox"; // 'sandbox' or 'production'

// Mock Data for fallback when Supabase is not connected
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Ultimate AI Prompt Pack',
    description: 'Over 1000+ carefully crafted prompts for ChatGPT, Midjourney, and Claude. Boost your productivity instantly.',
    price: 999,
    image_url: 'https://picsum.photos/800/600?random=1',
    file_url: 'https://example.com/download/prompt-pack.zip',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Stable Diffusion Model v2.5',
    description: 'Fine-tuned model for photorealistic portraits. Compatible with Automatic1111.',
    price: 2499,
    image_url: 'https://picsum.photos/800/600?random=2',
    file_url: 'https://example.com/download/sd-model.ckpt',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'AI Art Generation Course',
    description: 'Master the art of generative AI with this 10-hour video course. Includes project files.',
    price: 4999,
    image_url: 'https://picsum.photos/800/600?random=3',
    file_url: 'https://example.com/course/access',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Neural Voice Pack',
    description: 'High quality voice clones for TTS applications. Royalty free usage.',
    price: 1499,
    image_url: 'https://picsum.photos/800/600?random=4',
    file_url: 'https://example.com/download/voices.zip',
    created_at: new Date().toISOString(),
  },
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: '1',
    image_url: 'https://picsum.photos/1200/400?random=10',
    title: 'Unleash Creativity',
    active: true,
  },
  {
    id: '2',
    image_url: 'https://picsum.photos/1200/400?random=11',
    title: 'Next Gen Models',
    active: true,
  },
];