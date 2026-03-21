const container = document.getElementById("notesContainer");

async function fetchNotes(search = '', section = '', course = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (section) params.append('section', section);
    if (course) params.append('course', course);

    const response = await fetch(`/api/notes?${params}`);
    if (!response.ok) {
        console.error('Failed to fetch notes');
        return [];
    }
    return await response.json();
}

function displayNotes(data) {
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>No notes found</p>";
        return;
    }

    data.forEach(note => {
        const card = document.createElement("div");
        card.className = "note-card";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const course = document.createElement("p");
        course.textContent = "Course: " + note.course;

        const section = document.createElement("p");
        section.textContent = "Section: " + note.section;

        card.appendChild(title);
        card.appendChild(course);
        card.appendChild(section);

        if (note.file) {
            const button = document.createElement("button");
            button.textContent = "Download";
            button.onclick = () => {
                const link = document.createElement('a');
                link.href = `/api/notes/${note.id}/download`;
                link.download = note.file;
                link.click();
            };
            card.appendChild(button);
        }

        container.appendChild(card);
    });
}

// initial load
async function loadNotes() {
    try {
        const data = await fetchNotes();
        displayNotes(data);
    } catch (error) {
        console.error('Failed to load notes', error);
        container.innerHTML = "<p style='text-align:center;'>Failed to load notes</p>";
    }
}

loadNotes();

// filtering
async function filterNotes() {
    const search = document.getElementById("search").value.toLowerCase();
    const section = document.getElementById("sectionFilter").value;
    const course = document.getElementById("courseFilter").value;

    try {
        const data = await fetchNotes(search, section, course);
        displayNotes(data);
    } catch (error) {
        console.error('Failed to filter notes', error);
        container.innerHTML = "<p style='text-align:center;'>Failed to filter notes</p>";
    }
}

// event listeners (safe binding)
document.getElementById("search").addEventListener("input", filterNotes);
document.getElementById("sectionFilter").addEventListener("change", filterNotes);
document.getElementById("courseFilter").addEventListener("change", filterNotes);

// upload form
document.getElementById("uploadForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const course = document.getElementById("course").value;
    const section = document.getElementById("section").value;
    const file = document.getElementById("file").files[0];

    if (!title || !course || !section || !file) {
        alert("Please fill all fields correctly");
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('course', course);
    formData.append('section', section);
    formData.append('file', file);

    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const newNote = await response.json();
            alert("Note uploaded successfully");
            this.reset();
            loadNotes(); // reload notes
        } else {
            const error = await response.json();
            alert("Error: " + error.error);
        }
    } catch (error) {
        console.error('Upload failed', error);
        alert("Upload failed");
    }
});