const PROFILES = {
  "T4B-Q7L": { name: "Profil 1", number: "071", id: "profil1" },
};

const SESSION_KEY = "upload_web_session";
const FILES_KEY_PREFIX = "upload_web_files_";

const topbar = document.getElementById("topbar");
const loginView = document.getElementById("loginView");
const profileView = document.getElementById("profileView");
const loginForm = document.getElementById("loginForm");
const uploadForm = document.getElementById("uploadForm");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const profileMessage = document.getElementById("profileMessage");
const fileList = document.getElementById("fileList");
const accessKeyInput = document.getElementById("accessKey");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function showMessage(target, text) {
  target.innerHTML = text ? `<div class="messages">${escapeHtml(text)}</div>` : "";
}

function filesKey(profileId) {
  return `${FILES_KEY_PREFIX}${profileId}`;
}

function getCurrentProfile() {
  const sessionKey = localStorage.getItem(SESSION_KEY);
  if (!sessionKey || !PROFILES[sessionKey]) return null;
  return { key: sessionKey, ...PROFILES[sessionKey] };
}

function loadFiles(profileId) {
  const raw = localStorage.getItem(filesKey(profileId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFiles(profileId, files) {
  localStorage.setItem(filesKey(profileId), JSON.stringify(files));
}

function switchToLogin() {
  topbar.classList.add("hidden");
  profileView.classList.add("hidden");
  loginView.classList.remove("hidden");
  showMessage(profileMessage, "");
}

function switchToProfile(profile) {
  document.getElementById("profileName").textContent = profile.name;
  document.getElementById("profileNumber").textContent = profile.number;
  loginView.classList.add("hidden");
  profileView.classList.remove("hidden");
  topbar.classList.remove("hidden");
  renderFiles(profile.id);
}

function removeFile(profileId, index) {
  const items = loadFiles(profileId);
  items.splice(index, 1);
  saveFiles(profileId, items);
  renderFiles(profileId);
}

function renderFiles(profileId) {
  const items = loadFiles(profileId);
  fileList.innerHTML = "";

  if (!items.length) {
    fileList.innerHTML = "<li>Zatiaľ žiadne nahrané súbory.</li>";
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement("li");

    const link = document.createElement("a");
    link.href = item.dataUrl;
    link.download = item.savedName;
    link.textContent = `${item.savedName} — ${item.description}`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger-btn";
    delBtn.textContent = "Zmazať";
    delBtn.addEventListener("click", () => {
      removeFile(profileId, index);
    });

    li.append(link, delBtn);
    fileList.appendChild(li);
  });
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = accessKeyInput.value.trim();

  if (!PROFILES[key]) {
    showMessage(loginMessage, "Neplatný prístupový kľúč.");
    return;
  }

  localStorage.setItem(SESSION_KEY, key);
  showMessage(loginMessage, "");
  switchToProfile({ key, ...PROFILES[key] });
});

uploadForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const profile = getCurrentProfile();
  if (!profile) {
    switchToLogin();
    return;
  }

  const fileInput = document.getElementById("fileInput");
  const descriptionInput = document.getElementById("descriptionInput");
  const file = fileInput.files[0];
  const description = descriptionInput.value.trim();

  if (!file) {
    showMessage(profileMessage, "Vyberte súbor.");
    return;
  }

  if (!description) {
    showMessage(profileMessage, "Doplňte popis.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const savedName = `${stamp}_${file.name}`;
    const items = loadFiles(profile.id);
    items.unshift({
      savedName,
      description,
      dataUrl: reader.result,
    });

    try {
      saveFiles(profile.id, items);
      showMessage(profileMessage, `Súbor uložený: ${savedName}`);
      uploadForm.reset();
      renderFiles(profile.id);
    } catch {
      showMessage(profileMessage, "Uloženie zlyhalo. Súbor je pravdepodobne príliš veľký.");
    }
  };

  reader.readAsDataURL(file);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  switchToLogin();
});

const profile = getCurrentProfile();
if (profile) {
  switchToProfile(profile);
} else {
  switchToLogin();
}
