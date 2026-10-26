import "server-only";
import { getStoryEntries } from "@/lib/content";
import { searchGuides } from "@/lib/guide-repository";
import { getLocalizedSectors } from "@/lib/catalog-localization";
import type { Locale } from "@/i18n/routing";

const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
const route = (locale: Locale, path: string) => `${origin}${locale === "fr" ? "/fr" : ""}${path}`;

async function readGuides(locale: Locale, maxPages: number) {
  const guides: Awaited<ReturnType<typeof searchGuides>>["items"] = [];
  try {
    let cursor: string | null = null;
    for (let pageCount = 0; pageCount < maxPages; pageCount += 1) {
      const page = await searchGuides({ limit: 24, cursor, locale });
      guides.push(...page.items);
      cursor = page.nextCursor;
      if (!cursor) break;
    }
  } catch {
    // Keep the agent index useful while shared guide storage is unavailable.
  }
  return guides.filter((guide) => guide.visibility === "public");
}

export async function createLlmsIndex(locale: Locale = "en", full = false) {
  const basePath = (path: string) => route(locale, path);
  const guides = await readGuides(locale, full ? 5 : 6);
  const stories = getStoryEntries(locale);
  const sectors = getLocalizedSectors(locale);
  const french = locale === "fr";

  if (!full) {
    const guideLinks = guides.map((guide) => `- [${guide.title}](${basePath(`/guides/${guide.slug}/`)}): ${guide.desc}`).join("\n");
    const storyLinks = stories.map((story) => `- [${french ? "Exemple illustratif" : "Illustrative scenario"}: ${story.title}](${basePath(`/stories/${story.id}/`)}): ${story.situation}`).join("\n");
    const sectorLinks = sectors.map((sector) => `- [${sector.label}](${basePath(`/guides/sector/${sector.slug}/`)}): ${sector.description}`).join("\n");
    return french ? `# Vitni

> Vitni aide à comprendre les réparations du quotidien et à trouver une prochaine étape sûre. Décrivez le problème et ajoutez éventuellement une photo pour obtenir un plan illustré.

## Pages
- [Accueil](${basePath("/")}): Commencez une réparation avec une photo et une description.
- [Bibliothèque de réparation](${basePath("/guides/")}): Recherchez des guides pratiques pour les vélos, les vêtements, la maison, les appareils et les objets du quotidien.
- [Demander un guide](${basePath("/#diagnose")}): Décrivez le problème et ajoutez éventuellement une photo.
- [Aide de la communauté](${basePath("/#help")}): Trouvez des Repair Cafés et des ateliers, en commençant par Paris.
- [Devenir partenaire](${basePath("/partners/")}): Contactez Vitni au sujet d’un partenariat local, associatif ou commercial.
- [Sécurité des réparations](${basePath("/repair-safety/")}): Comprendre les limites des conseils et savoir quand demander une aide qualifiée.

## Secteurs
${sectorLinks}

## Guides publics
${guideLinks || "La bibliothèque propose des guides pratiques qui précisent les étapes et les limites de sécurité."}

## Exemples illustratifs (pas des témoignages clients)
${storyLinks}

## Sécurité
Vitni fournit des informations éducatives générales, et non un diagnostic professionnel. Arrêtez-vous et demandez l’aide d’un professionnel pour les réparations électriques, au gaz, structurelles, sous pression ou présentant un autre danger. Les liens vers des vendeurs sont des pistes de recherche ; ils ne confirment ni compatibilité, ni stock, ni recommandation, ni partenariat.

## Détails lisibles par machine
Consultez [llms-full.txt](${basePath("/llms-full.txt")}) et [sitemap.xml](${origin}/sitemap.xml) pour les informations détaillées et les pages indexables.
` : `# Vitni

> Vitni helps people understand everyday repairs and find safe next steps. Describe an issue and optionally add a photo to get an illustrated repair plan.

## Pages
- [Home](${basePath("/")}): Start a repair with a photo and description.
- [Repair guide library](${basePath("/guides/")}): Search practical guides for bikes, clothing, home, appliances, and everyday objects.
- [Repair request](${basePath("/#diagnose")}): Describe an issue and optionally upload a photo.
- [Community repair help](${basePath("/#help")}): Find repair cafés and workshops, starting around Paris.
- [Partner with Vitni](${basePath("/partners/")}): Contact Vitni about local repair, community workshop, parts, or product partnerships.
- [Repair guide safety](${basePath("/repair-safety/")}): Understand the limits of repair suggestions and when to get qualified help.

## Repair sectors
${sectorLinks}

## Public repair guides
${guideLinks || "The library contains practical, safety-aware repair guides."}

## Illustrative scenarios (not customer testimonials)
${storyLinks}

## Safety
Vitni offers general educational guidance, not a substitute for a qualified technician. Stop and seek professional help for electrical, gas, structural, heavy, pressurized, or otherwise unsafe repairs. Retailer search links are suggestions, not verified matches, stock checks, endorsements, or partnerships.

## Machine-readable detail
See [llms-full.txt](${basePath("/llms-full.txt")}) and [sitemap.xml](${origin}/sitemap.xml) for expanded and crawlable content.
`;
  }

  const guideText = guides.map((guide) => {
    const steps = guide.steps.map((step, index) => `  ${index + 1}. ${step.title}: ${step.instruction}`).join("\n");
    return `## ${guide.title}\nURL: ${basePath(`/guides/${guide.slug}/`)}\n${french ? "Secteur" : "Sector"}: ${guide.sector}\n${french ? "Niveau" : "Level"}: ${guide.level}\n${french ? "Durée estimée" : "Estimated time"}: ${guide.time}\n${french ? "Description" : "Description"}: ${guide.desc}\n${french ? "Sécurité" : "Safety"}: ${guide.safetyNotes}\n${french ? "Outils" : "Tools"}: ${guide.tools.join(", ") || (french ? "Aucun indiqué" : "None listed")}\n${french ? "Pièces" : "Parts"}: ${guide.parts.map((part) => [part.name, part.details].filter(Boolean).join(" — ")).join("; ") || (french ? "Aucune indiquée" : "None listed")}\n${french ? "Étapes" : "Steps"}:\n${steps}`;
  }).join("\n\n");
  const storyText = stories.map((story) => `## ${french ? "Exemple illustratif" : "Illustrative scenario"}: ${story.title}\nURL: ${basePath(`/stories/${story.id}/`)}\n${story.situation}\n${french ? "Sécurité" : "Safety"}: ${story.safety}\n${french ? "Résultat illustratif" : "Example outcome"}: ${story.outcome}`).join("\n\n");
  const sectorText = sectors.map((sector) => {
    const questions = sector.questions.map(({ question, answer }) => `Q: ${question}\nA: ${answer}`).join("\n\n");
    return `## ${sector.label}\nURL: ${basePath(`/guides/sector/${sector.slug}/`)}\n${sector.description}\n${sector.intro}\n\n${questions}`;
  }).join("\n\n");
  return french ? `# Contenu détaillé de Vitni

Guides publics inclus : ${guides.length}. Le plan du site et les pages par secteur donnent accès à d’autres guides indexables.

# Secteurs de réparation

${sectorText}

# Guides de réparation publics

${guideText}

# Partenaires et aide locale

URL : ${basePath("/partners/")}
Vitni souhaite échanger avec des réparateurs locaux, des Repair Cafés, des ateliers associatifs, des vendeurs de pièces et des fabricants. Aucun partenariat n’est implicite tant qu’il n’a pas été convenu. Les liens de recherche de produits ne vérifient ni stock ni compatibilité.

# Sécurité

URL : ${basePath("/repair-safety/")}
Les guides de Vitni sont des informations générales et non des inspections, notices fabricant ou diagnostics professionnels. Vérifiez les consignes propres au modèle et la compatibilité des pièces. Pour les risques électriques, le gaz, la structure, la pression ou les systèmes critiques, arrêtez-vous et demandez une aide qualifiée.

# Exemples illustratifs (pas des témoignages clients)

${storyText}
` : `# Vitni expanded content

Public guide entries included: ${guides.length}. The sitemap and sector pages expose further crawlable guides.

# Repair sectors

${sectorText}

# Public repair guides

${guideText}

# Partner and community contact

URL: ${basePath("/partners/")}
Vitni is looking to hear from local repairers, repair cafés and community workshops, parts retailers, and product makers. Partner relationships are not implied until agreed. Current retailer search links are generic and do not verify stock, compatibility, or commercial relationships.

# Safety

URL: ${basePath("/repair-safety/")}
Vitni's built-in library offers general guidance. Photo-based repair suggestions are estimates, not inspections, product manuals, or professional diagnoses. Check model-specific instructions and exact part fit. Stop and ask qualified help for electrical, gas, structural, pressurized, unstable, or safety-critical repairs.

# Illustrative scenarios (not customer testimonials)

${storyText}
`;
}
