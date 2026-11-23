import Tabs from "./Tabs.svelte";
import TabsContent from "./TabsContent.svelte";
import TabsList from "./TabsList.svelte";
import TabsTrigger from "./TabsTrigger.svelte";
import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants.js";

export type { TabsProps } from "./Tabs.svelte";
export type { TabsContentProps } from "./TabsContent.svelte";
export type { TabsListProps } from "./TabsList.svelte";
export type { TabsTriggerProps } from "./TabsTrigger.svelte";

const TabsVariants = { tabs, tabsContent, tabsList, tabsTrigger };
const TabsParts = { Root: Tabs, List: TabsList, Trigger: TabsTrigger, Content: TabsContent };

export { Tabs, TabsContent, TabsList, TabsTrigger, TabsVariants };
export default TabsParts;
