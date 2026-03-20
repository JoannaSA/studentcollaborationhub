const notes = [
    { title: "Crypto Basics", course: "Cryptography", section: "A" },
    { title: "Network Attacks", course: "Network Security", section: "B" },
    { title: "Ethical Hacking Intro", course: "Ethical Hacking", section: "C" }
];

const container = document.getElementById("notesContainer");

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

        const button = document.createElement("button");
        button.textContent = "Download";
        button.onclick = () => {
            alert("Download feature will work after backend connection");
        };

        card.appendChild(title);
        card.appendChild(course);
        card.appendChild(section);
        card.appendChild(button);

        container.appendChild(card);
    });
}

// initial load
displayNotes(notes);

// filtering
function filterNotes() {
    const search = document.getElementById("search").value.toLowerCase();
    const section = document.getElementById("sectionFilter").value;
    const course = document.getElementById("courseFilter").value;

    const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(search) &&
        (section === "" || note.section === section) &&
        (course === "" || note.course === course)
    );

    displayNotes(filtered);
}

// event listeners (safe binding)
document.getElementById("search").addEventListener("input", filterNotes);
document.getElementById("sectionFilter").addEventListener("change", filterNotes);
document.getElementById("courseFilter").addEventListener("change", filterNotes);

// upload form
document.getElementById("uploadForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const course = document.getElementById("course").value;
    const section = document.getElementById("section").value;
    const file = document.getElementById("file").files[0];

    if (!title || !course || !section || !file) {
        alert("Please fill all fields correctly");
        return;
    }

    // simulate adding note
    notes.push({ title, course, section });

    displayNotes(notes);

    alert("Note uploaded successfully (demo)");

    this.reset();
});