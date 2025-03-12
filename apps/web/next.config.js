/** @type {import('next').NextConfig} */

// Convert to CommonJS format
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
      // Dynamically import the client to avoid issues during build time
      const { getImageRedirectsEdgeConfigClient } = await import('./src/utils/image-redirects/client.js');
      
      // Initialize the Edge Config client with better error handling
      let redirectsEdgeConfigClient;
      try {
        redirectsEdgeConfigClient = getImageRedirectsEdgeConfigClient();
      } catch (clientError) {
        console.error('Failed to initialize Edge Config client:', clientError);
        return { beforeFiles: [] };
      }

      // Fetch the list of image redirects with timeout and fallback
      let redirects = [];
      try {
        // Add timeout to prevent hanging during build
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Edge Config fetch timeout')), 5000)
        );
        
        redirects = await Promise.race([
          redirectsEdgeConfigClient.get('imageRedirects'),
          timeoutPromise
        ]);
      } catch (fetchError) {
        console.error('Failed to fetch imageRedirects:', fetchError);
        return { beforeFiles: [] };
      }

      // Ensure redirects is an array
      if (!Array.isArray(redirects)) {
        console.error('imageRedirects is not an array:', redirects);
        return { beforeFiles: [] };
      }

      return {
        beforeFiles: redirects
          .map(({ sourcePath, targetLocation }) => {
            // Skip invalid entries
            if (!sourcePath || !targetLocation) {
              console.error('Invalid imageRedirects entry:', { sourcePath, targetLocation });
              return null;
            }

            try {
              // Extract the query parameters from the sourcePath
              const urlParts = sourcePath.split('?');
              if (urlParts.length < 2) {
                console.error('Invalid sourcePath format:', sourcePath);
                return null;
              }
              
              const urlParams = new URLSearchParams(urlParts[1]);
              const encodedUrl = urlParams.get('url');

              if (!encodedUrl) {
                console.error('Missing url parameter in sourcePath:', sourcePath);
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
            } catch (parseError) {
              console.error('Error parsing redirect:', parseError, { sourcePath, targetLocation });
              return null;
            }
          })
          .filter(Boolean), // Remove null values
      };
    } catch (error) {
      console.error('Unexpected error in rewrites config:', error);
      // Return empty rewrites to prevent build failure
      return { beforeFiles: [] };
    }
  },

  images: {
    remotePatterns: ['**.cms.optimizely.com'].map((pattern) => ({
      protocol: 'https',
      port: '',
      hostname: pattern,
    })),
  },

  reactStrictMode: true,

  trailingSlash: true,

  transpilePackages: ['@ring/ui', '@ring/atoms'],

  typescript: {
    ignoreBuildErrors: true,
  },
};

// Export using CommonJS format
export default nextConfig;