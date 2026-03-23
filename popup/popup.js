const form = document.getElementById("form");
const fieldsContainer = document.getElementById("fieldsContainer");

let isSimplifiedMode = false;

// --- Tab switching (normal mode) ---
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "apply") renderCredentials();
  });
});

// --- Simplified mode toggle ---
function applySimplifiedMode(simplified) {
  isSimplifiedMode = simplified;

  const normalTabs = document.getElementById("normalTabs");
  const tabApply = document.getElementById("tab-apply");
  const platformLabel = document.getElementById("platformLabel");
  const normalActions = document.getElementById("normalActions");
  const simplifiedActions = document.getElementById("simplifiedActions");

  if (simplified) {
    normalTabs.style.display = "none";
    tabApply.classList.remove("active");
    document.getElementById("tab-capture").classList.add("active");
    platformLabel.style.display = "none";
    normalActions.style.display = "none";
    simplifiedActions.style.display = "flex";

    chrome.storage.local.get(["simplifiedData"], ({ simplifiedData }) => {
      document.getElementById("simplifiedApplyBtn").disabled = !simplifiedData;
    });
  } else {
    normalTabs.style.display = "flex";
    platformLabel.style.display = "flex";
    normalActions.style.display = "flex";
    simplifiedActions.style.display = "none";
  }
}

document.getElementById("simplifiedToggle").addEventListener("change", (e) => {
  const simplified = e.target.checked;
  chrome.storage.local.set({ simplifiedMode: simplified });
  applySimplifiedMode(simplified);
});

// --- Fields ---
function getFieldNames() {
  return Array.from(fieldsContainer.querySelectorAll("input"))
    .map((i) => i.value.trim())
    .filter(Boolean);
}

function saveFieldNames() {
  chrome.storage.local.set({ fieldNames: getFieldNames() });
}

function addField(name = "") {
  const randomId = Math.random().toString(36).substring(2, 10);
  const label = document.createElement("label");
  label.classList.add("form-label", "input-group");
  label.id = randomId;
  label.innerHTML = `
    <div class="input-field">
      <input type="text" placeholder="Cookie name (e.g. token)" value="${name}" />
      <button class="custom-field-button add-field" type="button" title="Add field">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path><path d="M12 5v14"></path>
        </svg>
      </button>
      <button class="custom-field-button subtract-field" type="button" title="Remove field">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
        </svg>
      </button>
    </div>
  `;

  label.querySelector("input").addEventListener("change", saveFieldNames);
  label.querySelector(".subtract-field").addEventListener("click", () => {
    label.remove();
    saveFieldNames();
  });
  label.querySelector(".add-field").addEventListener("click", () => addField());

  fieldsContainer.appendChild(label);
}

// --- Save (normal mode) ---
function saveFormData(event) {
  event.preventDefault();

  if (isSimplifiedMode) {
    saveSimplifiedData();
    return;
  }

  const platform = document.getElementById("name").value.trim();
  if (!platform) return;

  const fieldNames = getFieldNames();
  if (!fieldNames.length) return;

  saveFieldNames();

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  chrome.runtime.sendMessage(
    { action: "getCookieValues", cookieNames: fieldNames, platform },
    (response) => {
      if (!response) {
        saveBtn.textContent = "Error";
        setTimeout(() => {
          saveBtn.textContent = "Save";
          saveBtn.disabled = false;
        }, 1500);
        return;
      }

      chrome.storage.local.get(["credentials"], ({ credentials = {} }) => {
        credentials[platform] = {
          domain: response.url,
          cookies: response.cookies,
        };
        chrome.storage.local.set({ credentials }, () => {
          saveBtn.textContent = "Saved!";
          setTimeout(() => {
            saveBtn.textContent = "Save";
            saveBtn.disabled = false;
          }, 1500);
        });
      });
    }
  );
}

// --- Save (simplified mode) ---
function saveSimplifiedData() {
  const fieldNames = getFieldNames();
  if (!fieldNames.length) return;

  saveFieldNames();

  const saveBtn = document.getElementById("simplifiedSaveBtn");
  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  chrome.runtime.sendMessage(
    { action: "getCookieValues", cookieNames: fieldNames, platform: "simplified" },
    (response) => {
      if (!response) {
        saveBtn.textContent = "Error";
        setTimeout(() => {
          saveBtn.textContent = "Save";
          saveBtn.disabled = false;
        }, 1500);
        return;
      }

      chrome.storage.local.set(
        { simplifiedData: { domain: response.url, cookies: response.cookies } },
        () => {
          saveBtn.textContent = "Saved!";
          document.getElementById("simplifiedApplyBtn").disabled = false;
          setTimeout(() => {
            saveBtn.textContent = "Save";
            saveBtn.disabled = false;
          }, 1500);
        }
      );
    }
  );
}

// --- Apply (simplified mode) ---
document.getElementById("simplifiedApplyBtn").addEventListener("click", () => {
  const applyBtn = document.getElementById("simplifiedApplyBtn");
  applyBtn.textContent = "Applying...";
  applyBtn.disabled = true;

  chrome.storage.local.get(["simplifiedData"], ({ simplifiedData }) => {
    if (!simplifiedData) {
      applyBtn.textContent = "No data";
      setTimeout(() => {
        applyBtn.textContent = "Apply";
        applyBtn.disabled = false;
      }, 1500);
      return;
    }

    chrome.runtime.sendMessage(
      { action: "setCookies", cookies: simplifiedData.cookies },
      (response) => {
        applyBtn.textContent = response?.success ? "Applied!" : "Error";
        setTimeout(() => {
          applyBtn.textContent = "Apply";
          applyBtn.disabled = false;
        }, 1500);
      }
    );
  });
});

// --- Render credentials (normal mode apply tab) ---
function renderCredentials() {
  const list = document.getElementById("credentialsList");
  const empty = document.getElementById("emptyState");

  chrome.storage.local.get(["credentials"], ({ credentials = {} }) => {
    list.innerHTML = "";
    const entries = Object.entries(credentials);

    if (!entries.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    entries.forEach(([platform, data]) => {
      const item = document.createElement("div");
      item.classList.add("credential-item");
      item.innerHTML = `
        <div class="credential-info">
          <span class="credential-name">${platform}</span>
          <span class="credential-domain">${data.domain || ""}</span>
        </div>
        <div class="credential-actions">
          <button class="button button-primary apply-btn" type="button">Apply</button>
          <button class="button button-cancel delete-btn" type="button">×</button>
        </div>
      `;

      item.querySelector(".apply-btn").addEventListener("click", () => {
        const applyBtn = item.querySelector(".apply-btn");
        applyBtn.textContent = "Applying...";
        applyBtn.disabled = true;
        chrome.runtime.sendMessage(
          { action: "setCookies", cookies: data.cookies },
          (response) => {
            applyBtn.textContent = response?.success ? "Applied!" : "Error";
            setTimeout(() => {
              applyBtn.textContent = "Apply";
              applyBtn.disabled = false;
            }, 1500);
          }
        );
      });

      item.querySelector(".delete-btn").addEventListener("click", () => {
        chrome.storage.local.get(["credentials"], ({ credentials = {} }) => {
          delete credentials[platform];
          chrome.storage.local.set({ credentials }, () => {
            item.remove();
            if (!Object.keys(credentials).length) empty.style.display = "block";
          });
        });
      });

      list.appendChild(item);
    });
  });
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["fieldNames", "simplifiedMode"], ({ fieldNames, simplifiedMode }) => {
    if (fieldNames?.length) {
      fieldNames.forEach((name) => addField(name));
    } else {
      addField();
    }

    if (simplifiedMode) {
      document.getElementById("simplifiedToggle").checked = true;
      applySimplifiedMode(true);
    }
  });
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("name").value = "";
});

form.addEventListener("submit", saveFormData);
