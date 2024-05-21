function togglePasswordInput() {
  var visibilitySelect = document.getElementById("visibility");
  var passwordLabel = document.getElementById("passwordLabel");
  var passwordInput = document.getElementById("passwordInput");

  if (visibilitySelect.value === "private") {
    passwordLabel.style.display = "block";
    passwordInput.required = true;
    if (passwordInput.value === "") {
       return false; // Impedisce l'invio del modulo se la password è vuota
      }
    } else {
      passwordLabel.style.display = "none";
    }
    return true; // Consente l'invio del modulo se la validazione è superata
  }
