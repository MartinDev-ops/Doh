// policies.js
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase URL and service/anon key
const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_KEY = "YOUR_SERVICE_OR_ANON_KEY"; // replace with your key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadPolicies() {
  const container = document.getElementById("policies-container");
  const noMsg = document.getElementById("no-policies");
  const spinner = document.getElementById("loading");

  // Show spinner and hide message
  spinner.style.display = "block";
  noMsg.style.display = "none";
  container.innerHTML = "";

  try {
    // Fetch all policies
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .order("created_at", { ascending: false });

    spinner.style.display = "none";

    if (error) throw error;

    if (!data || data.length === 0) {
      noMsg.style.display = "block";
      return;
    }

    // Populate table
    data.forEach(doc => {
      const tr = document.createElement("tr");

      // Title
      const tdTitle = document.createElement("td");
      tdTitle.textContent = doc.title;
      tr.appendChild(tdTitle);

      // Download link
      const tdLink = document.createElement("td");
      const a = document.createElement("a");
      a.href = ""; // placeholder for PDF link
      a.target = "_blank";
      a.textContent = "Download";

      // Generate signed URL from Supabase storage if needed
      const filename = `${doc.filename}`; // or use doc.title + ".pdf" if filenames match
      supabase.storage.from("policies_bucket")
        .createSignedUrl(filename, 60)
        .then(({ data: signedData, error: signedError }) => {
          if (!signedError && signedData?.signedUrl) {
            a.href = signedData.signedUrl;
          }
        });

      tdLink.appendChild(a);
      tr.appendChild(tdLink);

      container.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading policies:", err);
    noMsg.style.display = "block";
    noMsg.textContent = "Failed to load policies.";
    spinner.style.display = "none";
  }
}

// Load on page load
document.addEventListener("DOMContentLoaded", loadPolicies);
