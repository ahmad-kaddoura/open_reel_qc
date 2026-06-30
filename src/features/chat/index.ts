export { ChatView } from './components/chat-view';
export { useChatStore } from './store';
export {
  detectChatIntent,
  extractConceptFromMessages,
  buildBriefFromProject,
  buildStoryboardScenes,
  BRAINSTORM_SYSTEM_PROMPT,
  type ChatIntent,
} from './lib/chat-handlers';
