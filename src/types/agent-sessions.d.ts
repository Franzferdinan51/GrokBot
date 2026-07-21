// Declares extension points for agent session type augmentation.
export type OpenClawAgentSessionSkillSourceAugmentation = never;

declare module "grokbot/plugin-sdk/agent-sessions" {
  interface Skill {
    // GrokBot relies on the source identifier returned by skill loaders.
    source: string;
  }
}
