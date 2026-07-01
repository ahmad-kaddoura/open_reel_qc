export { ChatView } from './components/chat-view';
export { useChatStore } from './store';
export {
  detectChatIntent,
  detectPlanApproval,
  extractConceptFromMessages,
  buildBriefFromProject,
  buildStoryboardScenes,
  buildCreativeWorkflowPlan,
  buildCreativeWorkflowPlanWithPrompts,
  BRAINSTORM_SYSTEM_PROMPT,
  type ChatIntent,
} from './lib/chat-handlers';
