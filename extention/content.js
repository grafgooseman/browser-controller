console.log('Browser Controller content script injected.');

// Human-like interaction utilities
class HumanSimulator {
    constructor() {
        this.lastActionTime = 0;
        this.minDelay = 50;  // Minimum delay between actions
        this.maxDelay = 200; // Maximum delay between actions
    }

    // Generate random delay between actions
    getRandomDelay() {
        return Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
    }

    // Simulate human-like mouse movement
    async moveMouseToElement(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Add slight randomness to click position (humans don't click exactly center)
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        
        return { x: centerX + offsetX, y: centerY + offsetY };
    }

    // Human-like typing with variable speed
    async typeHumanLike(element, text) {
        element.focus();
        
        // Clear existing content naturally
        if (element.value) {
            const currentLength = element.value.length;
            for (let i = 0; i < currentLength; i++) {
                element.value = element.value.slice(0, -1);
                await this.sleep(Math.random() * 50 + 20); // 20-70ms between deletions
            }
        }

        // Type each character with human-like timing
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            element.value += char;
            
            // Trigger input events to make it look natural
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Variable typing speed (faster for common characters, slower for others)
            let delay;
            if (char === ' ') {
                delay = Math.random() * 30 + 20; // 20-50ms for spaces
            } else if ('aeiou'.includes(char.toLowerCase())) {
                delay = Math.random() * 80 + 40; // 40-120ms for vowels
            } else {
                delay = Math.random() * 120 + 60; // 60-180ms for consonants
            }
            
            // Occasionally pause longer (like human thinking)
            if (Math.random() < 0.05) {
                delay += Math.random() * 500 + 200; // 200-700ms pause
            }
            
            await this.sleep(delay);
        }
    }

    // Human-like clicking with natural timing
    async clickHumanLike(element) {
        // Ensure element is visible and clickable
        if (!element.offsetParent) {
            throw new Error('Element is not visible');
        }

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.sleep(Math.random() * 300 + 200); // Wait for scroll

        // Simulate mouse events in natural order
        const mousePosition = await this.moveMouseToElement(element);
        
        // Mouse enter
        element.dispatchEvent(new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            clientX: mousePosition.x,
            clientY: mousePosition.y
        }));
        
        await this.sleep(Math.random() * 100 + 50); // Brief pause
        
        // Mouse over
        element.dispatchEvent(new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            clientX: mousePosition.x,
            clientY: mousePosition.y
        }));
        
        await this.sleep(Math.random() * 50 + 30); // Short pause before click
        
        // Mouse down
        element.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: mousePosition.x,
            clientY: mousePosition.y
        }));
        
        await this.sleep(Math.random() * 20 + 10); // Brief pause
        
        // Mouse up and click
        element.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: mousePosition.x,
            clientY: mousePosition.y
        }));
        
        element.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: mousePosition.x,
            clientY: mousePosition.y
        }));
    }

    // Wait for element with timeout
    async waitForElement(selector, timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent) {
                return element;
            }
            await this.sleep(100);
        }
        
        throw new Error(`Element ${selector} not found within ${timeout}ms`);
    }

    // Utility sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Ensure minimum delay between actions
    async ensureActionDelay() {
        const now = Date.now();
        const timeSinceLastAction = now - this.lastActionTime;
        const requiredDelay = this.getRandomDelay();
        
        if (timeSinceLastAction < requiredDelay) {
            await this.sleep(requiredDelay - timeSinceLastAction);
        }
        
        this.lastActionTime = Date.now();
    }
}

// Initialize human simulator
const humanSim = new HumanSimulator();

// Message listener for commands from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleCommand(request).then(sendResponse);
    return true; // Keep message channel open for async response
});

// Command handler
async function handleCommand(request) {
    try {
        await humanSim.ensureActionDelay();
        
        switch (request.command) {
            case 'click':
                return await handleClick(request.selector);
            case 'type':
                return await handleType(request.selector, request.text);
            case 'navigate':
                return await handleNavigate(request.url);
            case 'waitForElement':
                return await handleWaitForElement(request.selector, request.timeout);
            case 'getText':
                return await handleGetText(request.selector);
            default:
                throw new Error(`Unknown command: ${request.command}`);
        }
    } catch (error) {
        console.error('Command execution error:', error);
        return { success: false, error: error.message };
    }
}

// Click handler
async function handleClick(selector) {
    const element = await humanSim.waitForElement(selector);
    await humanSim.clickHumanLike(element);
    return { success: true, message: `Clicked ${selector}` };
}

// Type handler
async function handleType(selector, text) {
    const element = await humanSim.waitForElement(selector);
    await humanSim.typeHumanLike(element, text);
    return { success: true, message: `Typed "${text}" into ${selector}` };
}

// Navigate handler (delegated to background script)
async function handleNavigate(url) {
    // Send navigation request to background script
    chrome.runtime.sendMessage({ command: 'navigate', url: url });
    return { success: true, message: `Navigating to ${url}` };
}

// Wait for element handler
async function handleWaitForElement(selector, timeout) {
    const element = await humanSim.waitForElement(selector, timeout);
    return { success: true, message: `Element ${selector} found`, element: true };
}

// Get text handler
async function handleGetText(selector) {
    const element = await humanSim.waitForElement(selector);
    const text = element.textContent || element.value || '';
    return { success: true, text: text.trim(), message: `Extracted text from ${selector}` };
} 