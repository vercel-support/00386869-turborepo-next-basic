/** @type {import('next').NextConfig} */
import { getImageRedirectsEdgeConfigClient } from './src/utils/image-redirects/client.js';

const nextConfig = {
  cleanDistDir: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    // esmExternals: 'loose',
  },

  async headers() {
    return [
      {
        source: '/(.*)?', // Matches all pages
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          // to allow Live Preview in Contentstack
          // {
          // 	key: 'Content-Security-Policy',
          // 	value: 'frame-ancestors https://app.contentstack.com/;',
          // },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000;',
          },
        ],
      },
    ];
  },

  async rewrites() {
    try {
      // Initialize the Edge Config client to fetch image redirects
      const redirectsEdgeConfigClient = getImageRedirectsEdgeConfigClient();

      // Fetch the list of image redirects from Edge Config
      const redirects = await redirectsEdgeConfigClient.get('imageRedirects');

      return {
        beforeFiles: redirects
          .map(({ sourcePath, targetLocation }) => {
            // Extract the query parameters from the sourcePath
            const urlParams = new URLSearchParams(sourcePath.split('?')[1]);
            const encodedUrl = urlParams.get('url') ?? null;

            if (!encodedUrl || !targetLocation) {
              console.error('Invalid imageRedirects entry:, ', { sourcePath, targetLocation });
              return null;
            }

            return {
              source: '/_next/image', // Match Next.js image optimization path
              has: [
                {
                  type: 'query',
                  key: 'url',
                  value: encodedUrl,
                },
              ],
              destination: targetLocation,
            };
          })
          .filter(Boolean), // Remove null values
      };
    } catch (error) {
      console.error('Failed to fetch imageRedirects:', error);
      return { beforeFiles: [] };
    }
  },

  images: {
    remotePatterns: ['**.cms.optimizely.com'].map((pattern) => ({
      protocol: 'https',
      port: '',
      hostname: pattern,
    })),

    // Enable this if we want the images to not be downloaded automaticaly when "Open Image in New Tab"
    // https://nextjs.org/docs/pages/api-reference/components/image#contentdispositiontype
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
    // contentDispositionType: 'inline',
  },

  reactStrictMode: true,

  trailingSlash: true,

  transpilePackages: ['@ring/ui', '@ring/atoms'],

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;