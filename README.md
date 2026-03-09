## Credentials Changer

A Chrome extension to capture cookies from any tab and apply them to another — useful for switching between environments like production and localhost.

### Features

- **Save credentials:** Capture specific cookies from the active tab and save them under a named profile.
- **Apply credentials:** Apply saved cookies to the current tab with one click.
- **Custom fields:** Configure which cookie names to capture per session.
- **Local storage:** All credentials are stored locally in the browser — nothing is sent externally.

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/gabrielSantos1101/credentials-changer
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the project folder

### Usage

1. Click the extension icon in the Chrome toolbar
2. In the **Save** tab:
   - Enter a profile name (e.g. `production`)
   - Add the cookie names you want to capture (e.g. `token`, `session_id`)
   - Click **Save** — the cookies will be read from the current active tab
3. In the **Apply** tab:
   - Navigate to the target tab (e.g. localhost)
   - Click **Apply** on the desired profile to inject those cookies

### Technologies

- Manifest V3
- Chrome Extensions API (`cookies`, `storage`, `tabs`)
- Vanilla HTML, CSS, JavaScript

### Contributing

1. Fork this repository
2. Create a new branch
3. Make your changes and commit
4. Submit a pull request

### License

MIT
