/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "@prisma/client"],
  // The Dockerfile runs a real `next build` on every container start (see
  // Dockerfile's CMD), and Next.js sizes its page-data-collection /
  // static-generation worker pool off the HOST machine's CPU count, not the
  // container's actual cgroup limit. On Railway that host count (38, seen in
  // build logs) is wildly more than this small container can spawn threads
  // for, causing an intermittent `OS can't spawn worker thread: Resource
  // temporarily unavailable` crash during build. Capping it low avoids the
  // over-detection instead of relying on the container happening to have
  // enough headroom.
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
