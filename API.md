# API reference

## AskAI Gateway
```javascript
import { askAI } from './src/ai/gateway/index.js';

const response = await askAI("Show my verified documents", {
  currentUser,
  userProfile,
  state,
  currentScreen
});
```

## Live Search Provider
```javascript
import { performLiveSearch } from './src/ai/providers/searchProvider.js';

const result = await performLiveSearch("London weather");
// Returns: { success: true, summary: "Current weather in London: 15°C...", source: "..." }
```
