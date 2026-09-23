<script lang="ts">
  import Table from "$lib/starwind-runtime/table";
  const projects = [
    { id: "design", name: "Design system", status: "In review", owner: "Morgan", updated: "Today" },
    {
      id: "website",
      name: "Website refresh",
      status: "Active",
      owner: "Alex",
      updated: "Yesterday",
    },
    { id: "docs", name: "Documentation", status: "Complete", owner: "Sam", updated: "Monday" },
  ];
</script>

<Table.Root aria-label="Workspace projects" class="min-w-[560px]">
  <Table.Caption>Current projects in this workspace.</Table.Caption>
  <Table.Header
    ><Table.Row
      ><Table.Head scope="col">Project</Table.Head><Table.Head scope="col">Status</Table.Head
      ><Table.Head scope="col">Owner</Table.Head><Table.Head scope="col">Updated</Table.Head
      ></Table.Row
    ></Table.Header
  >
  <Table.Body>
    {#each projects as project (project.id)}
      <Table.Row data-state={project.id === "website" ? "selected" : undefined}
        ><Table.Cell class="font-medium">{project.name}</Table.Cell><Table.Cell
          >{project.status}</Table.Cell
        ><Table.Cell>{project.owner}</Table.Cell><Table.Cell>{project.updated}</Table.Cell
        ></Table.Row
      >
    {/each}
  </Table.Body>
  <Table.Foot
    ><Table.Row
      ><Table.Cell colspan={3}>Total projects</Table.Cell><Table.Cell class="text-right"
        >{projects.length}</Table.Cell
      ></Table.Row
    ></Table.Foot
  >
</Table.Root>
