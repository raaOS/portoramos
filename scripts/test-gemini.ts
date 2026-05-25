import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;
console.log('Key length:', API_KEY?.length);

const genAI = new GoogleGenerativeAI(API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function test() {
  try {
    const result = await geminiModel.generateContent('hello');
    console.log('Success:', await result.response.text());
  } catch (e: any) {
    console.error('Error:', e.message || e);
  }
}
test();
