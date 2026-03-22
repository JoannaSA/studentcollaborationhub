const INITIAL_NOTES = [
  { id: 1, title: "Crypto Basics", course: "Cryptography", section: "A", file: null },
  { id: 2, title: "C Programming", course: "C Programming", section: "B", file: null },
  { id: 3, title: "Cyber Security Essentials", course: "Cyber Security Essentials", section: "C", file: null }
];

const store = globalThis.__notesStore || {
  uploaded: [],
  nextId: INITIAL_NOTES.length + 1
};
globalThis.__notesStore = store;

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

function setCommonHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getQuery(req) {
  const fromUrl = {};
  const parsedUrl = new URL(req.url || "/api/notes", "http://localhost");
  parsedUrl.searchParams.forEach((value, key) => {
    fromUrl[key] = value;
  });

  if (!req.query || typeof req.query !== "object") {
    return fromUrl;
  }

  return { ...fromUrl, ...req.query };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBase64(data) {
  if (typeof data !== "string") return "";
  const trimmed = data.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") && trimmed.includes(",")) {
    return trimmed.slice(trimmed.indexOf(",") + 1).replace(/\s/g, "");
  }

  return trimmed.replace(/\s/g, "");
}

function readRawBody(req) {
  if (req.readableEnded) {
    return Promise.resolve("");
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", reject);
  });
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.length ? JSON.parse(req.body.toString("utf8")) : {};
  }

  const rawBody = await readRawBody(req);
  if (!rawBody) return {};

  return JSON.parse(rawBody);
}

function toPublicNote(note) {
  return {
    id: note.id,
    title: note.title,
    course: note.course,
    section: note.section,
    file: note.fileName || note.file || null
  };
}

function listNotes(query, res) {
  const search = normalizeText(query.search).toLowerCase();
  const section = normalizeText(query.section);
  const course = normalizeText(query.course);

  const mergedNotes = INITIAL_NOTES.concat(store.uploaded);
  const filtered = mergedNotes.filter((note) => {
    return (
      note.title.toLowerCase().includes(search) &&
      (!section || note.section === section) &&
      (!course || note.course === course)
    );
  });

  sendJson(res, 200, filtered.map(toPublicNote));
}

function downloadNote(query, res) {
  const id = Number(query.download);
  if (!Number.isInteger(id)) {
    return sendJson(res, 400, { error: "Invalid download id" });
  }

  const note = store.uploaded.find((item) => item.id === id);
  if (!note || !note.fileData) {
    return sendJson(res, 404, { error: "File not found" });
  }

  let fileBuffer;
  try {
    fileBuffer = Buffer.from(note.fileData, "base64");
  } catch {
    return sendJson(res, 500, { error: "Stored file is invalid" });
  }

  const fileName = (note.fileName || "note-file").replace(/[^a-zA-Z0-9._ -]/g, "_");
  res.statusCode = 200;
  res.setHeader("Content-Type", note.fileType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Length", String(fileBuffer.length));
  res.end(fileBuffer);
}

function validateBase64Content(base64String) {
  if (!base64String) return false;
  if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) return false;

  try {
    const decoded = Buffer.from(base64String, "base64");
    return decoded.length > 0;
  } catch {
    return false;
  }
}

function createNote(body, res) {
  const title = normalizeText(body.title);
  const course = normalizeText(body.course);
  const section = normalizeText(body.section);
  const fileName = normalizeText(body.fileName);
  const fileType = normalizeText(body.fileType) || "application/octet-stream";
  const fileData = normalizeBase64(body.fileData);

  if (!title || !course || !section || !fileName || !fileData) {
    return sendJson(res, 400, { error: "title, course, section, fileName and fileData are required" });
  }

  if (!validateBase64Content(fileData)) {
    return sendJson(res, 400, { error: "fileData must be valid base64 content" });
  }

  const decodedFile = Buffer.from(fileData, "base64");
  if (decodedFile.length > MAX_FILE_SIZE_BYTES) {
    return sendJson(res, 413, { error: "File too large. Max size is 4 MB." });
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._ -]/g, "_");
  const note = {
    id: store.nextId++,
    title,
    course,
    section,
    fileName: safeFileName,
    fileType,
    fileData
  };

  store.uploaded.push(note);
  return sendJson(res, 201, toPublicNote(note));
}

module.exports = async (req, res) => {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === "GET") {
    const query = getQuery(req);
    if (query.download) {
      return downloadNote(query, res);
    }
    return listNotes(query, res);
  }

  if (req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      return createNote(body, res);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
  }

  res.setHeader("Allow", "GET,POST,OPTIONS");
  return sendJson(res, 405, { error: "Method Not Allowed" });
};
