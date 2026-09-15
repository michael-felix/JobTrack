/**
 * Curated list of skills/technologies the match-score engine looks for in a
 * job description and résumé. Deliberately a plain array (not an ML model or
 * external API) so scoring stays free, deterministic, and easy to extend —
 * add a term here and every future match-score call picks it up.
 *
 * Multi-word entries (e.g. "machine learning") are matched as phrases; entries
 * are matched case-insensitively against word boundaries.
 */
export const SKILLS_DICTIONARY: string[] = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang", "rust",
  "ruby", "php", "swift", "kotlin", "scala", "sql", "html", "css", "bash", "r",
  // Frontend
  "react", "next.js", "vue", "angular", "svelte", "redux", "tailwind", "webpack",
  "vite", "jquery",
  // Backend / frameworks
  "node.js", "express", "django", "flask", "spring", "spring boot", "rails",
  "fastapi", "graphql", "rest api", "grpc", "microservices",
  // Data / infra
  "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
  "kafka", "rabbitmq", "docker", "kubernetes", "terraform", "ansible",
  "aws", "azure", "gcp", "google cloud", "ci/cd", "jenkins", "github actions",
  // Data science / ML
  "machine learning", "deep learning", "tensorflow", "pytorch", "pandas",
  "numpy", "scikit-learn", "nlp", "data analysis", "data engineering",
  "etl", "airflow", "spark", "hadoop",
  // Practices
  "agile", "scrum", "tdd", "unit testing", "system design", "oop",
  "design patterns", "distributed systems", "api design", "accessibility",
  // Tools
  "git", "github", "gitlab", "jira", "figma", "linux",
];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "our", "are", "will", "your", "have",
  "has", "that", "this", "from", "who", "what", "job", "team", "work", "role",
  "must", "able", "years", "year", "experience", "strong", "skills", "using",
  "into", "such", "can", "not", "all", "any", "but", "was", "were", "been",
  "their", "they", "them", "its", "about", "more", "than", "other", "some",
  "including", "across", "within", "across", "per", "etc", "new", "high",
]);

export function stopwords(): ReadonlySet<string> {
  return STOPWORDS;
}
