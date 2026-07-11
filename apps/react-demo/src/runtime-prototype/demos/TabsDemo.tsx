import { useRuntimePrototypeContext } from "../context";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "../kit";

export function TabsDemo() {
  const {
    controlledTabsValue,
    setControlledTabsValue,
    controlledTabsChanges,
    setControlledTabsChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Tabs</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Tabs
          id="react-runtime-tabs-default"
          defaultValue="account"
          className="runtime-tabs-custom"
        >
          <TabsList aria-label="React runtime tabs">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="disabled" disabled>
              Disabled
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account">React account settings content</TabsContent>
          <TabsContent value="security">React security settings content</TabsContent>
          <TabsContent value="disabled">React disabled settings content</TabsContent>
        </Tabs>

        <Tabs id="react-runtime-tabs-controlled" value={controlledTabsValue}>
          <TabsList aria-label="React controlled tabs" activateOnFocus>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">Controlled profile panel</TabsContent>
          <TabsContent value="billing">Controlled billing panel</TabsContent>
        </Tabs>

        <Tabs
          id="react-runtime-tabs-sync-a"
          defaultValue="overview"
          syncKey="react-runtime-tabs-sync-demo"
        >
          <TabsList aria-label="React synced tabs A">
            <TabsTrigger id="react-runtime-tabs-sync-a-overview" value="overview">
              Overview A
            </TabsTrigger>
            <TabsTrigger id="react-runtime-tabs-sync-a-activity" value="activity">
              Activity A
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">React synced overview panel A</TabsContent>
          <TabsContent value="activity">React synced activity panel A</TabsContent>
        </Tabs>

        <Tabs
          id="react-runtime-tabs-sync-b"
          defaultValue="overview"
          syncKey="react-runtime-tabs-sync-demo"
        >
          <TabsList aria-label="React synced tabs B">
            <TabsTrigger id="react-runtime-tabs-sync-b-overview" value="overview">
              Overview B
            </TabsTrigger>
            <TabsTrigger id="react-runtime-tabs-sync-b-activity" value="activity">
              Activity B
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">React synced overview panel B</TabsContent>
          <TabsContent value="activity">React synced activity panel B</TabsContent>
        </Tabs>

        <Tabs
          id="react-runtime-tabs-nested-parent"
          defaultValue="parent-one"
          className="sm:col-span-2"
        >
          <TabsList aria-label="React nested parent tabs">
            <TabsTrigger id="react-runtime-tabs-nested-parent-one" value="parent-one">
              Parent 1
            </TabsTrigger>
            <TabsTrigger id="react-runtime-tabs-nested-parent-two" value="parent-two">
              Parent 2
            </TabsTrigger>
            <TabsTrigger id="react-runtime-tabs-nested-parent-three" value="parent-three">
              Parent 3
            </TabsTrigger>
          </TabsList>
          <TabsContent value="parent-one">React parent tab 1 content</TabsContent>
          <TabsContent value="parent-two">
            <div className="grid gap-3">
              <p className="text-muted-foreground text-sm">Parent tab 2 contains child tabs.</p>
              <Tabs id="react-runtime-tabs-nested-child" defaultValue="child-a">
                <TabsList aria-label="React nested child tabs">
                  <TabsTrigger id="react-runtime-tabs-nested-child-a" value="child-a">
                    Child A
                  </TabsTrigger>
                  <TabsTrigger id="react-runtime-tabs-nested-child-b" value="child-b">
                    Child B
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="child-a">React child tab A content</TabsContent>
                <TabsContent value="child-b">React child tab B content</TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          <TabsContent value="parent-three">React parent tab 3 content</TabsContent>
        </Tabs>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setControlledTabsValue("billing")}
        >
          Parent sets controlled tabs
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setControlledTabsValue(null)}
        >
          Parent clears controlled tabs
        </Button>
        <Tabs
          id="react-runtime-tabs-controlled-events"
          value={controlledTabsValue}
          onValueChange={(value) => {
            setControlledTabsValue(value);
            setControlledTabsChanges((count) => count + 1);
          }}
        >
          <TabsList aria-label="React controlled event tabs">
            <TabsTrigger value="profile">Controlled profile</TabsTrigger>
            <TabsTrigger value="billing">Controlled billing</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">Controlled event profile panel</TabsContent>
          <TabsContent value="billing">Controlled event billing panel</TabsContent>
        </Tabs>
      </div>
      <p data-runtime-tabs-value>Tabs value: {controlledTabsValue ?? "none"}</p>
      <p data-runtime-tabs-count>Tabs changes: {controlledTabsChanges}</p>
    </section>
  );
}
