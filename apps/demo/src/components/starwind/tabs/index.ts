import Tabs from "./Tabs.astro";
import TabsContent from "./TabsContent.astro";
import TabsList from "./TabsList.astro";
import TabsTrigger from "./TabsTrigger.astro";
import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants";
const TabsVariants = {
  tabs,
  tabsContent,
  tabsList,
  tabsTrigger,
};

export { Tabs, TabsContent, TabsList, TabsTrigger, TabsVariants };

export default {
  Root: Tabs,
  Content: TabsContent,
  List: TabsList,
  Trigger: TabsTrigger,
};
