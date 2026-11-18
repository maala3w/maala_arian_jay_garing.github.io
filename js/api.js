// Loads portfolio content. The site is fully static: everything comes from data/portfolio.json.

const DATA_URL = 'data/portfolio.json';

/** Leaves out anything marked as not ready for visitors. */
function visibleOnly(data) {
  return {
    ...data,
    socialLinks: (data.socialLinks || []).filter((s) => s.isVisible !== false),
    experiences: (data.experiences || []).map((e) => ({
      ...e,
      points: (e.points || []).filter((p) => p.isConfirmed !== false),
    })),
  };
}

export async function getPortfolio() {
  // no-cache: always check for a newer file, so saved edits show on the next page load.
  const res = await fetch(DATA_URL, { headers: { Accept: 'application/json' }, cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${DATA_URL} (${res.status}).`);
  return { data: visibleOnly(await res.json()) };
}
