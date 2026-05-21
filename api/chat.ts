import { handleChatRequest } from "../src/lib/geminiHandler";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const response = await handleChatRequest(req.body);
    res.status(200).json(response);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
}
