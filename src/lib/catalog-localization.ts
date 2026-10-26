import catalogFr from "@/lib/catalog-fr.generated.json";
import type { RepairArea, RepairGuide, RepairStory } from "@/lib/content";
import { repairSectors, type RepairSector } from "@/lib/repair-sectors";
import type { Locale } from "@/i18n/routing";

type FrenchGuide = {
  title: string;
  desc: string;
  stepTitles?: string[];
  steps: string[];
  safety: string;
  tools: string[];
  parts: ({ name: string; details?: string } | string)[];
  alt: string;
};

type FrenchStory = {
  title: string;
  tag: string;
  time: string;
  image: string;
  alt: string;
  situation: string;
  tools: string[];
  safety: string;
  steps: [string, string][];
  outcome: string;
};

const frenchGuides = (catalogFr as unknown as { guides: Record<string, FrenchGuide> }).guides;
const frenchStories = (catalogFr as unknown as { stories: Record<string, FrenchStory> }).stories;

const sectorLabelsFr: Record<RepairSector, string> = {
  "Bikes & mobility": "Vélos et mobilité",
  "Clothing & textiles": "Vêtements et textiles",
  "Home fixtures": "Équipements de la maison",
  "Furniture & upholstery": "Meubles et rembourrage",
  "Appliances & electronics": "Appareils et électronique",
  "Kitchen & household": "Cuisine et maison",
  "Garden & outdoor": "Jardin et extérieur",
  "Personal gear": "Accessoires personnels",
  "Toys & leisure": "Jeux et loisirs",
  "Vehicles & powered equipment": "Véhicules et équipements motorisés",
  "Other everyday objects": "Autres objets du quotidien",
};

export function localizedSectorLabel(sector: string, locale: Locale | string = "en") {
  return locale === "fr" ? (sectorLabelsFr[sector as RepairSector] || sector) : sector;
}

export function localizedAreaLabel(area: RepairArea, locale: Locale | string = "en") {
  if (locale !== "fr") return area;
  return ({ Bike: "Vélo", Home: "Maison", Clothes: "Vêtements", Other: "Autre" } as const)[area];
}

export function localizedLevel(level: string, locale: Locale | string = "en") {
  if (locale !== "fr") return level;
  return ({ Easy: "Facile", Moderate: "Intermédiaire", Advanced: "Avancé" } as Record<string, string>)[level] || level;
}

export function localizeCuratedGuide<T extends RepairGuide>(guide: T, locale: Locale | string): T {
  if (locale !== "fr") return { ...guide, contentLocale: "en" };
  const translated = frenchGuides[guide.slug];
  if (!translated) return { ...guide, level: localizedLevel(guide.level, locale), contentLocale: "en" };
  const parts = guide.parts.map((part, index) => {
    const translatedPart = translated.parts[index];
    if (typeof part === "string") return typeof translatedPart === "string" ? translatedPart : translatedPart?.name || part;
    return typeof translatedPart === "string" ? { ...part, name: translatedPart } : { ...part, ...translatedPart };
  });
  return {
    ...guide,
    contentLocale: "fr",
    title: translated.title || guide.title,
    desc: translated.desc || guide.desc,
    level: localizedLevel(guide.level, locale),
    safetyNotes: translated.safety || guide.safetyNotes,
    tools: translated.tools?.length ? translated.tools : guide.tools,
    alt: translated.alt || guide.alt,
    steps: guide.steps.map((step, index) => ({
      ...step,
      title: translated.stepTitles?.[index] || shortStepTitle(translated.steps?.[index] || step.instruction, index + 1, locale),
      instruction: translated.steps?.[index] || step.instruction,
      imageAlt: `${translated.title || guide.title}, étape ${index + 1}`,
    })),
    parts,
  };
}

export function localizeCuratedStory<T extends RepairStory & { id: string }>(story: T, locale: Locale | string): T {
  if (locale !== "fr") return story;
  const translated = frenchStories[story.id];
  return translated ? ({ ...story, ...translated } as T) : story;
}

export function localizeStoredGuide<T extends RepairGuide>(guide: T, record: Record<string, unknown> | null | undefined): T {
  if (!record) return localizeCuratedGuide(guide, "fr");
  const translatedSteps = Array.isArray(record.steps) ? (record.steps as { title?: string; instruction?: string }[]) : [];
  const translatedParts = Array.isArray(record.parts) ? (record.parts as { name?: string; details?: string }[]) : [];
  const tools = Array.isArray(record.tools) ? (record.tools as string[]) : guide.tools;
  return {
    ...guide,
    contentLocale: "fr",
    title: typeof record.title === "string" ? record.title : guide.title,
    desc: typeof record.description === "string" ? record.description : guide.desc,
    alt: typeof record.image_alt === "string" && record.image_alt ? record.image_alt : guide.alt,
    level: localizedLevel(guide.level, "fr"),
    safetyNotes: typeof record.safety_notes === "string" ? record.safety_notes : guide.safetyNotes,
    tools,
    steps: guide.steps.map((step, index) => ({
      ...step,
      title: translatedSteps[index]?.title || step.title,
      instruction: translatedSteps[index]?.instruction || step.instruction,
      imageAlt: step.imageAlt ? `Illustration : ${translatedSteps[index]?.title || step.title}` : step.imageAlt,
    })),
    parts: guide.parts.map((part, index) => ({ ...part, ...translatedParts[index] })),
  };
}

export function getLocalizedSectors(locale: Locale | string = "en") {
  return repairSectors.map((sector) => ({
    ...sector,
    label: localizedSectorLabel(sector.label, locale),
    description: locale === "fr" ? sectorDescriptionFr[sector.slug]?.description || sector.description : sector.description,
    intro: locale === "fr" ? sectorDescriptionFr[sector.slug]?.intro || sector.intro : sector.intro,
    questions: locale === "fr" ? sectorDescriptionFr[sector.slug]?.questions || sector.questions : sector.questions,
  }));
}

export function localizedSectorBySlug(slug: string, locale: Locale | string = "en") {
  return getLocalizedSectors(locale).find((sector) => sector.slug === slug) || null;
}

const sectorDescriptionFr: Record<string, { description: string; intro: string; questions: readonly { question: string; answer: string }[] }> = {
  "bikes-mobility": { description: "Guides de réparation vélo : crevaisons, chaînes, selles et réglages avec contrôles avant de reprendre la route.", intro: "Suivez des étapes pratiques pour les problèmes courants de vélo. Chaque guide indique les outils, les vérifications et les moments où il faut s’arrêter ; contrôlez roues, freins, direction et réparation avant de rouler.", questions: [{ question: "Puis-je rouler avec une chaîne détendue ou qui déraille ?", answer: "Arrêtez-vous et vérifiez la chaîne avant de repartir. Si elle est tordue, coincée, déraille souvent ou si le dérailleur semble abîmé, n’utilisez plus le vélo et demandez conseil à un mécanicien cycle." }, { question: "Que vérifier après une réparation de vélo ?", answer: "À l’arrêt, vérifiez que la roue est fixée, que le pneu est bien en place, que les freins fonctionnent, que la direction est stable et qu’aucun outil ni pièce ne reste oublié. En cas de doute, poussez le vélo jusqu’à un atelier au lieu de rouler." }] },
  "clothing-textiles": { description: "Repriser, réparer les coutures, ourlets, boutons et fermetures pour faire durer les vêtements.", intro: "Découvrez des réparations textiles pour les petits accrocs, boutons décousus, fermetures coincées et ourlets. Les guides indiquent quand un retoucheur est préférable.", questions: [{ question: "Puis-je recoudre une couture déchirée à la main ?", answer: "Une petite déchirure peut souvent être recousue si le tissu autour est solide et que la couture n’est pas soumise à de fortes contraintes. Faites de petits points dans l’ancienne couture, puis testez doucement. Pour une grande déchirure ou un tissu fragile, consultez un retoucheur." }, { question: "Comment choisir le fil pour réparer un vêtement ?", answer: "Vérifiez l’étiquette d’entretien et choisissez un fil et une aiguille adaptés à l’épaisseur du tissu. Faites un essai sur une chute ou une zone cachée ; les tissus délicats, extensibles ou enduits peuvent nécessiter du matériel spécialisé." }] },
  "home-fixtures": { description: "Petites réparations non structurelles pour portes, fenêtres, tiroirs, murs et équipements du quotidien.", intro: "Ces guides couvrent des problèmes domestiques petits et visibles, sans enjeu structurel. Arrêtez-vous et contactez un professionnel si vous soupçonnez des câbles ou tuyaux cachés, un dégât structurel ou un équipement instable.", questions: [{ question: "Quelles réparations à la maison puis-je essayer moi-même ?", answer: "Commencez par de petites tâches visibles, comme reboucher un trou de vis connu ou resserrer une poignée de meuble, avec la bonne fixation et le bon outil. Ne percez pas et ne démontez pas si vous ne savez pas ce qui se trouve derrière." }, { question: "Quand appeler un professionnel pour une porte ou une fenêtre ?", answer: "Arrêtez-vous si la fenêtre est lourde ou instable, si le vitrage est fissuré, si le cadre est abîmé ou si vous suspectez des câbles, de la plomberie ou un mouvement structurel. Sécurisez la zone et contactez un professionnel qualifié." }] },
  "furniture-upholstery": { description: "Vérifications et entretien du mobilier, avec des limites claires pour les structures porteuses.", intro: "Explorez les vérifications de meubles : vis desserrées, patins usés et petits défauts de rembourrage. Une jambe fendue, une structure fissurée ou un assemblage porteur défaillant doit être réparé avant utilisation.", questions: [{ question: "Puis-je utiliser une chaise après avoir resserré une vis ?", answer: "Inspectez d’abord la structure et les assemblages. N’utilisez pas la chaise si un pied est fissuré, si un assemblage se sépare ou si elle reste instable après le serrage adapté ; les dommages porteurs nécessitent une réparation sérieuse." }, { question: "Comment éviter que les meubles rayent le sol ?", answer: "Nettoyez les points de contact et posez des patins adaptés au pied et au revêtement. Remplacez-les s’ils sont usés, décollés ou chargés de poussière ; un patin ne répare pas un pied fragile ou instable." }] },
  "appliances-electronics": { description: "Entretien simple et réparations extérieures, avec orientation vers un professionnel en cas de risque électrique.", intro: "Commencez par l’entretien accessible, comme les filtres amovibles ou les piles remplaçables par l’utilisateur. N’ouvrez pas les appareils électriques, les batteries gonflées ou les compartiments de service.", questions: [{ question: "Puis-je remplacer la batterie d’un appareil moi-même ?", answer: "Uniquement si le fabricant l’a conçue pour être remplacée par l’utilisateur et fournit les consignes. Utilisez le type et la polarité indiqués. Arrêtez-vous si la batterie est gonflée, chaude, fuit ou se trouve derrière un panneau de service." }, { question: "Puis-je remplacer l’ampoule du four à la maison ?", answer: "Suivez uniquement les instructions du fabricant pour une lampe remplaçable par l’utilisateur. Laissez le four refroidir et coupez l’alimentation selon la notice ; utilisez une ampoule prévue pour la température du four. Ne retirez pas de panneau et ne touchez pas aux fils." }] },
  "kitchen-household": { description: "Poignées, tiroirs et équipements de cuisine, avec contrôle des dimensions avant achat.", intro: "Trouvez des guides pour les équipements de cuisine et de la maison. Vérifiez l’entraxe, le diamètre, la longueur et le filetage des vis avant de commander.", questions: [{ question: "Comment choisir une poignée de meuble de rechange ?", answer: "Mesurez l’entraxe des trous et vérifiez le diamètre, la longueur et le filetage des vis. Comparez les dimensions de fixation avant l’achat ; ne forcez pas une vis incompatible." }, { question: "Que vérifier avant de remplacer une glissière de tiroir ?", answer: "Retirez le tiroir uniquement selon ses consignes, puis notez la longueur de glissière, le montage, le type d’extension et le côté. Choisissez un modèle équivalent et arrêtez-vous si le meuble ou la glissière est tordu ou abîmé." }] },
  "garden-outdoor": { description: "Petites réparations et entretien des outils à main, tuyaux et équipements de jardin.", intro: "Parcourez les petites réparations de jardin et d’extérieur. Les guides signalent les lames, la pression ou les outils endommagés qui doivent être mis hors service.", questions: [{ question: "Comment entretenir un sécateur manuel ?", answer: "Retirez les résidus végétaux, séchez l’outil et suivez les consignes du fabricant. Gardez les mains loin de la lame ; n’utilisez pas un sécateur dont la poignée est fissurée, la lame desserrée ou le verrou défaillant." }, { question: "Puis-je réparer un manche d’outil de jardin fissuré ?", answer: "N’utilisez pas un outil au manche fissuré ou desserré. Remplacez-le uniquement par une pièce compatible, montée solidement selon les instructions du fabricant ; sinon, adressez-vous à un réparateur ou remplacez l’outil." }] },
  "personal-gear": { description: "Petites réparations de sacs, bagages et accessoires du quotidien.", intro: "Trouvez des solutions pratiques pour les fermetures éclair, sangles et accessoires personnels. N’utilisez pas de réparation maison pour l’escalade, les sièges auto ou les équipements de protection.", questions: [{ question: "Puis-je recoudre une sangle de sac à dos déchirée ?", answer: "Une sangle décorative ou peu sollicitée peut être recousue si le tissu autour est intact. Ne faites pas confiance à une réparation maison pour du matériel d’escalade, un siège enfant, un équipement de protection ou une sangle dont la rupture pourrait blesser." }, { question: "Puis-je remplacer une tirette de fermeture éclair cassée ?", answer: "Si le curseur et les dents fonctionnent, une tirette compatible peut faciliter l’ouverture. Si des dents manquent, si le curseur est fendu ou si la fermeture s’ouvre sous une légère pression, demandez l’aide d’un réparateur de sacs ou d’un retoucheur." }] },
  "toys-leisure": { description: "Réparations simples pour les jouets et objets de loisir non liés à la sécurité.", intro: "Parcourez des réparations de base pour les jouets et objets de loisir. Les petites pièces, les piles et les dégâts structurels peuvent présenter un risque, surtout pour les jeunes enfants.", questions: [{ question: "Quand retirer un jouet abîmé de la circulation ?", answer: "Écartez-le s’il présente de petites pièces détachées, des bords coupants, des fils apparents, une pile qui fuit ou un dommage structurel. Suivez les consignes d’âge et de réparation du fabricant, notamment pour les très jeunes enfants." }, { question: "Puis-je ouvrir un jouet électronique pour le réparer ?", answer: "Utilisez uniquement le compartiment à piles ou l’accès d’entretien prévu par le fabricant. Retirez les piles avant nettoyage si la notice le demande ; ne soudez pas, n’ouvrez pas un adaptateur secteur et ne manipulez pas une pile endommagée." }] },
  "vehicles-powered-equipment": { description: "Vérifications prudentes et pièces remplaçables, avec orientation vers un mécanicien pour les organes de sécurité.", intro: "Trouvez des conseils d’entretien prudents pour véhicules et équipements motorisés. Les freins, la direction, le carburant, la haute tension et les pannes de sécurité doivent être confiés à un mécanicien qualifié.", questions: [{ question: "Quelles tâches d’entretien conviennent à un débutant ?", answer: "Une tâche simple prévue pour l’utilisateur, comme changer un balai d’essuie-glace si la notice l’explique, peut convenir. N’intervenez pas sur les freins, la direction, les airbags, le carburant ou la haute tension sans formation adéquate." }, { question: "Puis-je réparer la batterie d’un vélo ou d’une trottinette électrique ?", answer: "N’ouvrez pas et ne réparez pas vous-même une batterie au lithium. Si elle est chaude, gonflée, fuit, est abîmée ou se comporte anormalement, cessez de l’utiliser et de la charger, puis contactez le fabricant ou un centre qualifié." }] },
  "other-everyday-objects": { description: "Aide à la réparation à partir d’une photo pour les objets du quotidien hors des autres catégories.", intro: "Si l’objet ne correspond à aucune autre catégorie, décrivez le changement et ajoutez une photo. Vitni suggérera une prochaine étape ou un réparateur si le problème reste incertain ou dangereux.", questions: [{ question: "Quelles informations aident à identifier une pièce de rechange ?", answer: "Indiquez la marque et le modèle, toute référence, ajoutez un gros plan net et précisez les dimensions utiles. Vérifiez les dimensions et la compatibilité du fabricant avant commande ; une photo ne révèle pas toujours l’ajustement exact." }, { question: "Quand arrêter la réparation et demander de l’aide ?", answer: "Arrêtez-vous si l’objet est instable, chaud, fume, fuit, est sous pression ou branché au secteur, ou si une défaillance pourrait blesser quelqu’un. Ne l’utilisez plus et contactez un réparateur qualifié ou le fabricant." }] },
};

function shortStepTitle(instruction: string, ordinal: number, locale: string) {
  const action = instruction.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "").split(/[,;]|\bpuis\b/i)[0]?.trim() || instruction;
  const title = action.split(" ").slice(0, 6).join(" ");
  return title ? title.slice(0, 58) : `${locale === "fr" ? "Étape" : "Step"} ${ordinal}`;
}
