# Architecture

```mermaid
flowchart TB
  subgraph Client["Creator Browser"]
    UI["Next.js App Router UI\nChat, Workflow Graph, Timeline, Settings"]
    IndexedDb["IndexedDB\nAssets, drafts, local state"]
  end

  subgraph Backend["Backend on Alibaba Cloud"]
    ApiChat["/api/chat"]
    ApiEnhance["/api/enhance-prompt"]
    ApiGenerate["/api/generate-scene"]
    Env["Environment Config\nQWEN_API_KEY, QWEN_BASE_URL"]
    QwenClient["src/lib/qwen-client.ts"]
    Prisma["Prisma + SQLite\nProject metadata"]
  end

  subgraph Alibaba["Alibaba Cloud Services"]
    QwenCompat["Qwen Cloud\nOpenAI-Compatible Chat API"]
    DashScopeImage["DashScope Image Synthesis"]
    DashScopeVideo["DashScope Wan Video Tasks"]
    DashScopeMotion["DashScope Motion Control Tasks"]
    OssUpload["DashScope OSS Upload Policy\nTemporary media objects"]
  end

  UI --> ApiChat
  UI --> ApiEnhance
  UI --> ApiGenerate
  UI <--> IndexedDb

  ApiChat --> QwenClient
  ApiEnhance --> QwenClient
  ApiGenerate --> QwenClient
  ApiChat --> Prisma
  ApiGenerate --> Prisma
  Env --> QwenClient

  QwenClient --> QwenCompat
  QwenClient --> DashScopeImage
  QwenClient --> DashScopeVideo
  QwenClient --> DashScopeMotion
  QwenClient --> OssUpload

  QwenCompat --> ApiChat
  DashScopeImage --> ApiChat
  DashScopeVideo --> ApiGenerate
  DashScopeMotion --> ApiGenerate
```

## Flow

1. The browser sends creative instructions, storyboard changes, or generation requests to the Next.js backend.
2. Backend API routes load the Qwen Cloud configuration and route the task through `src/lib/qwen-client.ts`.
3. Text and vision planning use the Qwen Cloud OpenAI-compatible chat endpoint.
4. Image generation first tries the OpenAI-compatible image endpoint, then falls back to DashScope image synthesis when needed.
5. Video and motion-control work is submitted to Alibaba Cloud DashScope async task endpoints and polled until completion.
6. Local project metadata is stored through Prisma/SQLite, while larger client-side creative state and assets can remain in IndexedDB.
