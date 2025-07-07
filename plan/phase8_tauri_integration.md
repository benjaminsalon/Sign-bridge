# Phase 8: Tauri Integration & Cross-Platform Packaging

## Objective
Transition the SignBridge frontend from Vite to Tauri, integrate the Python backend as a Tauri sidecar, and enable cross-platform packaging (Windows, macOS, Linux, Snapdragon X Elite). This phase ensures the app is fully distributable, secure, and easy to install for end users.

---

## Key Goals
- Replace Vite dev server with Tauri for desktop app packaging
- Integrate Python FastAPI backend as a Tauri sidecar (auto-start/stop)
- Enable cross-platform builds (Win/macOS/Linux/Snapdragon)
- Secure API communication between frontend and backend
- Provide build scripts and documentation for contributors

---

## Implementation Steps

### 1. **Initial Tauri Setup**
- Install Tauri CLI and dependencies:
  - `npm install --save-dev @tauri-apps/cli`
  - `cargo install tauri-cli` (requires Rust)
- Scaffold Tauri in the existing frontend directory:
  - `npx tauri init`
  - Configure Tauri to use the existing React/TypeScript frontend
- Update `package.json` scripts:
  - Replace Vite dev scripts with Tauri dev/build scripts
  - Example:
    - `"dev": "tauri dev"`
    - `"build": "tauri build"`

### 2. **Frontend Adaptation**
- Update frontend API calls to use `http://localhost:PORT` (Tauri sidecar backend)
- Ensure all static assets/fonts are bundled with Tauri
- Test frontend in Tauri dev mode (`npm run dev` or `tauri dev`)

### 3. **Python Backend as Tauri Sidecar**
- Move/copy Python backend to a subdirectory (e.g., `backend/`)
- In `tauri.conf.json`, configure the Python backend as a sidecar:
  - Specify the Python executable and entrypoint (e.g., `uvicorn backend.main:app`)
  - Set up environment variables (e.g., `.env` for API keys)
  - Ensure the backend starts/stops with the Tauri app
- Add logic to check for Python environment and install dependencies on first run (optional: use PyInstaller to bundle Python backend as a binary for easier distribution)

### 4. **Cross-Platform Packaging**
- Update Tauri config for all target platforms:
  - Windows: `.exe` installer
  - macOS: `.dmg` or `.app`
  - Linux: `.AppImage`, `.deb`, or `.rpm`
  - Snapdragon: cross-compile as needed
- Add platform-specific icons, metadata, and signing (if required)
- Test builds on each platform (use CI/CD or local VMs)

### 5. **Build Scripts & Automation**
- Create shell scripts or npm scripts for:
  - Building frontend assets
  - Packaging with Tauri for each platform
  - Running/installing the Python backend (if not bundled)
- Example scripts:
  - `build-win.sh`, `build-mac.sh`, `build-linux.sh`
  - `install-backend.sh` (for Python venv setup)
- Document all scripts in the main README

### 6. **Security & API Communication**
- Restrict backend API to localhost only
- Use Tauri's IPC for sensitive operations if needed
- Ensure no sensitive data is exposed in production builds

### 7. **Testing & QA**
- Test full app workflow on all platforms
- Verify sidecar backend starts/stops with the app
- Check for port conflicts, firewall issues, and permissions
- Test auto-update (optional, Tauri supports this)

### 8. **Documentation**
- Update README with:
  - Tauri setup instructions
  - Build/run steps for each platform
  - Troubleshooting tips
  - How to add new sidecars or backend endpoints

---

## Deliverables
- Tauri-based desktop app for all platforms
- Python backend integrated as a sidecar
- Build scripts for Windows, macOS, Linux, and Snapdragon
- Updated documentation
- Tested installers for all platforms

---

## References
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri Sidecar Guide](https://tauri.app/v1/guides/advanced/sidecar/)
- [PyInstaller](https://pyinstaller.org/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/) 