# Phase 9: Cross-Platform Build Scripts & Automation

## Objective
Develop robust build scripts and automation for packaging and distributing SignBridge on Windows, macOS, Linux, and Snapdragon X Elite. This phase ensures that contributors and CI/CD pipelines can reliably produce installers for all supported platforms.

---

## Key Goals
- Provide one-command build scripts for each platform
- Automate frontend, backend, and Tauri packaging steps
- Support local and CI/CD builds
- Document all build and release steps

---

## Implementation Steps

### 1. **Script Structure & Organization**
- Place all build scripts in a `scripts/` directory at the project root
- Use platform-specific scripts:
  - `build-win.sh` (Windows, Bash or PowerShell)
  - `build-mac.sh` (macOS)
  - `build-linux.sh` (Linux)
  - `build-snapdragon.sh` (Snapdragon Linux/Windows)
- Provide a generic `build-all.sh` to build for all platforms (for CI/CD)

### 2. **Frontend Build Automation**
- Script step: `npm install && npm run build` (or Tauri equivalent)
- Ensure all static assets and fonts are included in the build output

### 3. **Backend Build/Bundle Automation**
- Script step: Set up Python venv and install dependencies
- Optionally, use PyInstaller to bundle the backend as a standalone binary for each platform
- Copy backend artifacts to the Tauri `src-tauri/` or appropriate directory

### 4. **Tauri Packaging**
- Script step: `npx tauri build --target <platform>`
- Pass environment variables or config as needed
- Ensure sidecar configuration is correct for each platform

### 5. **Platform-Specific Packaging**
- Windows: produce `.exe` installer
- macOS: produce `.dmg` or `.app` bundle
- Linux: produce `.AppImage`, `.deb`, or `.rpm`
- Snapdragon: cross-compile as needed (document toolchain requirements)
- Add code-signing steps if required (optional, for production)

### 6. **CI/CD Integration**
- Provide GitHub Actions workflows or similar for:
  - Building and testing on push/PR
  - Packaging and uploading artifacts for each platform
  - (Optional) Automated release creation
- Example: `.github/workflows/build.yml`

### 7. **Testing & Verification**
- Each script should verify build success and output location
- Add checks for missing dependencies (Node, Python, Rust, etc.)
- Test installers on clean VMs or containers for each platform

### 8. **Documentation**
- Update main README and/or `scripts/README.md` with:
  - How to run each build script
  - Prerequisites for each platform
  - Troubleshooting common issues
  - How to add new build targets

---

## Deliverables
- Platform-specific build scripts in `scripts/`
- CI/CD workflow files (e.g., GitHub Actions)
- Updated documentation
- Verified installers for all platforms

---

## References
- [Tauri Build Docs](https://tauri.app/v1/guides/building/)
- [PyInstaller](https://pyinstaller.org/)
- [GitHub Actions](https://docs.github.com/en/actions) 