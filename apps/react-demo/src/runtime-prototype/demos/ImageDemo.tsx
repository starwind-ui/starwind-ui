export function ImageDemo() {
  return (
    <section className="space-y-4" id="react-runtime-image-demo">
      <h2 className="font-heading text-xl font-semibold">Image</h2>
      <img
        className="runtime-image-custom aspect-[4/3] w-full max-w-sm rounded-md border object-cover"
        src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=960&q=80"
        alt="Workspace with desks and large windows"
        width={960}
        height={720}
        loading="lazy"
      />
    </section>
  );
}
