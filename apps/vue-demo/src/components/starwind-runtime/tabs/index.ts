import Tabs from "./Tabs.vue";
import TabsContent from "./TabsContent.vue";
import TabsList from "./TabsList.vue";
import TabsTrigger from "./TabsTrigger.vue";
import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants";

export type { TabsProps } from "./Tabs.vue";
export type { TabsContentProps } from "./TabsContent.vue";
export type { TabsListProps } from "./TabsList.vue";
export type { TabsTriggerProps } from "./TabsTrigger.vue";

const TabsVariants = { tabs, tabsContent, tabsList, tabsTrigger };

export { Tabs, TabsContent, TabsList, TabsTrigger, TabsVariants };

export default { Root: Tabs, List: TabsList, Trigger: TabsTrigger, Content: TabsContent };
