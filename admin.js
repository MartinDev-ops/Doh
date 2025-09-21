import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase credentials
const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bnViampqc2V1anBua2t1dmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM3NDYwNCwiZXhwIjoyMDczOTUwNjA0fQ.N0sHg1kqrL7F7h0R8Vw3Q2FulHVU9S3-JY4utWfHC94"; // Replace with valid anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapping of tables to buckets
const bucketMap = {
  news_documents: "news_pdfs",
  paipa: "paipa",
  policies: "policies",
  annual_report: "annual_report",
  annual_performance_plan: "annual_performance_plan",
  budget_speech: "budget_speech",
  department_strategic_plan: "department_strategic_plan",
  application_forms_for_private_health_facilities: "application_forms_for_private_health_facilities",
  awarded_tenders: "awarded_tenders",
  received_tenders: "received_tenders",
  archived_tenders: "archived_tenders",
  advertised_tenders: "advertised_tenders"
};

// -------------------
// Show message helper
// -------------------
function showMessage(message, type = "success", duration = 3000) {
  let container = document.getElementById("messageContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "messageContainer";
    container.className = "message-container hidden";
    document.body.appendChild(container);
  }
  container.textContent = message;
  container.className = `message-container message-${type}`;
  container.classList.remove("hidden");
  setTimeout(() => container.classList.add("hidden"), duration);
}

// -------------------
// File type check
// -------------------
function isValidFile(file) {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  return allowed.includes(file.type);
}

// -------------------
// Upload Handler
// -------------------
async function handleUpload(formId, titleId, fileId, categorySelectId) {
  const title = document.getElementById(titleId).value.trim();
  const fileInput = document.getElementById(fileId);
  const categorySelect = categorySelectId ? document.getElementById(categorySelectId) : null;
  const tableName = categorySelect ? categorySelect.value : formId === "newsForm" ? "news_documents" : null;

  if (!tableName) return showMessage("Please select a category", "error");
  if (!fileInput.files.length) return showMessage("Please select a file", "error");

  const file = fileInput.files[0];

  if (!isValidFile(file)) return showMessage("Only PDF or DOC/DOCX files are allowed", "error");

  const bucket = bucketMap[tableName];

  // Upload file to Supabase Storage using title as filename
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(title, file, { cacheControl: "3600", upsert: true });
  if (uploadError) return showMessage("Upload failed: " + uploadError.message, "error");

  // Insert record in table (title only)
  const { error: dbError } = await supabase.from(tableName).insert([{ title }]);
  if (dbError) return showMessage("Database insert failed: " + dbError.message, "error");

  showMessage(`"${title}" uploaded successfully!`, "success");
  document.getElementById(formId).reset();

  const listId = formId === "newsForm" ? "newsList" : formId === "docsForm" ? "docsList" : "tendersList";
  showDocuments(tableName, listId);
}

// -------------------
// Form Event Listeners
// -------------------
document.getElementById("newsForm").addEventListener("submit", e => {
  e.preventDefault();
  handleUpload("newsForm", "newsTitle", "newsFile");
});

document.getElementById("docsForm").addEventListener("submit", e => {
  e.preventDefault();
  handleUpload("docsForm", "docTitle", "docFile", "categorySelect");
});

document.getElementById("tendersForm").addEventListener("submit", e => {
  e.preventDefault();
  handleUpload("tendersForm", "tenderTitle", "tenderFile", "tenderCategorySelect");
});

// -------------------
// Show/Hide Stored Items
// -------------------
document.querySelectorAll(".show-btn").forEach(btn => {
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
    else if (targetListId === "docsList") {
      const category = document.getElementById("categorySelect").value;
      if (!category) return showMessage("Please select a category first", "error");
      tableName = category;
    }
    else if (targetListId === "tendersList") {
      const category = document.getElementById("tenderCategorySelect").value;
      if (!category) return showMessage("Please select a tender type first", "error");
      tableName = category;
    }

    showDocuments(tableName, targetListId);
  });
});

// -------------------
// Fetch & Display Items
// -------------------
async function showDocuments(tableName, listId) {
  const { data, error } = await supabase.from(tableName).select("*");
  const listDiv = document.getElementById(listId);
  listDiv.innerHTML = "";
  listDiv.classList.remove("hidden");

  if (error) {
    listDiv.innerHTML = `<p class="empty">Error fetching items: ${error.message}</p>`;
    return;
  }

  if (!data.length) {
    listDiv.innerHTML = `<p class="empty">No documents</p>`;
    return;
  }

  data.forEach(doc => {
    const item = document.createElement("div");
    item.className = "document-item";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = doc.title;

    const viewBtn = document.createElement("button");
    viewBtn.className = "view-btn";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", async () => {
      const bucket = bucketMap[tableName];
      const { data: fileData, error: fileError } = supabase.storage.from(bucket).getPublicUrl(doc.title);
      if (fileError) return showMessage("Cannot open file: " + fileError.message, "error");
      window.open(fileData.publicUrl, "_blank");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete "${doc.title}"?`)) return;

      const bucket = bucketMap[tableName];
      const { error: sErr } = await supabase.storage.from(bucket).remove([doc.title]);
      if (sErr) return showMessage("Failed to delete file: " + sErr.message, "error");

      const { error: dErr } = await supabase.from(tableName).delete().eq("title", doc.title);
      if (dErr) return showMessage("Failed to delete record: " + dErr.message, "error");

      showMessage(`"${doc.title}" deleted successfully!`, "success");
      showDocuments(tableName, listId);
    });

    item.appendChild(titleSpan);
    item.appendChild(viewBtn);
    item.appendChild(deleteBtn);
    listDiv.appendChild(item);
  });
}
