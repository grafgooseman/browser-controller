const readline = require('readline');
const server = require('./server');

class BrowserControllerCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.commands = {
            'help': this.showHelp.bind(this),
            'status': this.showStatus.bind(this),
            'click': this.handleClick.bind(this),
            'type': this.handleType.bind(this),
            'navigate': this.handleNavigate.bind(this),
            'wait': this.handleWait.bind(this),
            'gettext': this.handleGetText.bind(this),
            'test': this.runTest.bind(this),
            'quit': this.quit.bind(this),
            'createtab': this.handleCreateTab.bind(this)
        };
    }

    async start() {
        console.log('🎮 Browser Controller CLI');
        console.log('Type "help" for available commands');
        console.log('Waiting for extension connection...\n');
        
        // Wait for extension to connect
        while (!server.isExtensionConnected()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            process.stdout.write('.');
        }
        
        console.log('\n✅ Extension connected! Ready for commands.\n');
        this.prompt();
    }

    prompt() {
        this.rl.question('🎯 Command: ', async (input) => {
            const parts = input.trim().split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            if (this.commands[command]) {
                try {
                    await this.commands[command](args);
                } catch (error) {
                    console.error('❌ Error:', error.message);
                }
            } else {
                console.log('❓ Unknown command. Type "help" for available commands.');
            }

            this.prompt();
        });
    }

    showHelp() {
        console.log('\n📖 Available Commands:');
        console.log('  help                    - Show this help');
        console.log('  status                  - Show server status');
        console.log('  click <selector>        - Click an element');
        console.log('  type <selector> <text>  - Type text into an element');
        console.log('  navigate <url>          - Navigate to URL');
        console.log('  wait <selector> [timeout] - Wait for element to appear');
        console.log('  gettext <selector>      - Get text from element');
        console.log('  test                    - Run automated test');
        console.log('  quit                    - Exit CLI');
        console.log('  createtab <url>         - Create a new tab');
        console.log('\n');
    }

    showStatus() {
        const status = server.getStatus();
        console.log('\n📊 Server Status:');
        console.log(`  Port: ${status.port}`);
        console.log(`  Extension Connected: ${status.extensionConnected ? '✅' : '❌'}`);
        console.log(`  Pending Commands: ${status.pendingCommands}`);
        console.log(`  Queued Commands: ${status.queuedCommands}\n`);
    }

    async handleClick(args) {
        if (args.length < 1) {
            console.log('❌ Usage: click <selector>');
            return;
        }
        
        const selector = args[0];
        console.log(`🖱️  Clicking: ${selector}`);
        
        const result = await server.click(selector);
        console.log(`✅ ${result.message}\n`);
    }

    async handleType(args) {
        if (args.length < 2) {
            console.log('❌ Usage: type <selector> <text>');
            return;
        }
        
        const selector = args[0];
        const text = args.slice(1).join(' ');
        console.log(`⌨️  Typing "${text}" into: ${selector}`);
        
        const result = await server.type(selector, text);
        console.log(`✅ ${result.message}\n`);
    }

    async handleNavigate(args) {
        if (args.length < 1) {
            console.log('❌ Usage: navigate <url>');
            return;
        }
        
        const url = args[0];
        console.log(`🌐 Navigating to: ${url}`);
        
        const result = await server.navigate(url);
        console.log(`✅ ${result.message}\n`);
    }

    async handleWait(args) {
        if (args.length < 1) {
            console.log('❌ Usage: wait <selector> [timeout]');
            return;
        }
        
        const selector = args[0];
        const timeout = args[1] ? parseInt(args[1]) : 10000;
        console.log(`⏳ Waiting for: ${selector} (timeout: ${timeout}ms)`);
        
        const result = await server.waitForElement(selector, timeout);
        console.log(`✅ ${result.message}\n`);
    }

    async handleGetText(args) {
        if (args.length < 1) {
            console.log('❌ Usage: gettext <selector>');
            return;
        }
        
        const selector = args[0];
        console.log(`📄 Getting text from: ${selector}`);
        
        const result = await server.getText(selector);
        console.log(`📝 Text: "${result.text}"\n`);
    }

    async runTest() {
        console.log('\n🧪 Running automated test...');
        
        try {
            // Navigate to Google
            console.log('🌐 Navigating to Google...');
            await server.navigate('https://www.google.com');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Type search query
            console.log('⌨️  Typing search query...');
            await server.type('input[name="q"]', 'browser automation test');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Click search
            console.log('🔍 Clicking search...');
            await server.click('input[name="btnK"]');
            
            // Wait for results
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get first result text
            console.log('📄 Getting first result...');
            const result = await server.getText('h3');
            console.log(`📝 First result: "${result.text}"`);
            
            console.log('✅ Test completed successfully!\n');
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }

    async handleCreateTab(args) {
        const url = args[0] || 'https://google.com';
        console.log(`🆕 Creating new tab with: ${url}`);
        try {
            const result = await server.createTab(url);
            console.log(`✅ ${result.message}\n`);
        } catch (error) {
            console.error('❌ Failed to create tab:', error.message);
        }
    }

    quit() {
        console.log('👋 Goodbye!');
        this.rl.close();
        process.exit(0);
    }
}

// Start CLI if this file is run directly
if (require.main === module) {
    const cli = new BrowserControllerCLI();
    cli.start();
}

module.exports = BrowserControllerCLI; 