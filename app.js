(function () {
  const config = window.FIREBASE_CONFIG || {};
  const configReady = config.apiKey && !String(config.apiKey).includes("PASTE_") &&
    config.projectId && !String(config.projectId).includes("PASTE_");
  const state = { posts: [], category: "All", query: "", lang: localStorage.getItem("eb-lang") || "en" };
  const $ = (id) => document.getElementById(id);

  function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem("eb-lang", lang);
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
    document.querySelectorAll("[data-en][data-hi]").forEach(el => {
      el.textContent = lang === "hi" ? el.dataset.hi : el.dataset.en;
    });
    const search = $("searchInput");
    if (search) search.placeholder = lang === "hi" ? search.dataset.placeholderHi : search.dataset.placeholderEn;
    const toggle = $("languageToggle");
    if (toggle) toggle.textContent = lang === "hi" ? "English" : "हिंदी";
    renderPosts();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function getTitle(post) { return state.lang === "hi" ? (post.titleHi || post.titleEn || post.title || "") : (post.titleEn || post.title || post.titleHi || ""); }
  function getExcerpt(post) { return state.lang === "hi" ? (post.excerptHi || post.excerptEn || "") : (post.excerptEn || post.excerptHi || ""); }
  function renderPosts() {
    const grid = $("articleGrid");
    if (!grid) return;
    const posts = state.posts.filter(p => {
      const categoryMatch = state.category === "All" || p.category === state.category;
      const haystack = [p.titleEn, p.titleHi, p.excerptEn, p.excerptHi, p.bodyEn, p.bodyHi, p.category].join(" ").toLowerCase();
      return categoryMatch && haystack.includes(state.query.toLowerCase());
    });
    $("articleCount").textContent = `${posts.length} ${state.lang === "hi" ? "लेख" : (posts.length === 1 ? "article" : "articles")}`;
    if (!posts.length) {
      grid.innerHTML = `<div class="empty-state"><div style="font-size:30px">📘</div><p>${state.lang === "hi" ? "अभी इस श्रेणी में कोई प्रकाशित लेख नहीं है।" : "No published articles found yet. Please check back soon."}</p></div>`;
      return;
    }
    grid.innerHTML = posts.map(p => {
      const title = escapeHtml(getTitle(p));
      const excerpt = escapeHtml(getExcerpt(p));
      const category = escapeHtml(p.category || "Education");
      const image = p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy" onerror="this.parentElement.textContent='📚'">` : "📚";
      return `<article class="article-card"><div class="article-image">${image}</div><div class="article-body"><span class="article-meta">${category}</span><h3>${title}</h3><p>${excerpt}</p><a class="read-more" href="article.html?id=${encodeURIComponent(p.id)}">${state.lang === "hi" ? "पूरा लेख पढ़ें →" : "Read article →"}</a></div></article>`;
    }).join("");
  }

  function start() {
    $("year").textContent = new Date().getFullYear();
    $("languageToggle").addEventListener("click", () => setLanguage(state.lang === "en" ? "hi" : "en"));
    $("searchInput").addEventListener("input", e => { state.query = e.target.value.trim(); renderPosts(); });
    document.querySelectorAll(".category-card").forEach(btn => btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      document.querySelectorAll(".category-card").forEach(b => b.classList.toggle("active", b === btn));
      renderPosts();
    }));
    setLanguage(state.lang);
    if (!configReady || !window.firebase) {
      state.posts = [];
      renderPosts();
      $("articleGrid").innerHTML = `<div class="empty-state"><strong>Website setup in progress</strong><p>Firebase configuration has not been added yet. Follow README.md to connect your project.</p></div>`;
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(config);
      firebase.firestore().collection("posts").where("status", "==", "published").orderBy("publishedAt", "desc").onSnapshot(snapshot => {
        state.posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPosts();
      }, error => {
        console.error(error);
        $("articleGrid").innerHTML = `<div class="empty-state"><strong>Articles could not be loaded.</strong><p>Check Firebase configuration, Firestore rules, and the browser console.</p></div>`;
      });
    } catch (e) {
      console.error(e);
      $("articleGrid").innerHTML = `<div class="empty-state"><strong>Firebase setup needs attention.</strong><p>Check the configuration in firebase-config.js.</p></div>`;
    }
  }
  document.addEventListener("DOMContentLoaded", start);
})();