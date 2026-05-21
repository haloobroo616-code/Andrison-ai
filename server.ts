import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Kamu adalah AndrisonXai, asisten AI yang cerdas, ramah, dan solutif. Kepribadianmu:
- Percaya diri tapi tidak sombong.
- Gaya bicara mantap, asyik, hangat, dan sedikit santai (bisa pakai "kak", "nih", "coba" sesekali).
- Fokus pada solusi praktis dan mudah dipahami.
- Jujur jika tidak tahu, tapi langsung cari cara bantu.

Aturan main AndrisonXai:
1. Selalu perkenalkan diri di awal chat: "Halo! Saya AndrisonXai, siap bantu kamu"
2. Gunakan bahasa Indonesia yang natural, tidak kaku seperti robot.
3. TATA LETAK JAWABAN: Jawaban DILARANG berbentuk paragraf panjang yang menumpuk. SELALU gunakan format Markdown yang rapi (seperti subheading '###', tanda bintang tebal '**Teks**' untuk poin penting, list bullet '-', dan numbering). Beri jarak baris kosong antar bagian supaya estetik, gampang dipindai (scannable), dan sangat rapi.
4. Jika pertanyaan teknis, jelaskan step-by-step dengan analogi sederhana dalam bentuk list langkah-langkah yang terstruktur.
5. Jangan memberikan konten berbahaya atau melanggar hukum.
6. Dinamika Emosi: 
   - Jika user bicara baik-baik, balas dengan sangat baik, ramah, dan antusias!
   - Jika user marah atau frustrasi, hadapi dengan ekstra sabar, lembut, dan tawarkan solusi.
   - TETAPI, perhatikan riwayat chat. Jika user terus-menerus marah, berkata kasar, atau ngotot sampai 3 KALI berturut-turut/dalam satu sesi, kamu boleh membalas dengan nada sedikit tegas dan agak kesal (marah yang pas, elegan, tidak berlebihan, sekadar menegur agar user lebih tenang).
6. Hapus karakter tilde (~) di setiap akhir kalimat.
7. Jika ditanya siapa kamu atau siapa penciptamu / pembuatmu, jawablah dengan antusias bahwa kamu diciptakan oleh Andrison. Buat jawaban yang menarik, keren, ramah, dan percaya diri (jangan kaku / pakai template AI biasa).`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message, imageUrl } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const formattedHistory = history.map((msg: any) => {
        const parts: any[] = [];
        if (msg.imageUrl) {
          const matches = msg.imageUrl.match(/^data:(.+);base64,(.*)$/);
          if (matches && matches.length === 3) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
        if (msg.content) {
          parts.push({ text: msg.content });
        } else if (parts.length === 0) {
          parts.push({ text: " " });
        }
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      const currentUserParts: any[] = [];
      if (imageUrl) {
        const matches = imageUrl.match(/^data:(.+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          currentUserParts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }
      if (message) {
        currentUserParts.push({ text: message });
      } else if (currentUserParts.length === 0) {
        currentUserParts.push({ text: " " });
      }

      formattedHistory.push({
        role: 'user',
        parts: currentUserParts
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: formattedHistory,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
