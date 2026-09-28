<script lang="ts">
  const projects = [
    {
      name: "Studio website",
      detail: "Design review",
      progress: "Review on Thursday",
      initials: "SW",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    },
    {
      name: "Component library",
      detail: "In progress",
      progress: "12 components ready",
      initials: "CL",
      color: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
    },
    {
      name: "Customer portal",
      detail: "Planning",
      progress: "Kickoff next week",
      initials: "CP",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    },
  ];
</script>

<div id="overview" class="grid gap-6">
  <section id="projects" aria-labelledby="projects-title" class="rounded-xl border bg-card p-5">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h2 id="projects-title" class="font-semibold">Your projects</h2>
      <span class="text-xs text-muted-foreground">Updated today</span>
    </div>
    <div class="grid gap-3 lg:grid-cols-3">
      {#each projects as project (project.name)}
        <article class="rounded-lg border p-4">
          <span
            class={`mb-5 flex size-10 items-center justify-center rounded-lg text-xs font-semibold ${project.color}`}
            >{project.initials}</span
          >
          <h3 class="text-sm font-semibold">{project.name}</h3>
          <p class="mt-1 text-xs text-muted-foreground">{project.detail}</p>
          <p class="mt-5 border-t pt-3 text-xs text-muted-foreground">{project.progress}</p>
        </article>
      {/each}
    </div>
  </section>
  <section id="team" aria-labelledby="team-title" class="rounded-xl border bg-card p-5">
    <h2 id="team-title" class="font-semibold">Team notes</h2>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      The next review is on Thursday. Add your work to the project before the meeting.
    </p>
    <div class="mt-5 flex items-center gap-3">
      <span
        class="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium"
        >JT</span
      >
      <div class="text-sm">
        <p class="font-medium">Jordan Taylor</p>
        <p class="text-xs text-muted-foreground">Workspace coordinator</p>
      </div>
    </div>
  </section>
</div>
