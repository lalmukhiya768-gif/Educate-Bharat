(function () {
  const $ = id => document.getElementById(id);
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("year").textContent = new Date().getFullYear();
    const cfg = window.FIREBASE_CONFIG || {};
    if (!cfg.apiKey || String(cfg.apiKey).includes("PASTE_") || !window.firebase) {
      $("articleContent").innerHTML = "<h1>Setup in progress</h1><p>Add your Firebase configuration and try again.</p>"; return;
    }
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    const id = new URLSearchParams(location.search).get("id");
    if (!id) { $("articleContent").innerHTML = "<h1>Article not found</h1><p>Please return to the homepage and choose an article.</p>"; return; }
    firebase.firestore().collection("posts").doc(id).get().then(doc => {
      if (!doc.exists || doc.data().status !== "published") {
        $("articleContent").innerHTML = "<h1>Article not found</h1><p>This article may have been removed or is not published.</p>"; return;
      }
      const p = doc.data();
      document.title = (p.seoTitle || p.titleEn || p.titleHi || "Article") + " | Educate Bharat";
      const image = p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" style="width:100%;max-height:360px;object-fit:cover;border-radius:12px;margin:14px 0">` : "";
      const title = escapeHtml(p.titleEn || p.titleHi || "Article");
      const hiTitle = p.titleHi ? `<h2 lang="hi">${escapeHtml(p.titleHi)}</h2>` : "";
      const body = escapeHtml(p.bodyEn || p.bodyHi || "").replace(/\n/g, "<br>");
      const hiBody = p.bodyHi && p.bodyEn ? `<hr style="border:0;border-top:1px solid var(--line);margin:26px 0"><h2 lang="hi">${escapeHtml(p.titleHi || "हिंदी लेख")}</h2><p lang="hi">${escapeHtml(p.bodyHi).replace(/\n/g, "<br>")}</p>` : "";
      $("articleContent").innerHTML = `<span class="article-meta">${escapeHtml(p.category || "Education")}</span><h1>${title}</h1>${hiTitle}${image}<p class="muted">${escapeHtml(p.excerptEn || p.excerptHi || "")}</p><div style="font-size:16px;line-height:1.9;margin-top:22px">${body}</div>${hiBody}`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && p.seoDescription) meta.setAttribute("content", p.seoDescription);
    }).catch(err => {
      console.error(err);
      $("articleContent").innerHTML = "<h1>Unable to load article</h1><p>Check Firebase configuration and Firestore rules.</p>";
    });
  });
})();