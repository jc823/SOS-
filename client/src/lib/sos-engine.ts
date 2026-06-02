/*
 * SOS Assessment — Scoring Engine v3 (Part of Scale Toolkit)
 * Brand: Scale Detailing | Colors: Black, Gold (#C8962E), White
 *
 * 4 pillars, 30 subcategories, each scored 0–5.
 * Weights are hidden from assessor. Final score = percentage.
 * Includes Scaling Probability Algorithm with tier-based revenue goals.
 */

// ─── Types ───

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

export interface SubcategoryDef {
  id: string;
  label: string;
  weight: number;
  pillarId: string;
  hint: string; // Short inline hint for assessor
  rubric: RubricLevel[];
}

export interface PillarDef {
  id: string;
  label: string;
  icon: string;
  subcategories: SubcategoryDef[];
}

export interface SubcategoryInput {
  score: number; // 0–5
  note: string;
}

export interface SubcategoryResult {
  id: string;
  label: string;
  pillarId: string;
  pillarLabel: string;
  weight: number;
  score: number;
  normalized: number;
  points: number;
  maxPoints: number;
  gapPoints: number;
  weightedDeficit: number;
}

export interface PillarResult {
  id: string;
  label: string;
  icon: string;
  score: number;
  maxPoints: number;
  percentage: number;
  band: 'green' | 'yellow' | 'red';
  subcategories: SubcategoryResult[];
}

export interface SOSResult {
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  band: 'green' | 'yellow' | 'red';
  pillars: PillarResult[];
  bottlenecks: SubcategoryResult[];
  topLeveragePriorities: SubcategoryResult[];
}

export type RevenueTier = '20-30' | '30-40' | '40-50' | 'custom';

export interface DependencyGate {
  id: string;
  label: string;
  met: boolean;
  description: string;
  impact: string; // What happens if not met
  relatedSubcategories: string[]; // subcategory IDs that affect this gate
}

export interface MarketIntelligence {
  city: string;
  state: string;
  population: number; // Metro area population
  medianIncome: number; // Median household income
  competitorCount: number; // Estimated detailing shops in area
  searchVolume: string; // 'low' | 'medium' | 'high' | 'very_high'
  marketSaturation: string; // 'low' | 'moderate' | 'high' | 'oversaturated'
  marketOpportunityScore: number; // 0-100 composite score
  insights: string[]; // Key market insights
}

export interface ScalingProbability {
  overall: number; // 0–100%
  pillarContributions: { pillarId: string; label: string; contribution: number; weight: number; score: number }[];
  topBlockers: { id: string; label: string; pillarLabel: string; impact: number; currentScore: number; improvedProb: number }[];
  tier: RevenueTier;
  tierLabel: string;
  customTarget?: number;
  // Dependency-aware fields
  revenueCeiling: number; // Maximum achievable monthly revenue given current state
  dependencyGates: DependencyGate[];
  adSpendCeiling: number; // Revenue ceiling from ad spend alone
  capacityCeiling: number; // Revenue ceiling from team capacity
  systemsCeiling: number; // Revenue ceiling from CRM/systems
  warnings: string[]; // Actionable warnings about what's holding them back
  // Market intelligence fields
  marketIntelligence?: MarketIntelligence;
  marketModifier?: number; // -15 to +10 probability adjustment from market conditions
}

// ─── Rubric Helper ───

function rubric(levels: [string, string, string, string, string, string]): RubricLevel[] {
  const labels = ['Non-existent', 'Poor', 'Below Average', 'Average', 'Good', 'Elite'];
  return levels.map((desc, i) => ({ score: i, label: labels[i], description: desc }));
}

// ─── Pillar Definitions with Rubrics ───

export const PILLARS: PillarDef[] = [
  {
    id: 'services',
    label: 'Services',
    icon: 'Wrench',
    subcategories: [
      {
        id: 'service_menu',
        label: 'Service Menu Structure',
        weight: 5,
        pillarId: 'services',
        hint: 'How well-structured are their service packages and pricing tiers?',
        rubric: rubric([
          'No defined menu. Prices made up on the spot, nothing listed anywhere.',
          'Basic menu exists but incomplete — inconsistent pricing, no tiers or packages.',
          'Menu covers most services but lacks clear tiering, confusing naming, or missing add-ons.',
          'Solid menu with defined packages (e.g., Basic/Premium/Elite), clear pricing, but limited upsell paths.',
          'Well-structured tiered menu with logical pricing, add-on menu, and clear value differentiation between tiers.',
          'Dialed-in menu with strategic tiering, paint correction/ceramic/PPF packages, add-on menu, membership options, and pricing that maximizes average ticket.',
        ]),
      },
      {
        id: 'sop_completeness',
        label: 'SOP Completeness',
        weight: 7,
        pillarId: 'services',
        hint: 'Are there documented step-by-step procedures for every service?',
        rubric: rubric([
          'No SOPs exist. Every tech does things differently every time.',
          'A few informal notes or verbal instructions, but nothing documented or consistent.',
          'Some services have written SOPs but they\'re incomplete, outdated, or not followed consistently.',
          'Most services have documented SOPs. Techs generally follow them but there are gaps in specialty services.',
          'Comprehensive SOPs for all core services with product specs, time targets, and quality checkpoints.',
          'Full SOP library covering every service, edge cases, and seasonal variations. Regularly updated, accessible to all techs, with photo/video references.',
        ]),
      },
      {
        id: 'chemicals_standardization',
        label: 'Chemicals/Product Standardization',
        weight: 5,
        pillarId: 'services',
        hint: 'Is there a defined product lineup or does everyone use whatever they grab?',
        rubric: rubric([
          'No standardization. Random products everywhere, techs bring their own stuff.',
          'Some preferred products but no formal list. Multiple brands for the same purpose, no dilution ratios posted.',
          'A general product list exists but isn\'t enforced. Some techs still freelancing with their own products.',
          'Defined product lineup for most services with dilution ratios. Most techs follow it consistently.',
          'Standardized product lineup with labeled bottles, dilution ratios posted, and a clear system for restocking.',
          'Fully standardized chemical program — labeled, ratioed, organized by service type. Bulk purchasing strategy, cost tracking per job, and techs trained on proper usage.',
        ]),
      },
      {
        id: 'equipment_readiness',
        label: 'Equipment Readiness',
        weight: 5,
        pillarId: 'services',
        hint: 'Is equipment maintained, organized, and ready to go at the start of each day?',
        rubric: rubric([
          'Equipment is broken, missing, or in disrepair. Techs waste time finding or fixing tools.',
          'Most equipment works but poorly maintained. No backup polishers, extractors down frequently.',
          'Equipment functional but disorganized. No maintenance schedule, occasional downtime from breakdowns.',
          'Equipment in decent shape with some organization. Basic maintenance happens but not on a schedule.',
          'Well-maintained equipment with assigned stations, backup tools available, and a maintenance log.',
          'Equipment is immaculate — organized stations, preventive maintenance schedule, backup for every critical tool, daily readiness checklist completed before first car.',
        ]),
      },
      {
        id: 'avg_completion_time',
        label: 'Avg Completion Time (Labor Efficiency)',
        weight: 8,
        pillarId: 'services',
        hint: 'Are jobs completed within target time windows without sacrificing quality?',
        rubric: rubric([
          'No time tracking at all. Jobs take however long they take, no targets set.',
          'Vague awareness of time but no tracking. Most jobs run significantly over what they should.',
          'Some time awareness but inconsistent. Interior details taking 3+ hours that should take 2, no accountability.',
          'Time targets exist for most services. Average completion within 20% of target, but some techs consistently slow.',
          'Solid time tracking with most jobs hitting targets. Techs are accountable and efficient without rushing quality.',
          'Dialed-in time management — jobs consistently hit targets, time tracked per tech per service, efficiency metrics reviewed weekly. Quality maintained at speed.',
        ]),
      },
      {
        id: 'quality_control',
        label: 'Quality Control / Final Inspection',
        weight: 6,
        pillarId: 'services',
        hint: 'Is there a QC step before handing the car back to the customer?',
        rubric: rubric([
          'No QC process. Cars go back to customers without any inspection.',
          'Informal glance-over by the tech who did the work, but no real checklist or second set of eyes.',
          'Occasional spot-checks by a lead or manager, but not systematic or consistent.',
          'A defined QC checklist exists and is used most of the time. Issues caught before delivery about 70% of the time.',
          'Consistent QC process with a checklist, second-person inspection, and issues documented before customer pickup.',
          'Rigorous multi-point QC — checklist completed on every car, photos taken before delivery, issues logged and tracked, customer notified of any findings. Near-zero comebacks.',
        ]),
      },
      {
        id: 'customer_communication',
        label: 'Customer Communication During Service',
        weight: 4,
        pillarId: 'services',
        hint: 'Does the shop update customers on progress, delays, or findings during the job?',
        rubric: rubric([
          'Zero communication. Customer drops off and hears nothing until they call to ask.',
          'Customer gets a call only if there\'s a major issue or significant delay.',
          'Inconsistent updates — some techs text customers, others don\'t. No standard process.',
          'Standard text/call when the car is ready. Customers informed of delays when they happen.',
          'Proactive updates at key milestones (received, in progress, QC, ready). Findings communicated with photos.',
          'Automated + personal communication — status updates at each stage, before/after photos sent, findings documented with recommendations, follow-up after pickup.',
        ]),
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: 'Phone',
    subcategories: [
      {
        id: 'phone_system',
        label: 'Phone System Reliability',
        weight: 4,
        pillarId: 'sales',
        hint: 'Do calls get answered? Is there a professional system in place?',
        rubric: rubric([
          'Personal cell phone only. Missed calls constantly, no voicemail or it\'s full.',
          'Business line exists but goes to voicemail 50%+ of the time. No after-hours handling.',
          'Calls mostly answered during business hours but no system for missed calls or overflow.',
          'Reliable phone system with voicemail-to-text, missed call alerts, and callbacks within a few hours.',
          'Professional phone system — calls answered live 90%+, missed calls returned within 30 min, after-hours routing.',
          'Enterprise-grade system — live answering, call tracking with source attribution, recorded for training, after-hours AI or answering service, zero missed leads.',
        ]),
      },
      {
        id: 'automations_speed',
        label: 'Automations & Speed-to-Lead',
        weight: 6,
        pillarId: 'sales',
        hint: 'How fast do new leads get a response? Are there automated follow-ups?',
        rubric: rubric([
          'No automations. Leads sit in email or voicemail until someone manually checks.',
          'Manual response only, typically 4+ hours. No automated acknowledgment.',
          'Some automation (auto-reply email) but slow personal follow-up. Leads wait 1-2+ hours for real contact.',
          'Auto-response within minutes (text/email). Personal follow-up within 1 hour during business hours.',
          'Instant auto-response with booking link. Personal follow-up within 15 min. Multi-channel (text + email).',
          'Sub-5-minute speed-to-lead with automated nurture sequences, instant text + email, AI-assisted responses, and automated booking. No lead falls through the cracks.',
        ]),
      },
      {
        id: 'tracking_attribution',
        label: 'Tracking & Attribution',
        weight: 6,
        pillarId: 'sales',
        hint: 'Can they tell you where their leads and revenue come from?',
        rubric: rubric([
          'No tracking at all. No idea where leads or revenue come from.',
          'Vague sense ("most come from Google") but no actual data or tracking in place.',
          'Basic tracking — knows lead count but can\'t attribute to specific sources or campaigns.',
          'Tracks leads by source (Google, referral, social) with reasonable accuracy. Knows cost per lead roughly.',
          'Full attribution — lead source, cost per lead, close rate by source, revenue by channel tracked monthly.',
          'Advanced attribution with CRM integration — lifetime value by source, multi-touch attribution, ROI per campaign, automated reporting dashboards.',
        ]),
      },
      {
        id: 'sales_scripting',
        label: 'Sales Scripting Quality',
        weight: 7,
        pillarId: 'sales',
        hint: 'Is there a defined script or talk track for handling inbound leads?',
        rubric: rubric([
          'No script. Everyone wings it. Calls are inconsistent and unprofessional.',
          'Informal talking points but no structure. Calls vary wildly between team members.',
          'A basic script exists but isn\'t practiced or enforced. Key objections not addressed.',
          'Solid script covering intro, needs assessment, and close. Most team members follow it.',
          'Well-crafted script with objection handling, upsell prompts, and urgency builders. Team trained on it.',
          'Elite scripting — tested and refined talk tracks, role-play training sessions, objection handling library, upsell/cross-sell built in, recorded calls reviewed for coaching.',
        ]),
      },
      {
        id: 'follow_up_sops',
        label: 'Open/Follow-up SOPs',
        weight: 5,
        pillarId: 'sales',
        hint: 'What happens to leads that don\'t book immediately?',
        rubric: rubric([
          'No follow-up. If they don\'t book on the first call, they\'re gone.',
          'Occasional manual follow-up but no system. Most unconverted leads are forgotten.',
          'Some follow-up happens but inconsistently. No defined cadence or sequence.',
          'Defined follow-up cadence (e.g., call day 1, text day 3, email day 7) for most leads.',
          'Systematic follow-up with automated + personal touches. Open estimates tracked and followed up on schedule.',
          'Full nurture system — automated sequences by lead type, long-term drip for cold leads, re-engagement campaigns, no lead ever dies. Pipeline reviewed weekly.',
        ]),
      },
      {
        id: 'estimate_quote',
        label: 'Estimate/Quote Process',
        weight: 5,
        pillarId: 'sales',
        hint: 'How professional and fast are their quotes?',
        rubric: rubric([
          'No formal quoting. Prices given verbally off the top of their head, inconsistent.',
          'Quotes given but slow (24+ hours) and unprofessional — plain text or verbal only.',
          'Quotes sent via text/email but no branded template. Pricing sometimes inconsistent between staff.',
          'Professional branded quotes sent within a few hours. Consistent pricing from a rate card.',
          'Fast, branded quotes with clear line items, package options, and a booking CTA. Sent within 1 hour.',
          'Instant or near-instant quoting system — branded proposals with photos, tiered options, financing mention, one-click booking, and automated follow-up if not accepted.',
        ]),
      },
      {
        id: 'review_reputation',
        label: 'Review/Reputation Management',
        weight: 5,
        pillarId: 'sales',
        hint: 'Are they actively generating and managing online reviews?',
        rubric: rubric([
          'No review strategy. Fewer than 20 Google reviews, no active effort to get more.',
          'Some reviews trickle in organically but no system to ask. Negative reviews go unanswered.',
          'Occasionally asks for reviews but no consistent process. Responds to some negative reviews.',
          'Active review request process (text/email after service). Responds to all reviews within a week.',
          'Systematic review generation — automated requests, 4.5+ stars, responds to all reviews within 48 hours, 50+ reviews.',
          'Elite reputation — automated multi-platform review requests, 4.7+ stars, 100+ reviews, all reviews responded to within 24 hours, negative reviews handled with recovery protocol.',
        ]),
      },
      {
        id: 'rebooking_retention',
        label: 'Rebooking / Retention Strategy',
        weight: 5,
        pillarId: 'sales',
        hint: 'Do they have a system to get repeat business and retain customers?',
        rubric: rubric([
          'No retention strategy. One-and-done transactions, no effort to rebook.',
          'Occasionally mentions "come back anytime" but no system or follow-up.',
          'Some rebooking happens but it\'s manual and inconsistent. No membership or maintenance plans.',
          'Active rebooking effort — follow-up emails/texts after service, some maintenance plan offerings.',
          'Defined retention system — maintenance plans, membership options, automated rebooking reminders, loyalty program.',
          'Full retention engine — tiered memberships, automated maintenance reminders, anniversary/seasonal campaigns, referral program, VIP perks, 40%+ repeat customer rate.',
        ]),
      },
    ],
  },
  {
    id: 'ads',
    label: 'Ads',
    icon: 'Megaphone',
    subcategories: [
      {
        id: 'google_presence',
        label: 'Google Presence (GBP Health)',
        weight: 7,
        pillarId: 'ads',
        hint: 'How optimized and active is their Google Business Profile?',
        rubric: rubric([
          'No GBP claimed, or claimed but completely empty/unoptimized.',
          'GBP claimed but minimal info — missing hours, few photos, no posts, wrong category.',
          'Basic GBP setup with hours and contact info, but few photos, no posts, incomplete services list.',
          'Decent GBP — correct info, 20+ photos, some posts, services listed, but not actively managed.',
          'Well-optimized GBP — regular posts, 50+ photos, all services listed, Q&A managed, review responses.',
          'Elite GBP — weekly posts, 100+ photos organized by category, all services with descriptions, active Q&A, products listed, booking link, consistently in local 3-pack.',
        ]),
      },
      {
        id: 'paid_ads',
        label: 'Paid Ads Performance',
        weight: 9,
        pillarId: 'ads',
        hint: 'Are they running paid ads? What\'s the ROI and lead quality?',
        rubric: rubric([
          'No paid advertising at all. Relying entirely on word-of-mouth or organic.',
          'Tried ads but stopped — wasted budget, no tracking, or boosted Facebook posts only.',
          'Running ads but poorly — no conversion tracking, broad targeting, high cost per lead, low quality leads.',
          'Active Google Ads with basic tracking. Getting leads but cost per lead is high or lead quality is inconsistent.',
          'Well-managed ads — Google Ads with conversion tracking, reasonable CPL, LSA active, retargeting in place.',
          'Elite ad program — Google Ads + LSA optimized, Facebook/IG retargeting, conversion tracking on all channels, CPL under $30, ROAS tracked monthly, landing pages tested.',
        ]),
      },
      {
        id: 'website_conversion',
        label: 'Website Conversion Health',
        weight: 6,
        pillarId: 'ads',
        hint: 'Does their website convert visitors into leads effectively?',
        rubric: rubric([
          'No website, or a broken/outdated site that hurts credibility.',
          'Basic website exists but looks dated, slow to load, no clear CTA, not mobile-friendly.',
          'Decent website but weak conversion — no click-to-call, buried contact form, no booking widget.',
          'Professional website with clear CTAs, mobile-friendly, booking form or widget, but no chat or speed optimization.',
          'Strong converting site — fast, mobile-optimized, prominent CTAs, booking widget, chat, before/after gallery, trust signals.',
          'Elite conversion machine — sub-2s load time, A/B tested CTAs, live chat, instant quote tool, before/after gallery, video testimonials, service area pages, tracking pixels on all pages.',
        ]),
      },
      {
        id: 'social_presence',
        label: 'Social Presence',
        weight: 3,
        pillarId: 'ads',
        hint: 'Are they active on social media with quality content?',
        rubric: rubric([
          'No social media presence, or accounts exist but completely inactive.',
          'Accounts exist but rarely posted — last post was months ago, low quality content.',
          'Posts occasionally (1-2x/month) but inconsistent quality, no engagement strategy.',
          'Regular posting (weekly) with decent content — before/afters, some reels/stories.',
          'Active social presence — 3-4x/week posting, quality before/afters, reels, stories, engagement with followers.',
          'Elite social — daily content, professional photography/videography, trending formats, strong engagement, DM strategy, content calendar, brand voice consistent.',
        ]),
      },
      {
        id: 'branding_consistency',
        label: 'Branding Consistency',
        weight: 3,
        pillarId: 'ads',
        hint: 'Is their brand consistent across all touchpoints?',
        rubric: rubric([
          'No brand identity. Different logos, colors, and messaging everywhere.',
          'Has a logo but inconsistent usage. Website, social, and print materials don\'t match.',
          'Some brand consistency but gaps — logo is consistent but colors, fonts, and tone vary across platforms.',
          'Decent branding — consistent logo, colors, and general look across most touchpoints.',
          'Strong brand — consistent visual identity across website, social, uniforms, vehicle wraps, and print materials.',
          'Elite brand — cohesive brand guide followed everywhere, professional photography style, consistent voice and tone, branded customer experience from first touch to follow-up.',
        ]),
      },
      {
        id: 'content_creation',
        label: 'Content Creation Capability',
        weight: 5,
        pillarId: 'ads',
        hint: 'Are they producing photos/videos of their work consistently?',
        rubric: rubric([
          'No content creation. No photos or videos of their work being produced.',
          'Occasional phone photos but poor quality, bad lighting, inconsistent.',
          'Takes photos of most jobs but quality varies. Rarely produces video content.',
          'Consistent photo documentation of work with decent quality. Some video content (time-lapses, reels).',
          'Quality content production — good lighting, before/after shots on every job, regular video content, some editing.',
          'Professional content pipeline — dedicated photo/video setup, ring lights, consistent angles, edited reels and time-lapses, content repurposed across platforms, content calendar.',
        ]),
      },
      {
        id: 'local_seo',
        label: 'Local SEO Beyond GBP',
        weight: 4,
        pillarId: 'ads',
        hint: 'Are they listed in directories, building citations, and ranking organically?',
        rubric: rubric([
          'No local SEO effort beyond GBP. Not listed in any directories.',
          'Listed in 1-2 directories (Yelp maybe) but info is inconsistent or outdated.',
          'Listed in several directories but NAP (name, address, phone) inconsistent across listings.',
          'Consistent NAP across major directories (Yelp, BBB, Facebook, Apple Maps). Some organic traffic.',
          'Strong local SEO — consistent citations, service area pages on website, blog content, ranking for key terms.',
          'Elite local SEO — 50+ consistent citations, optimized service area pages, regular blog content, backlinks from local sites, ranking top 3 for primary keywords organically.',
        ]),
      },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'Users',
    subcategories: [
      {
        id: 'labor_efficiency',
        label: 'Labor Efficiency',
        weight: 7,
        pillarId: 'team',
        hint: 'Is labor cost in line with revenue? Are techs productive?',
        rubric: rubric([
          'No labor tracking. No idea what labor costs are relative to revenue.',
          'Labor costs are high (50%+ of revenue) with no tracking or accountability.',
          'Some awareness of labor costs but no per-tech tracking. Idle time is common.',
          'Labor costs tracked at the shop level. Generally in the 35-45% range but not optimized per tech.',
          'Per-tech productivity tracked. Labor costs 30-38% of revenue. Minimal idle time, efficient scheduling.',
          'Elite labor management — per-tech revenue tracked, labor under 32%, efficiency bonuses, scheduling optimized to demand, zero idle time during peak hours.',
        ]),
      },
      {
        id: 'staffing_coverage',
        label: 'Staffing Coverage / Open Time',
        weight: 6,
        pillarId: 'team',
        hint: 'Do they have enough staff to cover demand without excessive downtime?',
        rubric: rubric([
          'Severely understaffed or overstaffed. Turning away work constantly or paying people to stand around.',
          'Frequent staffing gaps — calling in favors, owner doing tech work to cover, or significant idle time.',
          'Staffing mostly covers demand but tight — one callout throws everything off. No flex capacity.',
          'Adequate staffing for normal demand. Can handle a busy day but struggles with spikes.',
          'Well-staffed with some flex capacity. Part-time/on-call techs available for busy periods.',
          'Optimized staffing — demand forecasting, flex team, cross-trained staff, seasonal adjustments planned in advance. Never turning away profitable work.',
        ]),
      },
      {
        id: 'team_quality',
        label: 'Team Member Quality',
        weight: 5,
        pillarId: 'team',
        hint: 'How skilled and reliable are the individual team members?',
        rubric: rubric([
          'Unreliable team — frequent no-shows, poor work quality, high customer complaints.',
          'Team shows up but work quality is inconsistent. Some good techs carrying the rest.',
          'Average team — most are reliable but skill levels vary significantly. Quality depends on who does the job.',
          'Good team overall — reliable, decent skills, but a few members need improvement or replacement.',
          'Strong team — skilled, reliable, take pride in their work. Minimal quality variance between techs.',
          'Elite team — highly skilled, self-motivated, consistent quality across all techs, low turnover, team members actively improving their craft.',
        ]),
      },
      {
        id: 'training_standardization',
        label: 'Training Standardization',
        weight: 5,
        pillarId: 'team',
        hint: 'Is there a structured training program or is it "watch and learn"?',
        rubric: rubric([
          'No training program. New hires figure it out on their own or shadow randomly.',
          'Informal "watch me do it" training with no structure, timeline, or skill verification.',
          'Some training materials exist but aren\'t used consistently. Training quality depends on who\'s teaching.',
          'Defined training program with a general curriculum. New hires go through a structured first week.',
          'Comprehensive training — documented curriculum, skill checkpoints, hands-on practice, mentor assigned.',
          'Elite training program — tiered skill levels, certification for each service, ongoing education, product training from vendors, annual skill assessments, career progression path.',
        ]),
      },
      {
        id: 'onboarding_process',
        label: 'Onboarding Process',
        weight: 4,
        pillarId: 'team',
        hint: 'How smooth is the process of bringing a new hire up to speed?',
        rubric: rubric([
          'No onboarding. New hire shows up and is thrown into work day one.',
          'Minimal onboarding — shown where things are, given a shirt, and told to start.',
          'Basic onboarding with some paperwork and introductions, but no structured first-week plan.',
          'Defined onboarding checklist — paperwork, tour, introductions, basic training schedule for first week.',
          'Solid onboarding — welcome packet, structured first 2 weeks, assigned mentor, clear expectations set.',
          'Elite onboarding — branded welcome experience, 30/60/90 day plan, mentor program, culture immersion, regular check-ins, clear path to full productivity.',
        ]),
      },
      {
        id: 'hiring_process',
        label: 'Hiring Process',
        weight: 3,
        pillarId: 'team',
        hint: 'How do they find and select new team members?',
        rubric: rubric([
          'No hiring process. Hires whoever applies or whoever they know. Desperation hires.',
          'Posts on Craigslist/Indeed occasionally but no screening process. Hires based on gut feel.',
          'Has job postings up but screening is minimal — quick interview, no skills assessment.',
          'Defined hiring process — structured interview questions, basic skills assessment, reference checks.',
          'Strong hiring — compelling job postings, multi-step interview, skills test, culture fit assessment, competitive offer.',
          'Elite hiring — employer brand, pipeline of candidates, structured interviews with scorecards, paid working interview, competitive comp + benefits, 90-day probation with clear benchmarks.',
        ]),
      },
      {
        id: 'culture_morale',
        label: 'Culture / Morale',
        weight: 5,
        pillarId: 'team',
        hint: 'Does the team seem engaged, motivated, and positive?',
        rubric: rubric([
          'Toxic or nonexistent culture. Team is disengaged, complaining, or hostile. High turnover.',
          'Low morale — team does the minimum, no camaraderie, owner/manager relationship is strained.',
          'Neutral culture — people show up and do their jobs but there\'s no energy or team spirit.',
          'Decent culture — team gets along, some positive energy, but no intentional culture-building.',
          'Good culture — team enjoys working together, owner invests in team activities, positive environment.',
          'Elite culture — team is bought in to the mission, high energy, celebrates wins, low turnover, team members recruit their friends, owner actively builds and protects culture.',
        ]),
      },
      {
        id: 'compensation_structure',
        label: 'Compensation Structure',
        weight: 4,
        pillarId: 'team',
        hint: 'Is pay structured to attract talent and incentivize performance?',
        rubric: rubric([
          'Below market pay, no structure. Flat hourly with no path to earn more.',
          'Basic hourly pay, slightly below market. No bonuses, no performance incentives.',
          'Market-rate hourly pay but no performance component. No clear path to raises.',
          'Competitive base pay with some bonus structure (e.g., monthly bonus for hitting targets).',
          'Strong comp — competitive base + performance bonuses + clear raise criteria. Techs know how to earn more.',
          'Elite comp structure — competitive base, tiered commission/bonus, efficiency bonuses, benefits (health/PTO), profit sharing or equity path, annual reviews with clear advancement.',
        ]),
      },
    ],
  },
];

// ─── Derived Constants ───

export const ALL_SUBCATEGORIES = PILLARS.flatMap(p =>
  p.subcategories.map(s => ({ ...s, pillarLabel: p.label }))
);
export const ALL_SUBCATEGORY_IDS = ALL_SUBCATEGORIES.map(s => s.id);
export const TOTAL_MAX_WEIGHTED = PILLARS.reduce(
  (sum, p) => sum + p.subcategories.reduce((s, sub) => s + sub.weight * 5, 0),
  0
);

// ─── Severity Bands (percentage-based) ───

export function getOverallBand(pct: number): 'green' | 'yellow' | 'red' {
  if (pct >= 80) return 'green';
  if (pct >= 60) return 'yellow';
  return 'red';
}

export function getPillarBand(pct: number): 'green' | 'yellow' | 'red' {
  if (pct >= 80) return 'green';
  if (pct >= 60) return 'yellow';
  return 'red';
}

// ─── Core Scoring Algorithm ───

export function computeSOS(inputs: Record<string, SubcategoryInput>): SOSResult {
  const allSubResults: SubcategoryResult[] = [];
  const pillarResults: PillarResult[] = [];

  for (const pillar of PILLARS) {
    const subResults: SubcategoryResult[] = [];
    let pillarWeightedSum = 0;
    let pillarMaxWeighted = 0;

    for (const sub of pillar.subcategories) {
      const input = inputs[sub.id] || { score: 0, note: '' };
      const score = Math.max(0, Math.min(5, input.score));
      const normalized = score / 5;
      const points = score * sub.weight; // weighted points
      const maxPoints = 5 * sub.weight;
      const gapPoints = maxPoints - points;
      const weightedDeficit = sub.weight * (1 - normalized);

      pillarWeightedSum += points;
      pillarMaxWeighted += maxPoints;

      const result: SubcategoryResult = {
        id: sub.id,
        label: sub.label,
        pillarId: pillar.id,
        pillarLabel: pillar.label,
        weight: sub.weight,
        score,
        normalized,
        points: Math.round(points * 100) / 100,
        maxPoints,
        gapPoints: Math.round(gapPoints * 100) / 100,
        weightedDeficit: Math.round(weightedDeficit * 100) / 100,
      };

      subResults.push(result);
      allSubResults.push(result);
    }

    const pillarPct = pillarMaxWeighted > 0 ? (pillarWeightedSum / pillarMaxWeighted) * 100 : 0;
    const roundedPct = Math.round(pillarPct * 10) / 10;

    pillarResults.push({
      id: pillar.id,
      label: pillar.label,
      icon: pillar.icon,
      score: Math.round(pillarWeightedSum * 100) / 100,
      maxPoints: pillarMaxWeighted,
      percentage: roundedPct,
      band: getPillarBand(roundedPct),
      subcategories: subResults,
    });
  }

  // Overall percentage: weighted average across all subcategories
  const totalWeightedSum = pillarResults.reduce((s, p) => s + p.score, 0);
  const totalMaxWeighted = pillarResults.reduce((s, p) => s + p.maxPoints, 0);
  const overallPct = totalMaxWeighted > 0 ? (totalWeightedSum / totalMaxWeighted) * 100 : 0;
  const roundedOverall = Math.round(overallPct * 10) / 10;

  // Bottlenecks: ranked by weighted_deficit highest → lowest
  const bottlenecks = [...allSubResults]
    .sort((a, b) => b.weightedDeficit - a.weightedDeficit)
    .filter(r => r.weightedDeficit > 0);

  // Top 3 leverage priorities: largest gap_points
  const topLeveragePriorities = [...allSubResults]
    .sort((a, b) => b.gapPoints - a.gapPoints)
    .slice(0, 3);

  return {
    totalPoints: Math.round(totalWeightedSum * 100) / 100,
    maxPoints: totalMaxWeighted,
    percentage: roundedOverall,
    band: getOverallBand(roundedOverall),
    pillars: pillarResults,
    bottlenecks,
    topLeveragePriorities,
  };
}

// ─── Scaling Probability Algorithm ───

const TIER_CONFIG: Record<RevenueTier, { label: string; baseThreshold: number; steepness: number; pillarWeights: Record<string, number> }> = {
  '20-30': {
    label: '$20k–$30k/mo',
    baseThreshold: 65, // need solid scores to scale even to $20-30k
    steepness: 0.08,
    pillarWeights: { services: 0.25, sales: 0.30, ads: 0.25, team: 0.20 },
  },
  '30-40': {
    label: '$30k–$40k/mo',
    baseThreshold: 72,
    steepness: 0.07,
    pillarWeights: { services: 0.25, sales: 0.25, ads: 0.28, team: 0.22 },
  },
  '40-50': {
    label: '$40k–$50k/mo',
    baseThreshold: 80,
    steepness: 0.06,
    pillarWeights: { services: 0.25, sales: 0.25, ads: 0.25, team: 0.25 },
  },
  'custom': {
    label: 'Custom Target',
    baseThreshold: 75,
    steepness: 0.07,
    pillarWeights: { services: 0.25, sales: 0.25, ads: 0.25, team: 0.25 },
  },
};

/**
 * Compute revenue ceiling from ad spend level.
 * $0-500/mo → $15-18k ceiling (word-of-mouth only)
 * $500-1k → $18-22k ceiling
 * $1-2k → $20-30k ceiling
 * $2-4k → $30-50k ceiling
 * $4k+ → $50k+ ceiling (if systems support it)
 */
function computeAdSpendCeiling(monthlyAdSpend: number): number {
  if (monthlyAdSpend <= 0) return 15000;
  if (monthlyAdSpend <= 500) return 15000 + (monthlyAdSpend / 500) * 3000; // 15k-18k
  if (monthlyAdSpend <= 1000) return 18000 + ((monthlyAdSpend - 500) / 500) * 4000; // 18k-22k
  if (monthlyAdSpend <= 2000) return 22000 + ((monthlyAdSpend - 1000) / 1000) * 8000; // 22k-30k
  if (monthlyAdSpend <= 4000) return 30000 + ((monthlyAdSpend - 2000) / 2000) * 20000; // 30k-50k
  return 50000 + ((monthlyAdSpend - 4000) / 6000) * 25000; // 50k-75k, diminishing returns
}

/**
 * Compute capacity ceiling from team/staffing scores.
 * Owner-operator with no employees → $15-20k max
 * Small team (1-2 techs) → $20-35k
 * Full team (3+) → $35-50k+
 */
function computeCapacityCeiling(
  staffingScore: number, // staffing_coverage score 0-5
  teamQualityScore: number, // team_quality score 0-5
  laborEfficiencyScore: number // labor_efficiency score 0-5
): number {
  // staffingScore is the key driver:
  // 0-1 = owner-operator, no real team
  // 2 = maybe 1 helper
  // 3 = small team
  // 4 = well-staffed
  // 5 = optimized staffing
  if (staffingScore <= 1) return 18000; // Owner-operator ceiling
  if (staffingScore <= 2) return 25000; // 1 helper
  
  // With a real team, quality and efficiency matter
  const teamMultiplier = 0.6 + (teamQualityScore / 5) * 0.4; // 0.6-1.0
  const efficiencyMultiplier = 0.7 + (laborEfficiencyScore / 5) * 0.3; // 0.7-1.0
  
  if (staffingScore <= 3) return Math.round(35000 * teamMultiplier * efficiencyMultiplier);
  if (staffingScore <= 4) return Math.round(50000 * teamMultiplier * efficiencyMultiplier);
  return Math.round(65000 * teamMultiplier * efficiencyMultiplier);
}

/**
 * Compute systems ceiling from CRM/follow-up/automation scores.
 * No CRM or follow-up → $15k ceiling (leads leak out)
 * Basic systems → $20-30k
 * Strong systems → $30-50k+
 */
function computeSystemsCeiling(
  automationsScore: number, // automations_speed score 0-5
  followUpScore: number, // follow_up_sops score 0-5
  trackingScore: number // tracking_attribution score 0-5
): number {
  const avgSystemsScore = (automationsScore + followUpScore + trackingScore) / 3;
  
  if (avgSystemsScore <= 1) return 15000; // No systems = leads leak
  if (avgSystemsScore <= 2) return 22000; // Minimal systems
  if (avgSystemsScore <= 3) return 35000; // Basic CRM
  if (avgSystemsScore <= 4) return 50000; // Good systems
  return 65000; // Elite systems
}

/**
 * Evaluate dependency gates — prerequisites that must be met for scaling.
 */
function evaluateDependencyGates(
  inputs: Record<string, { score: number }>
): { gates: DependencyGate[]; warnings: string[] } {
  const gates: DependencyGate[] = [];
  const warnings: string[] = [];

  // Gate 1: CRM / Lead Follow-up System
  const automationsScore = inputs['automations_speed']?.score || 0;
  const followUpScore = inputs['follow_up_sops']?.score || 0;
  const crmAvg = (automationsScore + followUpScore) / 2;
  const crmMet = crmAvg > 2;
  gates.push({
    id: 'crm',
    label: 'CRM & Follow-Up System',
    met: crmMet,
    description: crmMet
      ? 'Lead follow-up systems are in place'
      : 'No reliable CRM or follow-up process',
    impact: 'Without a CRM, leads fall through the cracks. Ad spend is wasted because nobody follows up.',
    relatedSubcategories: ['automations_speed', 'follow_up_sops'],
  });
  if (!crmMet) {
    warnings.push('No CRM or follow-up system — increasing ad spend will waste money because leads aren\'t being followed up');
  }

  // Gate 2: Employee Capacity
  const staffingScore = inputs['staffing_coverage']?.score || 0;
  const capacityMet = staffingScore >= 2;
  gates.push({
    id: 'capacity',
    label: 'Team Capacity',
    met: capacityMet,
    description: capacityMet
      ? 'Team can handle increased volume'
      : 'Owner-operator with no team to scale',
    impact: 'Without employees, you\'re capped at what one person can physically do — roughly $15-20k/mo max.',
    relatedSubcategories: ['staffing_coverage', 'team_quality'],
  });
  if (!capacityMet) {
    warnings.push('No employees — owner-operator ceiling is ~$18k/mo regardless of how good your ads or sales are');
  }

  // Gate 3: Sales Process
  const scriptingScore = inputs['sales_scripting']?.score || 0;
  const phoneScore = inputs['phone_system']?.score || 0;
  const salesProcessAvg = (scriptingScore + phoneScore) / 2;
  const salesMet = salesProcessAvg > 2;
  gates.push({
    id: 'sales_process',
    label: 'Sales Process',
    met: salesMet,
    description: salesMet
      ? 'Sales process can convert leads into customers'
      : 'No sales process to convert leads',
    impact: 'Leads come in but nobody knows how to close them. Low close rate means high cost per customer.',
    relatedSubcategories: ['sales_scripting', 'phone_system', 'estimate_quote'],
  });
  if (!salesMet) {
    warnings.push('Weak sales process — leads are coming in but close rate is too low to justify ad spend');
  }

  // Gate 4: Service Delivery
  const sopScore = inputs['sop_completeness']?.score || 0;
  const qcScore = inputs['quality_control']?.score || 0;
  const deliveryAvg = (sopScore + qcScore) / 2;
  const deliveryMet = deliveryAvg > 2;
  gates.push({
    id: 'delivery',
    label: 'Service Delivery',
    met: deliveryMet,
    description: deliveryMet
      ? 'Service quality is consistent enough to scale'
      : 'Inconsistent service quality will kill growth',
    impact: 'Scaling with bad service means more negative reviews, more comebacks, and customers who never return.',
    relatedSubcategories: ['sop_completeness', 'quality_control', 'avg_completion_time'],
  });
  if (!deliveryMet) {
    warnings.push('Service delivery is inconsistent — scaling will amplify quality problems and damage reputation');
  }

  return { gates, warnings };
}

/**
 * Compute market modifier from market intelligence data.
 * High opportunity markets get a probability boost, oversaturated markets get a penalty.
 * Range: -15 to +10
 */
export function computeMarketModifier(market: MarketIntelligence | undefined | null): number {
  if (!market) return 0; // No market data = no modifier

  let modifier = 0;

  // Population factor: larger markets = more opportunity
  if (market.population >= 1000000) modifier += 3;
  else if (market.population >= 500000) modifier += 2;
  else if (market.population >= 200000) modifier += 1;
  else if (market.population < 50000) modifier -= 3; // Very small market
  else if (market.population < 100000) modifier -= 1;

  // Income factor: higher income = more premium detailing demand
  if (market.medianIncome >= 85000) modifier += 3;
  else if (market.medianIncome >= 70000) modifier += 2;
  else if (market.medianIncome >= 55000) modifier += 1;
  else if (market.medianIncome < 40000) modifier -= 3;
  else if (market.medianIncome < 50000) modifier -= 1;

  // Competition/saturation factor
  const saturation = market.marketSaturation;
  if (saturation === 'low') modifier += 4; // Blue ocean
  else if (saturation === 'moderate') modifier += 1;
  else if (saturation === 'high') modifier -= 3;
  else if (saturation === 'oversaturated') modifier -= 6;

  // Search volume factor: high demand = more organic opportunity
  const volume = market.searchVolume;
  if (volume === 'very_high') modifier += 3;
  else if (volume === 'high') modifier += 2;
  else if (volume === 'medium') modifier += 0;
  else if (volume === 'low') modifier -= 3;

  // Clamp to range
  return Math.max(-15, Math.min(10, modifier));
}

export function computeScalingProbability(
  result: SOSResult,
  tier: RevenueTier,
  customTarget?: number,
  adSpend?: number, // Monthly ad spend in dollars
  inputs?: Record<string, { score: number }>, // Raw subcategory inputs for dependency checks
  marketData?: MarketIntelligence | null // Market intelligence data for location-based adjustments
): ScalingProbability {
  const config = TIER_CONFIG[tier];

  // For custom targets, adjust threshold based on target amount
  let effectiveThreshold = config.baseThreshold;
  if (tier === 'custom' && customTarget) {
    if (customTarget <= 25000) effectiveThreshold = 50;
    else if (customTarget <= 35000) effectiveThreshold = 60;
    else if (customTarget <= 50000) effectiveThreshold = 72;
    else if (customTarget <= 75000) effectiveThreshold = 82;
    else effectiveThreshold = 90;
  }

  // Compute weighted pillar score for this tier
  const pillarContributions = result.pillars.map(p => {
    const weight = config.pillarWeights[p.id] || 0.25;
    const contribution = (p.percentage / 100) * weight;
    return {
      pillarId: p.id,
      label: p.label,
      contribution: Math.round(contribution * 1000) / 10,
      weight: Math.round(weight * 100),
      score: p.percentage,
    };
  });

  const weightedScore = pillarContributions.reduce((s, p) => s + p.contribution, 0);

  // Sigmoid-based probability curve
  const midpoint = effectiveThreshold;
  const steepness = config.steepness;
  const rawProb = 100 / (1 + Math.exp(-steepness * (weightedScore - midpoint)));

  // ─── Dependency Gates ───
  const { gates, warnings } = inputs
    ? evaluateDependencyGates(inputs)
    : { gates: [] as DependencyGate[], warnings: [] as string[] };

  // ─── Revenue Ceilings ───
  const effectiveAdSpend = adSpend ?? 0;
  const adSpendCeiling = computeAdSpendCeiling(effectiveAdSpend);

  // Extract subcategory scores for capacity/systems ceilings
  const staffingScore = inputs?.['staffing_coverage']?.score ?? 3;
  const teamQualityScore = inputs?.['team_quality']?.score ?? 3;
  const laborEffScore = inputs?.['labor_efficiency']?.score ?? 3;
  const automationsScore = inputs?.['automations_speed']?.score ?? 3;
  const followUpScore = inputs?.['follow_up_sops']?.score ?? 3;
  const trackingScore = inputs?.['tracking_attribution']?.score ?? 3;

  const capacityCeiling = computeCapacityCeiling(staffingScore, teamQualityScore, laborEffScore);
  const systemsCeiling = computeSystemsCeiling(automationsScore, followUpScore, trackingScore);

  // The actual revenue ceiling is the MINIMUM of all ceilings
  // You're only as strong as your weakest link
  const revenueCeiling = Math.min(adSpendCeiling, capacityCeiling, systemsCeiling);

  // ─── Dependency-Adjusted Probability ───
  // Start with the raw sigmoid probability
  let adjustedProb = rawProb;

  // Critical pillar penalty (existing logic)
  const criticalPillarPenalty = result.pillars.reduce((penalty, p) => {
    if (p.percentage < 50) {
      const severity = (50 - p.percentage) / 50;
      return penalty + severity * 20;
    }
    return penalty;
  }, 0);
  adjustedProb -= criticalPillarPenalty;

  // Ads baseline penalty
  const adsPillar = result.pillars.find(p => p.id === 'ads');
  const adsBasePenalty = adsPillar && adsPillar.percentage < 60 ? (60 - adsPillar.percentage) * 0.5 : 0;
  adjustedProb -= adsBasePenalty;

  // Sales penalty
  const salesPillar = result.pillars.find(p => p.id === 'sales');
  const salesPenalty = salesPillar && salesPillar.percentage < 55 ? (55 - salesPillar.percentage) * 0.3 : 0;
  adjustedProb -= salesPenalty;

  // NEW: Dependency gate penalties
  // Each unmet gate reduces probability significantly
  const unmetGates = gates.filter(g => !g.met);
  const gatePenalty = unmetGates.length * 12; // 12% per unmet gate
  adjustedProb -= gatePenalty;

  // NEW: Ad spend probability adjustment
  // Low ad spend caps probability even if everything else is perfect
  const goalRevenue = tier === 'custom' && customTarget ? customTarget
    : tier === '20-30' ? 25000 : tier === '30-40' ? 35000 : 45000;
  if (revenueCeiling < goalRevenue) {
    // The ceiling is below the goal — apply a proportional penalty
    const ceilingRatio = revenueCeiling / goalRevenue;
    const ceilingPenalty = (1 - ceilingRatio) * 40; // Up to 40% penalty
    adjustedProb -= ceilingPenalty;
    
    // Add specific warnings about what's limiting them
    if (adSpendCeiling === revenueCeiling && effectiveAdSpend < 2000) {
      warnings.push(`Ad spend of $${effectiveAdSpend.toLocaleString()}/mo caps revenue potential at ~$${Math.round(adSpendCeiling / 1000)}k/mo — need $2-4k/mo to reach ${tier === 'custom' ? `$${Math.round(goalRevenue / 1000)}k` : config.label}`);
    }
    if (capacityCeiling === revenueCeiling) {
      warnings.push(`Team capacity limits revenue to ~$${Math.round(capacityCeiling / 1000)}k/mo — need to hire or improve team efficiency`);
    }
    if (systemsCeiling === revenueCeiling) {
      warnings.push(`CRM/systems limit revenue to ~$${Math.round(systemsCeiling / 1000)}k/mo — leads are leaking without proper follow-up`);
    }
  }

  // NEW: Market intelligence modifier
  const marketMod = computeMarketModifier(marketData);
  adjustedProb += marketMod;

  // Add market-related warnings
  if (marketData) {
    if (marketMod <= -5) {
      warnings.push(`Challenging market conditions in ${marketData.city}, ${marketData.state} — ${marketData.marketSaturation} competition with ${marketData.searchVolume} search demand`);
    }
    if (marketData.population < 100000) {
      warnings.push(`Small market (${marketData.population.toLocaleString()} population) limits total addressable customers`);
    }
    if (marketData.medianIncome < 50000) {
      warnings.push(`Below-average median income ($${marketData.medianIncome.toLocaleString()}) may limit premium service demand`);
    }
  }

  const finalProb = Math.max(2, Math.min(95, adjustedProb));
  const roundedProb = Math.round(finalProb * 10) / 10;

  // Top blockers: subcategories whose improvement would most increase probability
  const topBlockers = result.bottlenecks.slice(0, 5).map(b => {
    const pillarWeight = config.pillarWeights[b.pillarId] || 0.25;
    const improvementImpact = b.weightedDeficit * pillarWeight * 3.5;
    return {
      id: b.id,
      label: b.label,
      pillarLabel: b.pillarLabel,
      impact: Math.round(improvementImpact * 10) / 10,
      currentScore: b.score,
      improvedProb: Math.min(95, Math.round((roundedProb + improvementImpact) * 10) / 10),
    };
  });

  return {
    overall: roundedProb,
    pillarContributions,
    topBlockers,
    tier,
    tierLabel: tier === 'custom' && customTarget
      ? `$${(customTarget / 1000).toFixed(0)}k/mo`
      : config.label,
    customTarget,
    revenueCeiling,
    dependencyGates: gates,
    adSpendCeiling,
    capacityCeiling,
    systemsCeiling,
    warnings,
    marketIntelligence: marketData ?? undefined,
    marketModifier: marketMod,
  };
}

// ─── Band Helpers ───

export function getBandColor(band: 'green' | 'yellow' | 'red'): string {
  switch (band) {
    case 'green': return '#2ECC71';
    case 'yellow': return '#D4A843';
    case 'red': return '#E74C3C';
  }
}

export function getBandLabel(band: 'green' | 'yellow' | 'red'): string {
  switch (band) {
    case 'green': return 'Healthy';
    case 'yellow': return 'Needs Attention';
    case 'red': return 'Critical';
  }
}

export function getProbabilityColor(prob: number): string {
  if (prob >= 70) return '#2ECC71';
  if (prob >= 45) return '#D4A843';
  return '#E74C3C';
}

export function getProbabilityLabel(prob: number): string {
  if (prob >= 80) return 'Strong';
  if (prob >= 60) return 'Moderate';
  if (prob >= 40) return 'Challenging';
  if (prob >= 20) return 'Unlikely';
  return 'Very Unlikely';
}
