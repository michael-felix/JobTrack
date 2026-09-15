// Empty on purpose: this overrides the root project's postcss.config.js so
// Vite doesn't apply the web app's Tailwind pipeline (which Vite otherwise
// discovers by walking up the directory tree) to this unrelated project.
module.exports = {};
