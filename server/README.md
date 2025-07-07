# Browser Controller Server

A Node.js WebSocket server that controls Chrome browser automation through a Chrome extension.

## Features

- **WebSocket Communication**: Real-time communication with Chrome extension
- **Human-like Interactions**: Undetectable browser automation with natural timing
- **Command Queue**: Commands are queued when extension is disconnected
- **CLI Interface**: Interactive command-line interface for testing
- **Robust Error Handling**: Timeout handling and reconnection logic

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extention/` folder
4. The extension should now be loaded and will attempt to connect to the server

### 3. Start the Server

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

## Usage

### Command Line Interface

Start the interactive CLI:

```bash
node cli.js
```

Available commands:
- `help` - Show available commands
- `status` - Show server status
- `click <selector>` - Click an element
- `type <selector> <text>` - Type text into an element
- `navigate <url>` - Navigate to URL
- `wait <selector> [timeout]` - Wait for element to appear
- `gettext <selector>` - Get text from element
- `test` - Run automated test
- `quit` - Exit CLI

### Programmatic Usage

```javascript
const server = require('./server');

// Wait for extension to connect
while (!server.isExtensionConnected()) {
    await new Promise(resolve => setTimeout(resolve, 1000));
}

// Send commands
await server.navigate('https://www.google.com');
await server.type('input[name="q"]', 'browser automation');
await server.click('input[name="btnK"]');
```

## Available Commands

### 1. Click
```javascript
await server.click('#submit-button');
```

### 2. Type
```javascript
await server.type('#email-input', 'user@example.com');
```

### 3. Navigate
```javascript
await server.navigate('https://example.com');
```

### 4. Wait for Element
```javascript
await server.waitForElement('#dynamic-content', 5000);
```

### 5. Get Text
```javascript
const result = await server.getText('.title');
console.log(result.text);
```

## Human-Like Features

The extension implements sophisticated human-like behavior:

- **Random Delays**: 50-200ms between actions
- **Variable Typing Speed**: Different speeds for vowels, consonants, and spaces
- **Natural Mouse Events**: Complete mouse event sequence (enter → over → down → up → click)
- **Click Position Randomness**: ±5px offset from element center
- **Thinking Pauses**: Occasional longer pauses during typing
- **Smooth Scrolling**: Natural scroll behavior to bring elements into view

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Node.js       │ ◄─────────────► │   Chrome        │
│   Server        │                 │   Extension     │
│                 │                 │                 │
│  - Command      │                 │  - Background   │
│    Queue        │                 │    Script       │
│  - WebSocket    │                 │  - Content      │
│    Handler      │                 │    Script       │
└─────────────────┘                 └─────────────────┘
```

## Troubleshooting

### Extension Not Connecting

1. Check that the extension is loaded in Chrome
2. Verify the WebSocket URL in `background.js` matches the server port
3. Check browser console for connection errors
4. Ensure no firewall is blocking port 8080

### Commands Not Working

1. Verify the extension is connected (`status` command)
2. Check that the page is fully loaded
3. Ensure CSS selectors are correct
4. Check browser console for JavaScript errors

### Performance Issues

1. Reduce typing speed by modifying delays in `content.js`
2. Increase timeout values for slow-loading pages
3. Use more specific CSS selectors for faster element finding

## Security Considerations

- The server only accepts connections from localhost
- No authentication is implemented (for local development only)
- Consider adding authentication for production use
- Be careful with sensitive data in commands

## Development

### Adding New Commands

1. Add command handler in `content.js`
2. Add convenience method in `server.js`
3. Add CLI handler in `cli.js`
4. Update documentation

### Testing

Run the automated test:
```bash
node cli.js
# Then type: test
```

## License

MIT License 