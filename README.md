# FileNinja
<img width="1916" height="821" alt="Cyber-Ninja Riding a Neon Sky Whale" src="https://github.com/user-attachments/assets/c19ddcf6-0e2d-4d20-a5c8-f15cdaeebf8e" />

FileNinja is a simple Flask web application for uploading, listing, downloading, and deleting files through a browser. Files are stored in the `uploads/` directory, which Docker Compose keeps on the host so files remain available when the application container is recreated.

The interface uses HTML, CSS, and vanilla JavaScript. Users can select multiple files or drag them into the upload area. The file list refreshes automatically every three seconds.

## Project contents

| Path | Purpose |
| --- | --- |
| `app.py` | Flask server and file listing, upload, download, and delete endpoints. |
| `templates/index.html` | FileNinja page structure. |
| `static/style.css` | Dark theme, responsive layout, and component styles. |
| `static/script.js` | Browser interactions and API requests. |
| `requirements.txt` | Python dependencies for the application. |
| `Dockerfile` | Builds the application image based on Python 3.11 slim. |
| `docker-compose.yml` | Runs the application and Cloudflare Tunnel. |
| `uploads/` | File storage. Compose mounts this directory from the host. |
| `prompt.txt` | Prompt/instructions used when creating the UI; not part of the application's runtime configuration. |

## Technologies and dependencies

- **Python 3.11**: Runtime used by the Docker image. For running the application directly, use Python 3.11 or a compatible version.
- **Flask 3.0.2**: Web server and routing.
- **Werkzeug 3.0.1**: Flask utility library, including `secure_filename` for sanitizing uploaded filenames.
- **Docker and Docker Compose** (optional): Build and run the application in containers.
- **Cloudflare Tunnel (`cloudflared`)** (optional): A separate Compose service that creates an outbound tunnel to the application.
- **Modern browser**: Runs the interface and Fetch API requests.
- **Internet access for Google Fonts**: The page loads Inter from Google Fonts; the application remains usable if the font is unavailable.

The application's Python dependencies are listed in `requirements.txt`. `cloudflared` is not a Python dependency; Compose runs it as a separate service.

## Run with Docker Compose

### Prerequisites

Install Docker Engine or Docker Desktop with the `docker compose` command. From a terminal, go to the project directory:

```bash
cd /home/hidayat/file-ninja
```

### Set the delete password

Before starting the application, change `APP_PASSWORD` in `docker-compose.yml` from the example value `admin123` to your chosen password. The browser will ask for this password when deleting a file.

Do not use the example password if the application may be accessible to other people. Do not commit a Compose file containing a real password to a public repository.

### Build and start

```bash
docker compose up --build -d
```

Open the application at:

```text
http://localhost:5000
```

To stop the containers:

```bash
docker compose down
```

`docker compose down` does not remove the host `uploads/` directory. Avoid the `-v` option if you do not want to remove Docker-managed volumes; this project's configuration uses the `./uploads:/app/uploads` bind mount.

### Run the application without Cloudflare Tunnel

You can run only the application service from Compose:

```bash
docker compose up --build -d file-ninja
```

The application is mapped from host port `5000` to container port `5000`.

## Run directly with Python

The following example is for Linux/macOS:

```bash
cd /home/hidayat/file-ninja
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
APP_PASSWORD='replace-with-a-strong-password' python app.py
```

Open `http://localhost:5000`. The `uploads/` directory is created automatically if it does not exist. The server runs in the foreground; press `Ctrl+C` to stop it.

On Windows PowerShell, create and activate the virtual environment with:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
$env:APP_PASSWORD = "replace-with-a-strong-password"
python app.py
```

If `APP_PASSWORD` is not set when running Python directly, the backend uses the default password `admin123`.

## How to use

1. Open the application in a browser.
2. Select **Select Files** or drag one or more files into the upload area.
3. Wait for the upload status to finish. The file list refreshes automatically; you can also click **Refresh**.
4. Select **Download** to download a file.
5. Select **Delete**, then enter the configured `APP_PASSWORD`.

The list displays filenames and sizes in KB or MB. Uploaded filenames are sanitized using `secure_filename`.

## Available API endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /` | Displays the web page. |
| `GET /files` | Returns a JSON array containing `name`, `size`, and `date`, sorted with the newest files first. |
| `POST /upload` | Accepts `multipart/form-data` with the `file` field; a successful response includes the filename. |
| `GET /download/<filename>` | Downloads a file as an attachment. |
| `POST /delete/<filename>` | Accepts JSON `{"password":"..."}`. An incorrect password returns HTTP 403; a missing file returns HTTP 404. |

Example upload using `curl`:

```bash
curl -F "file=@./example.txt" http://localhost:5000/upload
```

Example of listing files:

```bash
curl http://localhost:5000/files
```

Example of deleting a file (replace the password):

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"password":"replace-with-a-strong-password"}' \
  http://localhost:5000/delete/example.txt
```

## File storage

In the Compose configuration, the host's `./uploads` directory is mounted at `/app/uploads` in the container. Uploaded files remain after the container is stopped or rebuilt. Any files already in that directory will also appear in the list.

The sanitized filename may differ from the original. If two uploads produce the same sanitized filename, the current implementation saves both to the same path, so the newer file may overwrite the previous one. Back up `uploads/` before maintenance operations.

## Tunnel and external access

Compose also runs `cloudflare/cloudflared:latest` with a quick tunnel to `http://file-ninja:5000`. It does not require a permanent tunnel configuration in this project. Find the generated tunnel address in the logs:

```bash
docker compose logs -f cloudflare-tunnel
```

The tunnel may make the service accessible from the internet. **Do not enable it for sensitive data or public use without additional protection.** The application currently has no general authentication: anyone who can reach it can list, upload, and download files. Only the delete endpoint is password-protected, and the provided Compose configuration uses an example password. Restrict network access and add appropriate authentication/security controls before exposing the service.

## Log analysis

The application does not write application logs to a separate file. Flask server output and process errors are available through the container's stdout/stderr. Check the relevant services:

```bash
docker compose ps
docker compose logs --tail=100 file-ninja
docker compose logs -f file-ninja
docker compose logs --tail=100 cloudflare-tunnel
```

Press `Ctrl+C` to stop following logs. When running the server directly with Python, check the terminal where `python app.py` is running.

Common symptoms and troubleshooting:

- **Container stops or repeatedly restarts**: Read the `file-ninja` logs for a traceback, import failure, or filesystem error.
- **Cannot open `localhost:5000`**: Check that the service is running with `docker compose ps`, ensure port `5000` is not being used by another process, and inspect the application logs.
- **HTTP 403 when deleting**: The submitted password does not match the `APP_PASSWORD` read by the application. In Compose, this value is set by `environment` in `docker-compose.yml`. After changing it, recreate the service with `docker compose up -d --force-recreate file-ninja`.
- **HTTP 404 when deleting/downloading**: Check the filename shown in the list and verify that the file still exists in `uploads/`.
- **Upload fails / HTTP 400**: The endpoint did not receive a `file` field or the filename was empty. Make sure the browser sends `FormData` with the `file` key.
- **HTTP 500 or `PermissionError`**: Check read/write permissions for the host `uploads/` directory and inspect the traceback. Correct ownership/permissions for the user running Docker on the host; do not use overly broad permissions without understanding the consequences.
- **The list does not change**: Ensure `GET /files` succeeds and check the browser's Console/Network panels and the application logs. The list loads when the page opens, refreshes every three seconds, and can be reloaded with **Refresh**.
- **The tunnel does not provide an address or cannot connect**: Check the `cloudflare-tunnel` logs, internet connectivity, and `file-ninja` status. The tunnel depends on the application being reachable on the Compose network.
- **The font looks different**: The browser may be unable to fetch Google Fonts; this does not prevent upload/download functionality.

## Current implementation limitations

- The application does not configure an upload size limit or file-type validation, and it does not require authentication to list, upload, or download files.
- The default password in the code is `admin123`; `docker-compose.yml` also explicitly sets this example value.
- The frontend progress bar indicates upload processing stages; it does not measure the actual number of bytes uploaded.
- Files with the same sanitized filename may overwrite existing files.
- The server runs using Flask's built-in `app.run`, not a dedicated production server.
- The tunnel service uses the `latest` image tag, so its version may change when the image is updated.

Before using the application publicly or storing important data, consider adding authentication for all operations, restricting network access, setting file size/type limits, handling duplicate filenames, backing up files, and using an appropriate production server.
