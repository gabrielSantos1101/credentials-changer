const form = document.getElementById("form");
const fieldsContainer = document.getElementById("fieldsContainer");

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "apply") renderCredentials();
  });
});

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
      <input type="text" placeholder="Nome do cookie (ex: token)" value="${name}" />
      <button class="custom-field-button add-field" type="button" title="Adicionar campo">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path><path d="M12 5v14"></path>
        </svg>
      </button>
      <button class="custom-field-button subtract-field" type="button" title="Remover campo">
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

function saveFormData(event) {
  event.preventDefault();
  const platform = document.getElementById("name").value.trim();
  if (!platform) return;

  const fieldNames = getFieldNames();
  if (!fieldNames.length) return;

  saveFieldNames();

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.textContent = "Salvando...";
  saveBtn.disabled = true;

  chrome.runtime.sendMessage(
    { action: "getCookieValues", cookieNames: fieldNames, platform },
    (response) => {
      if (!response) {
        saveBtn.textContent = "Erro";
        setTimeout(() => {
          saveBtn.textContent = "Salvar";
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
          saveBtn.textContent = "Salvo!";
          setTimeout(() => {
            saveBtn.textContent = "Salvar";
            saveBtn.disabled = false;
          }, 1500);
        });
      });
    }
  );
}

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
          <button class="button button-primary apply-btn" type="button">Aplicar</button>
          <button class="button button-cancel delete-btn" type="button">×</button>
        </div>
      `;

      item.querySelector(".apply-btn").addEventListener("click", () => {
        const applyBtn = item.querySelector(".apply-btn");
        applyBtn.textContent = "Aplicando...";
        applyBtn.disabled = true;
        chrome.runtime.sendMessage(
          { action: "setCookies", cookies: data.cookies },
          (response) => {
            applyBtn.textContent = response?.success ? "Aplicado!" : "Erro";
            setTimeout(() => {
              applyBtn.textContent = "Aplicar";
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

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["fieldNames"], ({ fieldNames }) => {
    if (fieldNames?.length) {
      fieldNames.forEach((name) => addField(name));
    } else {
      addField();
    }
  });
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("name").value = "";
});

form.addEventListener("submit", saveFormData);
