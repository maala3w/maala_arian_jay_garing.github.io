// Answers visitor questions in the browser by quoting facts from portfolio.json word for word.
// There is no AI model involved, so it cannot invent anything: it either quotes or says it has
// no information.

const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const years = (start, end) => (start && end && start !== end ? `${start}–${end}` : String(end || start || ''));
const join = (...parts) => parts.filter(Boolean).join(', ');

export function buildFacts(portfolio) {
  const p = portfolio.profile;
  const name = p?.fullName || 'The portfolio owner';
  const facts = [];
  const add = (section, text) => { if (text) facts.push({ section, text }); };

  if (p) {
    add('Profile', `${name} describes their roles as: ${p.shortLabel.split('|').map((s) => s.trim()).join(', ')}.`);
    add('Profile', `${name}'s introduction says: "${plain(p.heroIntro)}"`);
    // Split on sentence ends, but not after an initial such as "G." The bio is first-person, so it is attributed.
    plain(p.aboutBio).split(/(?<=[a-z]{2}\.)\s+(?=[A-Z])/).forEach((s) => add('About', `${name}'s biography says: "${s}"`));
    if (p.careerGoal) add('Career goal', plain(p.careerGoal));
    if (p.visionText) add('Career goal', plain(p.visionText));
    add('Contact', `${name} can be contacted at ${p.email}.${p.location ? ` Location: ${p.location}.` : ''}`);
  }
  if (portfolio.languages?.length) add('Languages', `Languages ${name} uses: ${portfolio.languages.map((l) => l.name).join(', ')}.`);

  (portfolio.education || []).forEach((e) => {
    const honors = (e.achievements || []).map((a) => a.title).join('; ');
    const when = years(e.startYear, e.endYear);
    add('Education', `${e.level}: ${join(e.program, e.institution)}${when ? ` (${when})` : ''}.${honors ? ` Honors: ${honors}.` : ''}${e.description ? ` ${plain(e.description)}` : ''}`);
  });

  (portfolio.skillCategories || []).forEach((c) => {
    if (!c.skills?.length) return;
    add('Skills', `${c.name} skills listed by ${name}: ${c.skills.map((s) => (s.proficiency ? `${s.name} (${s.proficiency})` : s.name)).join(', ')}.`);
  });

  (portfolio.researchPapers || []).forEach((r) => {
    const where = join(r.academicLevel, r.institution);
    add('Research', `Research paper (${r.researchType}): "${r.title}"${where ? `, written at ${where}` : ''}${r.yearLabel ? ` in ${r.yearLabel}` : ''}.${r.abstract ? ` Abstract: ${plain(r.abstract)}` : ''}`);
  });

  (portfolio.systems || []).filter((s) => s.name && s.url).forEach((s) => {
    add('Projects', `Software system on ${name}'s portfolio: "${s.name}", available at ${s.url}`);
  });

  (portfolio.experiences || []).forEach((e) => {
    const when = years(e.startYear, e.endYear);
    const duties = (e.points || []).filter((pt) => pt.pointType === 'responsibility').map((pt) => pt.content).join(' ');
    add(e.section === 'leadership' ? 'Leadership' : 'Experience', `${e.title}${e.organization ? ` at ${e.organization}` : ''}${when ? ` (${when})` : ''}${e.status ? `, status: ${e.status}` : ''}.${e.summary ? ` ${plain(e.summary)}` : ''}${duties ? ` ${duties}` : ''}`);
  });

  (portfolio.achievements || []).forEach((a) => {
    add(a.category === 'academic' ? 'Awards' : 'Competitions', `${a.distinction ? `${a.distinction}: ` : ''}${a.title}${a.eventName ? `, ${a.eventName}` : ''}${a.year ? ` (${a.year})` : ''}${a.location ? `, ${a.location}` : ''}${a.issuingOrganization ? `, ${a.issuingOrganization}` : ''}.`);
  });

  (portfolio.trainings || []).forEach((t) => {
    add('Trainings', `${t.category} training: ${t.title}${t.year ? ` (${t.year})` : ''}${t.location ? `, ${t.location}` : ''}${t.organizer ? `, organized by ${t.organizer}` : ''}.`);
  });

  if (portfolio.resumePages?.length) add('Documents', `${name}'s résumé can be viewed (view only, not downloadable) in the Résumé & CV section of this site.`);
  if (portfolio.cvPages?.length) add('Documents', `${name}'s curriculum vitae (CV) can be viewed (view only, not downloadable) in the Résumé & CV section of this site.`);

  (portfolio.chatbot?.approvedFacts || []).forEach((line) => add('Approved note', line));
  return facts;
}

const STOP_WORDS = new Set('a an and are about any arian at be been can could did do does done describe doing find for from get give had has have he held her his hold how i in is it its jay kind list maala many me more much my of on or please she see show so some tell the their them they this to type view was were what when where which who why will with would you your'.split(' '));

function keywords(text) {
  // Accents are removed, so "resume" also matches "résumé".
  return String(text).toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').match(/[\p{L}\p{N}][\p{L}\p{N}+#.-]*/gu)
    ?.map((w) => w.replace(/[.-]+$/, '').replace(/(?<=[a-z]{3})s$/, ''))
    .filter((w) => w && !STOP_WORDS.has(w)) || [];
}

// Everyday words that point at a section.
const TOPICS = {
  Education: 'study studying studied degree school university college education major course program honor gpa graduate student',
  Skills: 'skill tool technology technical programming software ability know knowledge proficient',
  Research: 'research thesis paper study publication published abstract',
  Projects: 'project portfolio built developed website app application system software',
  Leadership: 'leadership lead leader president officer organization council role',
  Experience: 'experience work worked job employment internship intern immersion ojt',
  Competitions: 'competition contest won win placed',
  Awards: 'award honor recognition achievement',
  Trainings: 'training seminar webinar workshop attended',
  Contact: 'contact email reach location live based',
  'Career goal': 'goal career ambition aspire future plan',
  Languages: 'language speak',
  Documents: 'resume résumé cv curriculum vitae download',
};
const TOPIC_WORDS = new Map(Object.entries(TOPICS).map(([section, words]) => [section, new Set(keywords(words))]));
const ALL_TOPIC_WORDS = new Set([...TOPIC_WORDS.values()].flatMap((set) => [...set]));

/**
 * Words that merely name a topic choose the section; any other word must really appear in the
 * fact. So "degree program" finds Education, while "Kubernetes certification" finds nothing
 * rather than quoting something unrelated.
 */
export function answerFromFacts(question, facts, { name, email }) {
  const wanted = [...new Set(keywords(question))];
  const specific = wanted.filter((w) => !ALL_TOPIC_WORDS.has(w));

  const scored = wanted.length ? facts
    .map((fact) => {
      const words = new Set(keywords(`${fact.section} ${fact.text}`));
      const direct = wanted.filter((w) => words.has(w)).length / wanted.length;
      const onTopic = wanted.some((w) => TOPIC_WORDS.get(fact.section)?.has(w));
      const specificMatch = specific.length ? specific.filter((w) => words.has(w)).length / specific.length : 1;
      return { fact, score: onTopic && specificMatch >= 0.5 ? 1 + direct : direct };
    })
    .filter((s) => s.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4) : [];

  if (!scored.length) {
    return `I don't have information about that in this portfolio.${email ? ` You can ask ${name} directly at ${email}.` : ''}`;
  }
  return scored.map((s) => s.fact.text).join('\n\n');
}
