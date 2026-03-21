import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm();

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // For demo purposes we can return parsed form metadata
    // No local file save (Vercel ephemeral filesystem)

    return res.status(200).json({ message: "Upload success (demo)", fields, files });
  } catch (error) {
    console.error("Form parse error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}