import { ChatWindow } from "@/components/ChatWindow";
import { isMockMode } from "@/lib/openai";

export default function HomePage() {
  const mock = isMockMode();
  return <ChatWindow mockBadge={mock} />;
}
