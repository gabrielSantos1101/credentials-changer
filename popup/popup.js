function getCookieValue(fieldName) {
  const cookiesString = document.cookie;
  const cookiesArray = cookiesString.split("; ");

  for (const cookie of cookiesArray) {
    const [name, value] = cookie.split("=");
    if (name === fieldName) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

function saveFormData(event) {
  event.preventDefault();

  let fieldsContainer = document.getElementById("fieldsContainer");
  let fields = fieldsContainer.querySelectorAll(".input-field input");
  let formData = {};

  fields.forEach((field) => {
    let cookieName = field.value;
    formData[cookieName] = getCookieValue(cookieName);
  });

  chrome.storage.local.set({ formData }, () => {
    console.log(formData);
    window.alert('Dados do formulário salvos com sucesso!');
  });
}

function addField() {
  let randomId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  let label = document.createElement("label");
  label.classList.add("form-label", "input-group");
  label.id = randomId;
  label.innerHTML = `
    <div class="input-field">
      <input type="text" class="" placeholder="Field" />
      <button class="custom-field-button add-field" id="addField-${randomId}" type="button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
      </button>
      <button class="custom-field-button subtract-field" type="button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14"></path>
        </svg>
      </button>
    </div>
  `;

  label.querySelector(".subtract-field").addEventListener("click", () => {
    label.remove();
  });

  let fieldsContainer = document.getElementById("fieldsContainer");
  fieldsContainer.appendChild(label);

  attachAddFieldEvent(label, randomId);
}

function attachAddFieldEvent(label, randomId) {
  label
    .querySelector(`#addField-${randomId}`)
    .addEventListener("click", addField);
}

document.addEventListener("DOMContentLoaded", () => {
  addField();
  const form = document.getElementById("form");
  form.addEventListener("submit", saveFormData);
});
