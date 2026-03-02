const PROFILES = {
  "T4B-Q7L": { name: "Profil 1", number: "071", id: "profil1" }
};

const SESSION_KEY = "upload_pages_session";
const FILES_KEY_PREFIX = "upload_pages_files_";

const loginView = document.getElementById("loginView");
const profileView = document.getElementById("profileView");
const loginForm = document.getElementById("loginForm");
const uploadForm = document.getElementById("uploadForm");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const profileMessage = document.getElementById("profileMessage");
const fileList = document.getElementById("fileList");

function showMessage(target, text) {
  target.innerHTML = text ? `<div class="messages">${text}</div>` : "";
}

function getCurrentProfile() {
  const key = localStorage.getItem(SESSION_KEY);
  return PROFILES[key] ? { key, ...PROFILES[key] } : null;
}

function getFilesStorageKey(profileId) {
  return `${FILES_KEY_PREFIX}${profileId}`;
}

function loadFiles(profileId) {
  const raw = localStorage.getItem(getFilesStorageKey(profileId));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveFiles(profileId, files) {
  localStorage.setItem(getFilesStorageKey(profileId), JSON.stringify(files));
}

function renderFiles(profileId) {
  const files = loadFiles(profileId);
  fileList.innerHTML = "";

  if (!files.length) {
    fileList.innerHTML = "<li>Zatiaľ žiadne nahrané súbory.</li>";
    return;
  }

  files.forEach((item, index) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.dataUrl;
    a.download = item.savedName;
    a.textContent = `${item.savedName} (${item.description})`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Zmazať";
    removeBtn.style.marginLeft = "8px";
    removeBtn.addEventListener("click", () => {
      const updated = loadFiles(profileId);
      updated.splice(index, 1);
      saveFiles(profileId, updated);
      renderFiles(profileId);
    });

    li.appendChild(a);
    li.appendChild(removeBtn);
    fileList.appendChild(li);
  });
}

function showProfile(profile) {
  document.getElementById("profileName").textContent = profile.name;
  document.getElementById("profileNumber").textContent = profile.number;
  loginView.classList.add("hidden");
  profileView.classList.remove("hidden");
  renderFiles(profile.id);
}

function showLogin() {
  profileView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = document.getElementById("accessKey").value.trim();
  if (!PROFILES[key]) {
    showMessage(loginMessage, "Neplatný prístupový kľúč.");
    return;
  }

  localStorage.setItem(SESSION_KEY, key);
  showMessage(loginMessage, "");
  showProfile({ key, ...PROFILES[key] });
});

uploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = getCurrentProfile();
  if (!profile) return showLogin();

  const fileInput = document.getElementById("fileInput");
  const descriptionInput = document.getElementById("descriptionInput");
  const file = fileInput.files[0];
  const description = descriptionInput.value.trim();

  if (!file) {
    showMessage(profileMessage, "Najprv vyberte súbor.");
    return;
  }
  if (!description) {
    showMessage(profileMessage, "Doplňte popis.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
    const savedName = `${stamp}_${file.name}`;
    const files = loadFiles(profile.id);
    files.unshift({ savedName, description, dataUrl: reader.result });

    try {
      saveFiles(profile.id, files);
      showMessage(profileMessage, `Súbor uložený: ${savedName}`);
      uploadForm.reset();
      renderFiles(profile.id);
    } catch {
      showMessage(profileMessage, "Uloženie zlyhalo (pravdepodobne limit localStorage). Skúste menší súbor.");
    }
  };
  reader.readAsDataURL(file);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  showMessage(profileMessage, "");
  showLogin();
});

const current = getCurrentProfile();
if (current) {
  showProfile(current);
} else {
  showLogin();
}
