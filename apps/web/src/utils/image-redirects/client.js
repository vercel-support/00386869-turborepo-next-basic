// This is a .js file because its imported into the next.config.js file

import { createClient } from '@vercel/edge-config';

let imageRedirectsEdgeConfigClient = null;

export const getImageRedirectsEdgeConfigClient = () => {
  if (!imageRedirectsEdgeConfigClient) {
    if (!process.env.EDGE_CONFIG) {
      throw new Error('EDGE_CONFIG is not defined in environment variables.');
    }
    imageRedirectsEdgeConfigClient = createClient(process.env.EDGE_CONFIG);
  }
  return imageRedirectsEdgeConfigClient;
};