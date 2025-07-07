const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class BrowserControllerServer {
    constructor(port = 8080) {
        this.port = port;
        this.wss = null;
        this.extensionConnection = null;
        this.pendingCommands = new Map();
        this.commandQueue = [];
        this.isProcessingQueue = false;
        
        this.init();
    }

    init() {
        this.wss = new WebSocket.Server({ port: this.port });
        console.log(`🚀 Browser Controller Server started on port ${this.port}`);

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection from:', req.socket.remoteAddress);
            
            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });

            ws.on('close', () => {
                console.log('❌ WebSocket connection closed');
                if (ws === this.extensionConnection) {
                    this.extensionConnection = null;
                    console.log('⚠️  Extension disconnected - commands will be queued');
                }
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
            });
        });

        console.log('✅ Server ready to receive extension connections');
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            console.log('📨 Received message:', message.type);

            switch (message.type) {
                case 'extension_connected':
                    this.extensionConnection = ws;
                    console.log('✅ Extension connected and ready for commands');
                    this.processCommandQueue();
                    break;

                case 'command_response':
                    this.handleCommandResponse(message);
                    break;

                case 'ping':
                    // Respond to ping to keep connection alive
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                default:
                    console.log('❓ Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    }

    handleCommandResponse(response) {
        const { commandId } = response;
        const pendingCommand = this.pendingCommands.get(commandId);
        
        if (pendingCommand) {
            console.log(`✅ Command ${commandId} completed:`, response.success ? 'SUCCESS' : 'FAILED');
            if (response.error) {
                console.error(`❌ Command ${commandId} error:`, response.error);
            }
            
            // Resolve the pending promise
            pendingCommand.resolve(response);
            this.pendingCommands.delete(commandId);
        } else {
            console.warn(`⚠️  Received response for unknown command: ${commandId}`);
        }
    }

    async sendCommand(command) {
        const commandId = uuidv4();
        const commandWithId = { ...command, id: commandId };

        return new Promise((resolve, reject) => {
            if (!this.extensionConnection) {
                console.log('⏳ Extension not connected, queuing command');
                this.commandQueue.push({ command: commandWithId, resolve, reject });
                return;
            }

            // Set timeout for command response
            const timeout = setTimeout(() => {
                this.pendingCommands.delete(commandId);
                reject(new Error(`Command timeout: ${command.command}`));
            }, 30000); // 30 second timeout

            this.pendingCommands.set(commandId, {
                resolve: (response) => {
                    clearTimeout(timeout);
                    resolve(response);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            });

            try {
                this.extensionConnection.send(JSON.stringify(commandWithId));
                console.log(`📤 Sent command: ${command.command} (ID: ${commandId})`);
            } catch (error) {
                this.pendingCommands.delete(commandId);
                reject(error);
            }
        });
    }

    async processCommandQueue() {
        if (this.isProcessingQueue || this.commandQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        console.log(`🔄 Processing ${this.commandQueue.length} queued commands`);

        while (this.commandQueue.length > 0) {
            const { command, resolve, reject } = this.commandQueue.shift();
            
            try {
                const response = await this.sendCommand(command);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        }

        this.isProcessingQueue = false;
    }

    // Convenience methods for common commands
    async click(selector) {
        return this.sendCommand({ command: 'click', selector });
    }

    async type(selector, text) {
        return this.sendCommand({ command: 'type', selector, text });
    }

    async navigate(url) {
        return this.sendCommand({ command: 'navigate', url });
    }

    async waitForElement(selector, timeout = 10000) {
        return this.sendCommand({ command: 'waitForElement', selector, timeout });
    }

    async getText(selector) {
        return this.sendCommand({ command: 'getText', selector });
    }

    // Utility method to check if extension is connected
    isExtensionConnected() {
        return this.extensionConnection !== null;
    }

    // Get server status
    getStatus() {
        return {
            port: this.port,
            extensionConnected: this.isExtensionConnected(),
            pendingCommands: this.pendingCommands.size,
            queuedCommands: this.commandQueue.length
        };
    }

    async createTab(url = 'https://google.com') {
        return this.sendCommand({ command: 'navigate', url });
    }
}

// Create and export server instance
const server = new BrowserControllerServer();

// Export for use in other modules
module.exports = server;

// Example usage and testing
if (require.main === module) {
    // This runs when server.js is executed directly
    
    // Example: Test commands after a delay
    setTimeout(async () => {
        if (server.isExtensionConnected()) {
            console.log('\n🧪 Testing browser commands...');
            
            try {
                // Navigate to a test page
                console.log('🌐 Navigating to Google...');
                await server.navigate('https://www.google.com');
                
                // Wait a bit for page to load
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Type in search box
                console.log('⌨️  Typing search query...');
                await server.type('input[name="q"]', 'browser automation');
                
                // Wait a bit
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Click search button
                console.log('🔍 Clicking search...');
                await server.click('input[name="btnK"]');
                
                console.log('✅ Test completed successfully!');
                
            } catch (error) {
                console.error('❌ Test failed:', error.message);
            }
        } else {
            console.log('⚠️  Extension not connected - cannot run test');
        }
    }, 5000);
} 