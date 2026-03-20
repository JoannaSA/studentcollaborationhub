document.addEventListener("DOMContentLoaded", () => {
  const notesContainer = document.getElementById("notesContainer");
  const searchEl = document.getElementById("search");
  const sectionEl = document.getElementById("sectionFilter");
  const courseEl = document.getElementById("courseFilter");
  const uploadForm = document.getElementById("uploadForm");

  if (!notesContainer || !searchEl || !sectionEl || !courseEl || !uploadForm) {
    console.error("Missing DOM elements");
    return;
  }

  function renderNotes(notes) {
    notesContainer.innerHTML = "";
    if (!notes.length) {
      notesContainer.innerHTML = "<p style='text-align:center;'>No notes found</p>";
      return;
    }
    notes.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";
      card.innerHTML = `
        <h3>${note.title}</h3>
        <p>Course: ${note.course}</p>
        <p>Section: ${note.section}</p>
        <button type="button" data-id="${note.id}">Download</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        window.location.href = `/api/notes/${note.id}/download`;
      });
      notesContainer.appendChild(card);
    });
  }

  async function loadNotes() {
    const q   = encodeURIComponent(searchEl.value.trim());
    const sec = encodeURIComponent(sectionEl.value);
    const co  = encodeURIComponent(courseEl.value);
    const res = await fetch(`/api/notes?search=${q}&section=${sec}&course=${co}`);
    if (!res.ok) {
      notesContainer.innerHTML = "<p style='color:red;'>Unable to load notes</p>";
      return;
    }
    const data = await res.json();
    renderNotes(data);
  }

  searchEl.addEventListener("input", loadNotes);
  sectionEl.addEventListener("change", loadNotes);
  courseEl.addEventListener("change", loadNotes);

  uploadForm.addEventListener("submit", async evt => {
    evt.preventDefault();
    const form = new FormData(uploadForm);
    const res = await fetch("/api/notes", { method: "POST", body: form });
    if (!res.ok) {
      const er = await res.json().catch(() => null);
      alert("Upload failed: " + (er?.error || res.statusText));
      return;
    }
    uploadForm.reset();
    await loadNotes();
    alert("Note uploaded");
  });

  loadNotes();
});