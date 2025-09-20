import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase credentials
const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bnViampqc2V1anBua2t1dmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ2MDQsImV4cCI6MjA3Mzk1MDYwNH0.ZE_hHkg0RPbVz7cSn0WB3tSKSFqhYT-dO_tyjR3kuEM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM elements
const form = document.getElementById("upload-form");
const list = document.getElementById("documents-list");

// ✅ Load all documents
async function loadDocuments() {
  try {
    const { data, error } = await supabase
      .from("news_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

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
        <a href="${doc.pdf_url}" target="_blank">View</a>
        <button onclick="deleteDocument('${doc.id}')">Delete</button>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading documents:", err.message);
    list.innerHTML = `<p style="color:red;">Failed to load documents: ${err.message}</p>`;
  }
}

// ✅ Add new document
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const pdf_url = document.getElementById("pdf_url").value.trim();

  if (!title || !pdf_url) {
    return alert("Please fill both Title and PDF URL.");
  }

  try {
    const { data, error } = await supabase
      .from("news_documents")
      .insert([{ title, pdf_url }])
      .select(); // <- ensures Supabase returns the inserted row

    if (error) throw error;

    alert(`Document "${data[0].title}" added successfully!`);
    form.reset();
    loadDocuments();

  } catch (err) {
    console.error("Error adding document:", err.message);
    alert("Failed to add document: " + err.message);
  }
});

// ✅ Delete document
window.deleteDocument = async function(id) {
  if (!confirm("Are you sure you want to delete this document?")) return;

  try {
    const { error } = await supabase
      .from("news_documents")
      .delete()
      .eq("id", id);

    if (error) throw error;

    alert("Document deleted successfully!");
    loadDocuments();
  } catch (err) {
    console.error("Error deleting document:", err.message);
    alert("Failed to delete document: " + err.message);
  }
};

// Load existing documents on page load
loadDocuments();
