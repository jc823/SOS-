/**
 * Consultation Descriptions
 * Plain-English, customer-facing descriptions for each subcategory
 * at 3 levels: needs_work, okay, strong
 */

interface ConsultationDesc {
  question: string;
  needsWork: string;
  okay: string;
  strong: string;
  painPoint: string;
}

type ConsultationDescMap = Record<string, ConsultationDesc>;

export const CONSULTATION_DESCRIPTIONS: ConsultationDescMap = {
  service_menu: {
    question: "Do you have clear, defined service packages with set prices?",
    needsWork: "No set menu — you quote each job differently and it confuses customers",
    okay: "Basic packages exist but pricing isn't consistent",
    strong: "Clear tiered packages (Basic, Standard, Premium) with locked prices and upsells",
    painPoint: "Revenue leak",
  },
  sop_completeness: {
    question: "Does every detail job follow a documented step-by-step process?",
    needsWork: "Each job is done differently — quality varies by who's doing it",
    okay: "Some guidelines exist but not everyone follows them",
    strong: "Written SOPs for every service — consistent results every time",
    painPoint: "Quality gap",
  },
  chemicals_standardization: {
    question: "Are you using standardized, professional-grade products consistently?",
    needsWork: "Using whatever's available — no standard products or protocols",
    okay: "Core products chosen but not everyone uses them correctly",
    strong: "Full chemical kit standardized, tested, and documented for every service",
    painPoint: "Quality gap",
  },
  equipment_readiness: {
    question: "Is your equipment ready to work every single day?",
    needsWork: "Equipment breaks down often, causing delays and cancellations",
    okay: "Usually ready but no maintenance schedule",
    strong: "Daily equipment check routine, spare parts on hand, zero downtime",
    painPoint: "Revenue leak",
  },
  avg_completion_time: {
    question: "Do you know exactly how long each service should take?",
    needsWork: "Jobs run way over time — hard to book accurately",
    okay: "Rough estimates, but not optimized",
    strong: "Exact time standards per service — schedule is tight and predictable",
    painPoint: "Revenue leak",
  },
  quality_control: {
    question: "Is there a final quality check before every car leaves?",
    needsWork: "No formal QC — problems get caught when the customer is unhappy",
    okay: "Owner checks occasionally but no system",
    strong: "Written QC checklist for every job — signed off before delivery",
    painPoint: "Reputation risk",
  },
  customer_communication: {
    question: "Do customers know what's happening with their car in real time?",
    needsWork: "Customers call to check status — communication is reactive",
    okay: "Some updates sent but not consistent",
    strong: "Automated updates at key stages — customers never have to ask",
    painPoint: "Retention gap",
  },
  phone_system: {
    question: "Do you capture every lead that calls or messages you?",
    needsWork: "Missed calls go unanswered — you lose leads every week",
    okay: "Mostly captured but no system for after-hours",
    strong: "Every lead captured with auto-response, CRM logged, and follow-up triggered",
    painPoint: "Revenue leak",
  },
  automations_speed: {
    question: "How fast do you follow up with a new lead?",
    needsWork: "Follow-up is whenever you remember — leads go cold",
    okay: "Usually same day but not automated",
    strong: "Automated follow-up within 5 minutes — leads never go cold",
    painPoint: "Revenue leak",
  },
  tracking_attribution: {
    question: "Do you know which marketing channel brought in each customer?",
    needsWork: "No tracking — spending money with no idea what's working",
    okay: "Ask 'how did you hear about us?' but don't track it properly",
    strong: "Full attribution tracking — every dollar tied to a result",
    painPoint: "Revenue leak",
  },
  sales_scripting: {
    question: "Does your team follow a proven sales process for every inquiry?",
    needsWork: "Each person sells differently — inconsistent close rates",
    okay: "Some talking points but no formal process",
    strong: "Scripted sales process with objection handling — trained and practiced",
    painPoint: "Revenue leak",
  },
  follow_up_sops: {
    question: "Do you follow up with every lead that didn't book?",
    needsWork: "No follow-up — leads either book right away or you lose them",
    okay: "Occasional follow-up but no system",
    strong: "Automated 3-touch follow-up sequence for all unconverted leads",
    painPoint: "Revenue leak",
  },
  estimate_quote: {
    question: "How fast do you get quotes to potential customers?",
    needsWork: "Takes 24+ hours — customers book competitors while waiting",
    okay: "Usually same day but no defined process",
    strong: "Same-hour quoting with professional, branded estimate template",
    painPoint: "Revenue leak",
  },
  review_reputation: {
    question: "Are you actively building your Google review count?",
    needsWork: "Under 20 reviews — hard to win trust against competitors",
    okay: "Getting some reviews but not systematically asking",
    strong: "50+ reviews with automated ask-after-service system",
    painPoint: "Reputation gap",
  },
  rebooking_retention: {
    question: "Do you have a system to bring customers back?",
    needsWork: "No rebooking system — customers only come back if they remember you",
    okay: "Some follow-up but not consistent",
    strong: "Automated rebooking sequences — 60%+ of customers rebook within 90 days",
    painPoint: "Revenue leak",
  },
  google_presence: {
    question: "Is your Google Business Profile fully optimized?",
    needsWork: "Incomplete profile — missing photos, hours, or services",
    okay: "Basic profile set up but not actively managed",
    strong: "Complete, optimized profile with regular posts and 50+ reviews",
    painPoint: "Visibility gap",
  },
  paid_ads: {
    question: "Are you running targeted paid ads to drive new customers?",
    needsWork: "No ads — relying entirely on word of mouth",
    okay: "Running some ads but not tracking ROI",
    strong: "Consistent Google/Meta campaigns with tracked cost-per-lead under $50",
    painPoint: "Growth ceiling",
  },
  website_conversion: {
    question: "Does your website turn visitors into booked appointments?",
    needsWork: "No website or basic page with no booking capability",
    okay: "Website exists but hard to book — visitors drop off",
    strong: "Professional site with online booking — 5%+ visitor-to-lead conversion",
    painPoint: "Revenue leak",
  },
  social_presence: {
    question: "Are you posting consistently on social media?",
    needsWork: "No consistent posting — social pages are inactive",
    okay: "Posting occasionally but no strategy",
    strong: "3-5 posts per week with before/afters, results, and engagement",
    painPoint: "Visibility gap",
  },
  branding_consistency: {
    question: "Is your brand consistent across all platforms?",
    needsWork: "Different logos, colors, or names on different platforms",
    okay: "Mostly consistent but some gaps",
    strong: "Unified brand identity across all touchpoints — instantly recognizable",
    painPoint: "Trust gap",
  },
  content_creation: {
    question: "Are you producing before/after content that showcases your work?",
    needsWork: "Rarely photograph work or post results",
    okay: "Occasionally posting results but not systematically",
    strong: "Every job documented — consistent high-quality content library growing monthly",
    painPoint: "Visibility gap",
  },
  local_seo: {
    question: "Do you rank on Google when someone in your city searches for detailing?",
    needsWork: "Not ranking — invisible to local search",
    okay: "Showing up for some searches but not in top 3",
    strong: "Ranking top 3 for your city's main detailing keywords",
    painPoint: "Visibility gap",
  },
  labor_efficiency: {
    question: "Are your team members producing efficiently during every hour they're paid?",
    needsWork: "Lots of downtime — paying people to stand around",
    okay: "Mostly busy but no tracking",
    strong: "Utilization tracked per tech — 80%+ billable efficiency achieved",
    painPoint: "Revenue leak",
  },
  staffing_coverage: {
    question: "Do you have backup coverage when someone calls out?",
    needsWork: "Owner has to cancel jobs when an employee is absent",
    okay: "Sometimes covered but stressful",
    strong: "Cross-trained team — no job gets cancelled due to a callout",
    painPoint: "Revenue leak",
  },
  team_quality: {
    question: "Does your team consistently deliver the quality level your brand promises?",
    needsWork: "Quality varies too much between team members",
    okay: "Most deliver good quality but not all",
    strong: "Every team member meets the same quality standard — consistent output",
    painPoint: "Reputation risk",
  },
  training_standardization: {
    question: "Is your training documented and repeatable for every new hire?",
    needsWork: "Training is informal — each person learns differently",
    okay: "Some materials exist but not comprehensive",
    strong: "Full training curriculum with videos, checklists, and tests",
    painPoint: "Quality gap",
  },
  onboarding_process: {
    question: "Can a new employee be fully productive within their first 2 weeks?",
    needsWork: "Onboarding is chaotic — new hires take months to perform",
    okay: "Basic orientation but no structured onboarding",
    strong: "30-day onboarding plan — new hires up to full speed by day 14",
    painPoint: "Productivity gap",
  },
  hiring_process: {
    question: "Do you have a defined process for finding and vetting new hires?",
    needsWork: "Hiring is reactive — you take whoever applies when desperate",
    okay: "Some process but inconsistent",
    strong: "Defined job posts, interview questions, and skills test — right hires only",
    painPoint: "Quality gap",
  },
  culture_morale: {
    question: "Would your team say this is a great place to work?",
    needsWork: "High turnover, low morale — people leave within months",
    okay: "Decent culture but no intentional investment",
    strong: "Strong culture with recognition, growth paths, and low turnover",
    painPoint: "Stability risk",
  },
  compensation_structure: {
    question: "Does your pay structure reward performance and incentivize growth?",
    needsWork: "Flat hourly rate only — no performance incentive",
    okay: "Some bonuses but not systematized",
    strong: "Tiered pay with performance bonuses — team is motivated to produce more",
    painPoint: "Performance gap",
  },
};

export function getConsultationDesc(subId: string): ConsultationDesc {
  return (
    CONSULTATION_DESCRIPTIONS[subId] ?? {
      question: "How would you rate this area of your business?",
      needsWork: "Significant gaps — needs immediate attention",
      okay: "Making progress — room for improvement",
      strong: "Operating at a high level — keep it up",
      painPoint: "Gap identified",
    }
  );
}
