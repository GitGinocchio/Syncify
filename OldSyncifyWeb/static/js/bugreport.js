document.getElementById('bug-file').addEventListener('change', function() {
    const fileInput = this;
    const file = fileInput.files[0];
    const warningMessage = document.getElementById('file-warning');
    const submitButton = document.getElementById('submit-button');

    if (file && file.size > 25 * 1024 * 1024) { // 25 MB in bytes
      warningMessage.textContent = 'The file size exceeds 25 MB. Please choose a smaller file.';
      warningMessage.style.display = 'block';
      submitButton.disabled = true;
    } else {
      warningMessage.textContent = '';
      warningMessage.style.display = 'none';
      submitButton.disabled = false;
    }
  });