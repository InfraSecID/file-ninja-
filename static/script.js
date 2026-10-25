document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const browseBtn = document.getElementById("browse-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const uploadStatus = document.getElementById("upload-status");
  const uploadStatusText = document.getElementById("upload-status-text");
  const uploadPercentage = document.getElementById("upload-percentage");
  const progressBar = document.getElementById("progress-bar");
  const fileList = document.getElementById("file-list");
  const fileCount = document.getElementById("file-count");

  // Load initial file list
  fetchFiles();

  // AUTO REFRESH: Cek update file baru tiap 3 detik biar sinkron antara HP dan Laptop
  setInterval(() => {
    fetchFiles();
  }, 3000);

  // Refresh button handler
  refreshBtn.addEventListener("click", () => {
    fetchFiles();
  });

  // Click to open file dialog
  browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  // Handle selected files via file input
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
      fileInput.value = "";
    }
  });

  // Drag and Drop events
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      () => {
        dropZone.classList.add("drag-over");
      },
      false,
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      () => {
        dropZone.classList.remove("drag-over");
      },
      false,
    );
  });

  dropZone.addEventListener("drop", (e) => {
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // 1. GET /files -> Display files in the list
  async function fetchFiles() {
    try {
      const response = await fetch("/files");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const files = await response.json();
      renderFileList(files);
    } catch (error) {
      console.error("Error loading files:", error);
      fileList.innerHTML = `
                <div class="empty-state">
                    <p>Could not load files. Please try refreshing.</p>
                </div>
            `;
    }
  }

  function renderFileList(files) {
    fileCount.textContent = `${files.length} ${files.length === 1 ? "file" : "files"}`;
    fileList.innerHTML = "";

    if (!files || files.length === 0) {
      fileList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <p>No files dropped yet. Drag and drop a file above to get started!</p>
                </div>
            `;
      return;
    }

    files.forEach((file) => {
      const card = document.createElement("div");
      card.className = "file-card";

      // Info section
      const infoDiv = document.createElement("div");
      infoDiv.className = "file-info";

      const iconDiv = document.createElement("div");
      iconDiv.className = "file-icon";
      iconDiv.innerHTML = `
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            `;

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "file-details";

      const nameEl = document.createElement("span");
      nameEl.className = "file-name";
      nameEl.textContent = file.name;
      nameEl.title = file.name;

      const sizeEl = document.createElement("span");
      sizeEl.className = "file-size";
      sizeEl.textContent = file.size;

      detailsDiv.appendChild(nameEl);
      detailsDiv.appendChild(sizeEl);
      infoDiv.appendChild(iconDiv);
      infoDiv.appendChild(detailsDiv);

      // Actions section
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "file-actions";

      // 3. GET /download/<filename> -> Direct link to download a file
      const downloadLink = document.createElement("a");
      downloadLink.href = `/download/${encodeURIComponent(file.name)}`;
      downloadLink.className = "btn btn-primary";
      downloadLink.setAttribute("download", file.name);
      downloadLink.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download</span>
            `;

      // 4. POST /delete/<filename> -> Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-danger";
      deleteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete</span>
            `;
      deleteBtn.addEventListener("click", () => deleteFile(file.name));

      actionsDiv.appendChild(downloadLink);
      actionsDiv.appendChild(deleteBtn);

      card.appendChild(infoDiv);
      card.appendChild(actionsDiv);
      fileList.appendChild(card);
    });
  }

  // 2. POST /upload -> Upload files using fetch and FormData with key 'file'
  async function handleFiles(files) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    uploadStatus.classList.remove("hidden");
    progressBar.classList.remove("indeterminate");
    progressBar.style.width = "0%";

    for (let i = 0; i < fileArray.length; i++) {
      const currentFile = fileArray[i];
      const stepPercent = Math.round((i / fileArray.length) * 100);
      uploadStatusText.textContent = `Uploading ${currentFile.name} (${i + 1}/${fileArray.length})...`;
      uploadPercentage.textContent = `${stepPercent}%`;
      progressBar.style.width = `${Math.max(15, stepPercent)}%`;

      const formData = new FormData();
      formData.append("file", currentFile);

      try {
        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || `Failed to upload ${currentFile.name}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert(error.message || "An error occurred while uploading the file.");
      }
    }

    // Complete progress
    progressBar.style.width = "100%";
    uploadPercentage.textContent = "100%";
    uploadStatusText.textContent = "Upload complete!";

    await fetchFiles();

    setTimeout(() => {
      uploadStatus.classList.add("hidden");
      progressBar.style.width = "0%";
      uploadPercentage.textContent = "";
    }, 1200);
  }

  // 4. POST /delete/<filename> -> Prompt for password and send JSON {"password": "..."}
  async function deleteFile(filename) {
    const password = window.prompt(`Enter ninja password to delete "${filename}":`);
    if (password === null) {
      return; // User cancelled prompt
    }

    try {
      const response = await fetch(`/delete/${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 403) {
        alert(data.error || "403 Forbidden: Invalid password!");
        return;
      }

      if (!response.ok) {
        alert(data.error || "Failed to delete file.");
        return;
      }

      await fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("An error occurred while trying to delete the file.");
    }
  }
});
