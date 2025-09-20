import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase credentials
const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bnViampqc2V1anBua2t1dmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM3NDYwNCwiZXhwIjoyMDczOTUwNjA0fQ.N0sHg1kqrL7F7h0R8Vw3Q2FulHVU9S3-JY4utWfHC94";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapping of document tables to storage buckets
const bucketMap = {
  news_documents: "news_pdf",
  paipa: "paipa",
  policies: "policies",
  annual_report: "annual_report",
  annual_performance_plan: "annual_performance_plan",
  budget_speech: "budget_speech",
  department_strategic_plan: "department_strategic_plan",
  application_forms_for_private_health_facilities: "application_forms_for_private_health_facilities"
};

// -------------------
// Show message helper
// -------------------
function showMessage(message, type = "success", duration = 3000) {
  const container = document.getElementById("messageContainer");
  container.textContent = message;
  container.className = `message-container message-${type}`;
  container.classList.remove("hidden");

  setTimeout(() => {
    container.classList.add("hidden");
  }, duration);
}

// -------------------
// Upload News
// -------------------
const newsForm = document.getElementById("newsForm");
newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("newsTitle").value.trim();
  const fileInput = document.getElementById("newsFile");
  if (!fileInput.files.length) return showMessage("Please select a file", "error");

  const file = fileInput.files[0];
  const bucket = bucketMap.news_documents;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(file.name, file, { cacheControl: "3600", upsert: true });

  if (uploadError) return showMessage("Upload failed: " + uploadError.message, "error");

  const { error: dbError } = await supabase
    .from("news_documents")
    .insert([{ title, file_name: file.name }]);

  if (dbError) return showMessage("Database insert failed: " + dbError.message, "error");

  showMessage("News uploaded successfully!", "success");
  newsForm.reset();
  showDocuments("news_documents", "newsList");
});

// -------------------
// Upload Documents
// -------------------
const docsForm = document.getElementById("docsForm");
docsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("docTitle").value.trim();
  const fileInput = document.getElementById("docFile");
  const category = document.getElementById("categorySelect").value;

  if (!category) return showMessage("Please select a category", "error");
  if (!fileInput.files.length) return showMessage("Please select a file", "error");

  const file = fileInput.files[0];
  const bucket = bucketMap[category];

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(file.name, file, { cacheControl: "3600", upsert: true });

  if (uploadError) return showMessage("Upload failed: " + uploadError.message, "error");

  const { error: dbError } = await supabase
    .from(category)
    .insert([{ title, file_name: file.name }]);

  if (dbError) return showMessage("Database insert failed: " + dbError.message, "error");

  showMessage("Document uploaded successfully!", "success");
  docsForm.reset();
  showDocuments(category, "docsList");
});

// -------------------
// Show/Hide Stored Documents (Toggle)
// -------------------
document.querySelectorAll(".show-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const targetListId = btn.getAttribute("data-target");
    const listDiv = document.getElementById(targetListId);

    // Toggle visibility
    if (!listDiv.classList.contains("hidden")) {
      listDiv.classList.add("hidden");
      return;
    }

    let tableName;
    if (targetListId === "newsList") tableName = "news_documents";
    else {
      const category = document.getElementById("categorySelect").value;
      if (!category) return showMessage("Please select a category first", "error");
      tableName = category;
    }

    showDocuments(tableName, targetListId);
  });
});

// -------------------
// Fetch and Display Documents
// -------------------
async function showDocuments(tableName, listId) {
  const { data, error } = await supabase.from(tableName).select("*");
  const listDiv = document.getElementById(listId);
  listDiv.innerHTML = "";
  listDiv.classList.remove("hidden");

  if (error) {
    listDiv.innerHTML = `<p class="empty">Error fetching documents: ${error.message}</p>`;
    return;
  }

  if (!data.length) {
    listDiv.innerHTML = `<p class="empty">No documents</p>`;
    return;
  }

  data.forEach((doc) => {
    const item = document.createElement("div");
    item.className = "document-item";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = doc.title;

    const viewBtn = document.createElement("button");
    viewBtn.className = "view-btn";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", async () => {
      const bucket = bucketMap[tableName];
      const { data: fileData, error: fileError } = await supabase.storage
        .from(bucket)
        .getPublicUrl(doc.file_name);
      if (fileError) return showMessage("Cannot open file: " + fileError.message, "error");
      window.open(fileData.publicUrl, "_blank");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete document "${doc.title}"?`)) return;

      const bucket = bucketMap[tableName];
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([doc.file_name]);
      if (storageError) return showMessage("Failed to delete file: " + storageError.message, "error");

      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", doc.id);
      if (dbError) return showMessage("Failed to delete record: " + dbError.message, "error");

      showMessage("Document deleted successfully!", "success");
      showDocuments(tableName, listId);
    });

    item.appendChild(titleSpan);
    item.appendChild(viewBtn);
    item.appendChild(deleteBtn);
    listDiv.appendChild(item);
  });
}
