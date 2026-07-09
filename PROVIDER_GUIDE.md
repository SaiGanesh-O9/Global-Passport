# Provider Adapter Integration Guide

This guide details how to integrate, configure, and manage LLM provider adapters inside the serverless layer.

## Interface Signature
Each adapter file must export a call handler exposing the same method:
```javascript
export async function callProviderAPI(provider, key, messages, preferredModel, style) {
  // ...
  return {
    reply: "String contents response",
    model: "resolved-model-name",
    usage: { promptTokens: 120, completionTokens: 40 }
  };
}
```

## Adding a New Provider
1. Add the adapter implementation inside `api/ai/providers.js`.
2. Add the API Key retrieval step inside `getApiKeyForProvider`.
3. Add the provider to the order priority array `activeOrder` inside `getResponseWithFailover`.
