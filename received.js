import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bnViampqc2V1anBua2t1dmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM3NDYwNCwiZXhwIjoyMDczOTUwNjA0fQ.N0sHg1kqrL7F7h0R8Vw3Q2FulHVU9S3-JY4utWfHC94";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadReceivedTenders() {
  const container = document.getElementById("news-container");
  const noNewsMsg = document.getElementById("no-news");
  const spinner = document.getElementById("loading");

  spinner.style.display = "block";
  noNewsMsg.style.display = "none";
  container.innerHTML = "";

  try {
    const { data, error } = await supabase
      .from("received_tenders") // ✅ table name
      .select("*")
      .order("created_at", { ascending: false });

    spinner.style.display = "none";

    if (error) throw error;
    if (!data || data.length === 0) {
      noNewsMsg.style.display = "block";
      noNewsMsg.textContent = "No received tenders available.";
      return;
    }

    data.forEach(doc => {
      const card = document.createElement("div");
      card.className = "newsletter-card";
      card.innerHTML = `<h3>${doc.title}</h3><span class="type-icon">📄</span>`;

      card.onclick = async () => {
        try {
          const filename = doc.title;

          // ✅ bucket name: received_tenders
          const { data: signedData, error: signedError } = await supabase.storage
            .from("received_tenders")
            .createSignedUrl(filename, 60); // 60 sec validity

          if (signedError) throw signedError;

          window.open(signedData.signedUrl, "_blank");

        } catch (err) {
          console.error("Error opening document:", err);
          alert("Failed to open document. Make sure the file exists and is PDF/DOC.");
        }
      };

      container.appendChild(card);
    });

  } catch (err) {
    spinner.style.display = "none";
    console.error("Error fetching received tenders:", err);
    noNewsMsg.style.display = "block";
    noNewsMsg.textContent = "Failed to load received tenders.";
  }
}

document.addEventListener("DOMContentLoaded", loadReceivedTenders);
