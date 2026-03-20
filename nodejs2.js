const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const upload = multer({ dest: path.join(__dirname, "uploads") });

let notes = [
  { id: 1, title: "Crypto Basics", course: "Cryptography", section: "A", file: null },
  { id: 2, title: "C Programming", course: "C Programming", section: "B", file: null },
  { id: 3, title: "Cyber Security Essentials", course: "Cyber Security Essentials", section: "C", file: null }
];

app.get("/api/notes", (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  const section = String(req.query.section || "");
  const course = String(req.query.course || "");
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search) &&
    (!section || n.section === section) &&
    (!course || n.course === course)
  );
  res.json(filtered);
});

app.post("/api/notes", upload.single("file"), (req, res) => {
  const { title, course, section } = req.body;
  if (!title || !course || !section || !req.file) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const id = notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  const note = { id, title, course, section, file: req.file.filename };
  notes.push(note);
  res.status(201).json(note);
});

app.get("/api/notes/:id/download", (req, res) => {
  const note = notes.find(n => n.id === Number(req.params.id));
  if (!note || !note.file) return res.status(404).send("Not found");
  res.download(path.join(__dirname, "uploads", note.file));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));