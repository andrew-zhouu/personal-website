import UniverseApp from "@/components/universe/UniverseApp";
import { constellations, profile, stars } from "@/content";

export default function Home() {
  return (
    <main>
      <UniverseApp />
      {/* Plain-HTML version for visitors without JavaScript. */}
      <noscript>
        <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", color: "#d3d9e6", overflow: "auto", height: "100vh" }}>
          <h1 style={{ fontSize: 32, fontWeight: 600 }}>{profile.name}</h1>
          <p>
            {profile.headline}. {profile.tagline}
          </p>
          {constellations.map((c) => (
            <section key={c.id} style={{ marginTop: 24 }}>
              <h2 style={{ color: c.color, fontWeight: 600 }}>{c.name}</h2>
              <ul>
                {stars
                  .filter((s) => s.constellation === c.id)
                  .map((s) => {
                    const live = s.links.find((l) => l.status === "live" && l.href);
                    return (
                      <li key={s.id} style={{ marginTop: 8 }}>
                        <strong>{s.title}</strong> — {s.summary}{" "}
                        {live && <a href={live.href!}>{live.label}</a>}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      </noscript>
    </main>
  );
}
