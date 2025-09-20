import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://runubjjjseujpnkkuveu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bnViampqc2V1anBua2t1dmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ2MDQsImV4cCI6MjA3Mzk1MDYwNH0.ZE_hHkg0RPbVz7cSn0WB3tSKSFqhYT-dO_tyjR3kuEM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadNews() {
  const container = document.getElementById("news-container");
  const noNewsMsg = document.getElementById("no-news");
  const spinner = document.getElementById("loading");

  // Show spinner
  spinner.style.display = "block";
  noNewsMsg.style.display = "none";
  container.innerHTML = "";

  try {
    const { data, error } = await supabase
      .from("news_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Hide spinner immediately before rendering
    spinner.style.display = "none";

    if (!data || data.length === 0) {
      noNewsMsg.style.display = "block";
      noNewsMsg.textContent = "No news available.";
      return;
    }

    data.forEach(doc => {
      const card = document.createElement("div");
      card.className = "newsletter-card";
      card.onclick = () => {
        if (doc.pdf_url) {
          window.open(doc.pdf_url, "_blank");
        } else {
          alert("No document URL provided.");
        }
      };

      card.innerHTML = `
        <h3>${doc.title}</h3>
        <span class="type-icon">📄</span>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    spinner.style.display = "none"; // hide spinner on error
    console.error("Error fetching news:", err);
    noNewsMsg.style.display = "block";
    noNewsMsg.textContent = "Failed to load news.";
  }
}

document.addEventListener("DOMContentLoaded", loadNews);
