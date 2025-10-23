import NodeCache from 'node-cache';

// In-memory cache with 5 minutes default TTL
const cache = new NodeCache({ stdTTL: 300 });

export { cache };
