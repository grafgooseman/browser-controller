# Native Messaging Host for Browser Controller

This folder contains the native messaging host that acts as a proxy between the Chrome extension and your local/remote server.

## Files
- `native-host.js`: Node.js script that connects to your server and relays messages to/from the Chrome extension.
- `manifest.json`: Native messaging host manifest. You must update the `allowed_origins` with your extension's ID and register this manifest with Chrome.

## Setup

1. **Install dependencies:**
   ```
   cd native-host
   npm install
   ```

2. **Update manifest.json:**
   - Replace `__EXTENSION_ID__` in `allowed_origins` with your actual Chrome extension ID.
   - Ensure the `path` field points to the correct location of `native-host.js` (use double backslashes on Windows).

3. **Register the native host:**
   - On **Windows**, add a registry key:
     ```
     REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.browser_controller.native_host" /ve /t REG_SZ /d "E:\peace-doors\browser-controller\native-host\manifest.json"
     ```
   - On **Linux/macOS**, copy `manifest.json` to the appropriate directory (see Chrome docs).

4. **Run the native host:**
   - The host will be started automatically by Chrome when the extension connects.
   - For debugging, you can run it manually:
     ```
     node native-host.js
     ```

## Reference
- [Chrome Extensions: Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) 