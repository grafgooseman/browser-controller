const fs = require('fs');
const server = require('./server');

async function runScenario(filePath) {
  const scenario = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`🎬 Running scenario: ${scenario.name}`);

  for (const step of scenario.steps) {
    try {
      let result;
      switch (step.action) {
        case 'navigate':
          result = await server.navigate(step.url);
          break;
        case 'type':
          result = await server.type(step.selector, step.text);
          break;
        case 'click':
          result = await server.click(step.selector);
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.time));
          result = { message: `Waited ${step.time}ms` };
          break;
        default:
          throw new Error('Unknown action: ' + step.action);
      }
      console.log(`✅ ${step.action}: ${result.message || 'done'}`);
    } catch (err) {
      console.error(`❌ ${step.action} failed:`, err.message);
      break; // stop on error
    }
  }
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scenario-runner.js <scenario.json>');
    process.exit(1);
  }
  runScenario(file);
}

module.exports = { runScenario }; 