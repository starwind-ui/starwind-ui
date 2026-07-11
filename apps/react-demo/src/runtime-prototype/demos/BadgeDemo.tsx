import { Badge, IconMail } from "../kit";

const badgeTones = [
  { tone: "neutral", label: "Neutral" },
  { tone: "primary", label: "Primary" },
  { tone: "primary-accent", label: "Primary accent" },
  { tone: "secondary", label: "Secondary" },
  { tone: "secondary-accent", label: "Secondary accent" },
  { tone: "info", label: "Info" },
  { tone: "success", label: "Success" },
  { tone: "warning", label: "Warning" },
  { tone: "error", label: "Error" },
] as const;

const badgeAppearances = ["solid", "soft", "outline", "text", "frosted"] as const;
const linkBadgeTones = new Set(["primary", "secondary", "info"]);

export function BadgeDemo() {
  return (
    <section className="space-y-4" id="runtime-badge-demo">
      <h2 className="font-heading text-xl font-semibold">Badge</h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">Legacy variants</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="success" size="sm">
              Success
            </Badge>
            <Badge variant="warning" size="lg">
              Warning
            </Badge>
            <Badge variant="error">Error</Badge>
            <Badge
              href="https://starwind.dev"
              variant="primary"
              size="lg"
              target="_blank"
              rel="noreferrer"
            >
              Link badge
            </Badge>
            <Badge variant="primary" size="sm">
              <IconMail />
              Primary sm
            </Badge>
            <Badge variant="primary" size="md">
              <IconMail />
              Primary md
            </Badge>
            <Badge variant="primary" size="lg">
              <IconMail />
              Primary lg
            </Badge>
          </div>
        </div>

        {badgeAppearances.map((appearance) => (
          <div className="space-y-2" key={appearance}>
            <h3 className="text-muted-foreground text-sm font-medium capitalize">{appearance}</h3>
            <div className="flex flex-wrap items-center gap-3">
              {badgeTones.map(({ tone, label }) => {
                const isLink = linkBadgeTones.has(tone);

                return (
                  <Badge
                    appearance={appearance}
                    tone={tone}
                    href={isLink ? "https://starwind.dev" : undefined}
                    target={isLink ? "_blank" : undefined}
                    rel={isLink ? "noreferrer" : undefined}
                    key={`${appearance}-${tone}`}
                  >
                    {isLink ? `${label} link` : label}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">Eyebrow</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary-accent" appearance="text" size="sm" eyebrow>
              Small eyebrow
            </Badge>
            <Badge tone="primary-accent" appearance="text" size="md" eyebrow>
              Medium eyebrow
            </Badge>
            <Badge tone="primary-accent" appearance="text" size="lg" eyebrow>
              Large eyebrow
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">Composed examples</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary-accent" appearance="soft" size="lg">
              <IconMail />
              Icon soft
            </Badge>
            <Badge tone="info" appearance="outline">
              <IconMail />
              Icon outline
            </Badge>
            <Badge
              href="https://starwind.dev"
              tone="primary-accent"
              appearance="soft"
              size="lg"
              target="_blank"
              rel="noreferrer"
            >
              <IconMail />
              Release notes
            </Badge>
          </div>
          <div className="bg-primary flex flex-wrap items-center gap-3 rounded-lg border p-4">
            <Badge
              href="https://starwind.dev"
              tone="primary-accent"
              appearance="frosted"
              size="lg"
              target="_blank"
              rel="noreferrer"
            >
              <IconMail />
              Frosted link
            </Badge>
            <Badge tone="secondary-accent" appearance="frosted">
              Overlay label
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
