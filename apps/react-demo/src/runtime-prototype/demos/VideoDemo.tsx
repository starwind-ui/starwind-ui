import { Video } from "../kit";

const poster = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export function VideoDemo() {
  return (
    <section className="space-y-4" id="react-runtime-video-demo">
      <h2 className="text-2xl font-semibold">Video</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Video
          id="react-runtime-video-native"
          className="rounded-md border"
          src="data:video/mp4;base64,AAAA"
          muted
          loop
          controls
          poster={poster}
        />

        <Video
          id="react-runtime-video-youtube"
          src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title="Runtime YouTube demo"
          autoPlay
          muted
          loop
          controls={false}
          srcDoc="<p>Runtime YouTube demo</p>"
        />

        <Video
          id="react-runtime-video-shorts"
          src="https://www.youtube.com/shorts/abc123short"
          title="Runtime Shorts demo"
          srcDoc="<p>Runtime Shorts demo</p>"
        />
      </div>
    </section>
  );
}
