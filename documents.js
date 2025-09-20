import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase anon key
const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_KEY = "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const form = document.getElementById("upload-form");
const list = document.getElementById("documents-list");
const notification = document.getElementById("notification");
const categorySelect = document.getElementById("category"); // select element to pick table

function showNotification(message, type = "success", duration = 3000) {
  notification.textContent = message;
  notification.style.display = "block";
  notification.style.backgroundColor = type === "success" ? "#4CAF50" : "#f44336";
  if (duration > 0) setTimeout(() => (notification.style.display = "none"), duration);
}

// Load documents dynamically based on selected category
async function loadDocuments() {
  const category = categorySelect.value;
  if (!category) return;

  list.innerHTML = "<p class='spinner'>Loading documents...</p>";

  const { data, error } = await supabase
    .from(category)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load error:", error);
    return showNotification("Error loading documents: " + error.message, "error");
  }

  list.innerHTML = "";
  if (!data || data.length === 0) {
    list.innerHTML = "<p>No documents found.</p>";
    return;
  }

  data.forEach(doc => {
    const div = document.createElement("div");
    div.className = "document-item";
    div.innerHTML = `
      <span>${doc.title}</span>
      <button onclick="downloadDocument('${category}', '${doc.title}')">Download</button>
      <button onclick="deleteDocument('${category}', '${doc.id}', '${doc.title}')">Delete</button>
    `;
    list.appendChild(div);
  });
}

// Upload handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const category = categorySelect.value;
  const rawTitle = document.getElementById("title").value.trim();
  const file = document.getElementById("pdf_file").files[0];

  if (!category || !rawTitle || !file) {
    return showNotification("Please select a category and provide a title and PDF file", "error", 4000);
  }
  if (file.type !== "application/pdf") {
    return showNotification("Only PDF files are allowed", "error", 4000);
  }

  // Sanitize title
  const baseName = rawTitle.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
  if (!baseName) return showNotification("Title cannot be empty after sanitization", "error", 4000);

  const storageFilename = `${baseName}.pdf`;
  showNotification("Uploading document...", "success", 0);

  const { error: storageError } = await supabase.storage
    .from(`${category}_bucket`)
    .upload(storageFilename, file, { upsert: true });

  if (storageError) return showNotification("File upload failed: " + storageError.message, "error", 4000);

  const { error: dbError } = await supabase
    .from(category)
    .insert([{ title: baseName }]);

  if (dbError) {
    await supabase.storage.from(`${category}_bucket`).remove([storageFilename]);
    return showNotification("DB insert failed: " + dbError.message, "error", 4000);
  }

  showNotification(`Document "${baseName}" added successfully!`);
  form.reset();
  loadDocuments();
});

// Download
window.downloadDocument = async function(category, title) {
  const { data, error } = await supabase.storage
    .from(`${category}_bucket`)
    .createSignedUrl(`${title}.pdf`, 60);

  if (error) return showNotification("Failed to download: " + error.message, "error");

  const a = document.createElement("a");
  a.href = data.signedUrl;
  a.download = `${title}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// Delete
window.deleteDocument = async function(category, id, title) {
  if (!confirm("Delete this document?")) return;

  const { error: storageError } = await supabase.storage
    .from(`${category}_bucket`)
    .remove([`${title}.pdf`]);

  if (storageError) return showNotification("Delete storage failed: " + storageError.message, "error");

  const { error: dbError } = await supabase
    .from(category)
    .delete()
    .eq("id", id);

  if (dbError) return showNotification("Delete DB failed: " + dbError.message, "error");

  showNotification("Document deleted successfully!");
  loadDocuments();
};

// Reload documents when category changes
categorySelect.addEventListener("change", loadDocuments);

// Initial load
loadDocuments();
