import Tabs from "./Tabs";
import TabsContent from "./TabsContent";
import TabsList from "./TabsList";
import TabsTrigger from "./TabsTrigger";
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
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
