(function () {
  const config = window.FIREBASE_CONFIG || {};
  const configReady = config.apiKey && !String(config.apiKey).includes("PASTE_") &&
    config.projectId && !String(config.projectId).includes("PASTE_");
  const $ = id => document.getElementById(id);
  let auth, db, currentUser = null, posts = [];

  function showStatus(id, message, kind) {
    const el = $(id); el.textContent = message; el.className = "status" + (kind ? " " + kind : "");
    el.classList.remove("hidden");
  }
  function hideStatus(id) { $(id).classList.add("hidden"); }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function checkConfig() {
    if (!configReady || !window.firebase) {
      showStatus("loginStatus", "Setup incomplete: paste your Firebase Web App configuration into firebase-config.js, then reload.", "error");
      $("loginForm").querySelector("button").disabled = true;
      return false;
    }
    if (!firebase.apps.length) firebase.initializeApp(config);
    auth = firebase.auth(); db = firebase.firestore();
    return true;
  }
  async function isAdmin(user) {
    const doc = await db.collection("admins").doc(user.uid).get();
    return doc.exists && doc.data().role === "admin";
  }
  function openDashboard() {
    $("loginPanel").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    loadPosts();
  }
  async function onUser(user) {
    if (!user) {
      currentUser = null;
      $("dashboard").classList.add("hidden");
      $("loginPanel").classList.remove("hidden");
      return;
    }
    try {
      if (!(await isAdmin(user))) {
        await auth.signOut();
        showStatus("loginStatus", "This account is not authorized as an admin. Add its UID to the admins collection as explained in README.md.", "error");
        return;
      }
      currentUser = user;
      openDashboard();
    } catch (error) {
      console.error(error);
      await auth.signOut();
      showStatus("loginStatus", "Could not verify admin access. Check Firestore rules and the admin UID setup.", "error");
    }
  }
  function loadPosts() {
    db.collection("posts").orderBy("updatedAt", "desc").onSnapshot(snapshot => {
      posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderAdminPosts();
    }, error => {
      console.error(error);
      showStatus("dashboardStatus", "Could not load articles. Check Firestore rules.", "error");
    });
  }
  function renderAdminPosts() {
    const container = $("adminPostList");
    if (!posts.length) { container.innerHTML = '<p class="muted">No articles yet. Choose “New article” to get started.</p>'; return; }
    container.innerHTML = posts.map(p => `<div class="admin-post"><div><strong>${escapeHtml(p.titleEn || p.titleHi || "Untitled")}</strong><p>${escapeHtml(p.category || "Education")} · ${escapeHtml(p.status || "draft")}</p></div><div class="admin-post-actions"><button class="button button-light" data-edit="${escapeHtml(p.id)}" type="button">Edit</button><button class="button button-danger" data-delete="${escapeHtml(p.id)}" type="button">Delete</button></div></div>`).join("");
    container.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => editPost(btn.dataset.edit)));
    container.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => deletePost(btn.dataset.delete)));
  }
  function clearEditor() {
    $("postForm").reset(); $("postId").value = ""; $("editorHeading").textContent = "Create article";
    $("publishBtn").textContent = "Publish article"; hideStatus("editorStatus");
  }
  function editPost(id) {
    const p = posts.find(x => x.id === id); if (!p) return;
    $("postId").value = p.id; $("titleEn").value = p.titleEn || ""; $("titleHi").value = p.titleHi || "";
    $("category").value = p.category || "Education"; $("imageUrl").value = p.imageUrl || "";
    $("excerptEn").value = p.excerptEn || ""; $("excerptHi").value = p.excerptHi || "";
    $("bodyEn").value = p.bodyEn || ""; $("bodyHi").value = p.bodyHi || "";
    $("seoTitle").value = p.seoTitle || ""; $("seoDescription").value = p.seoDescription || "";
    $("editorHeading").textContent = "Edit article"; $("publishBtn").textContent = p.status === "published" ? "Update published article" : "Publish article";
    $("editorPanel").classList.remove("hidden"); $("editorPanel").scrollIntoView({ behavior: "smooth" });
  }
  async function savePost(status) {
    if (!currentUser) return;
    const titleEn = $("titleEn").value.trim();
    const excerptEn = $("excerptEn").value.trim();
    const bodyEn = $("bodyEn").value.trim();
    if (!titleEn || !excerptEn || !bodyEn) {
      showStatus("editorStatus", "Please fill in the English title, short description, and article body.", "error"); return;
    }
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const data = {
      titleEn, titleHi: $("titleHi").value.trim(), category: $("category").value,
      imageUrl: $("imageUrl").value.trim(), excerptEn, excerptHi: $("excerptHi").value.trim(),
      bodyEn, bodyHi: $("bodyHi").value.trim(), seoTitle: $("seoTitle").value.trim(),
      seoDescription: $("seoDescription").value.trim(), status,
      authorUid: currentUser.uid, updatedAt: now
    };
    if (status === "published") data.publishedAt = now;
    try {
      const id = $("postId").value;
      if (id) await db.collection("posts").doc(id).update(data);
      else { data.createdAt = now; await db.collection("posts").add(data); }
      showStatus("editorStatus", status === "published" ? "Article published successfully." : "Draft saved successfully.", "success");
      clearEditor(); $("editorPanel").classList.remove("hidden");
    } catch (error) {
      console.error(error);
      showStatus("editorStatus", "Save failed. Check Firestore security rules and the browser console.", "error");
    }
  }
  async function deletePost(id) {
    const p = posts.find(x => x.id === id);
    if (!p || !confirm(`Delete "${p.titleEn || p.titleHi || "this article"}"? This cannot be undone.`)) return;
    try { await db.collection("posts").doc(id).delete(); showStatus("dashboardStatus", "Article deleted.", "success"); }
    catch (error) { console.error(error); showStatus("dashboardStatus", "Delete failed. Check Firestore rules.", "error"); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!checkConfig()) return;
    $("loginForm").addEventListener("submit", async e => {
      e.preventDefault(); hideStatus("loginStatus");
      try { await auth.signInWithEmailAndPassword($("email").value.trim(), $("password").value); }
      catch (error) {
        console.error(error);
        showStatus("loginStatus", "Sign-in failed. Check the email/password and confirm Email/Password is enabled in Firebase Authentication.", "error");
      }
    });
    auth.onAuthStateChanged(onUser);
    $("newPostBtn").addEventListener("click", () => { clearEditor(); $("editorPanel").classList.remove("hidden"); $("editorPanel").scrollIntoView({ behavior: "smooth" }); });
    $("cancelEditBtn").addEventListener("click", () => { clearEditor(); $("editorPanel").classList.add("hidden"); });
    $("postForm").addEventListener("submit", e => { e.preventDefault(); savePost("published"); });
    $("draftBtn").addEventListener("click", () => savePost("draft"));
    $("logoutBtn").addEventListener("click", () => auth.signOut());
  });
})();