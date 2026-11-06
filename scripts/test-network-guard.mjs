/**
 * Outbound Network Enforcement Guard for Test Harness & Spawned Processes (P1)
 *
 * Enforces strict network isolation:
 * - Only exact loopback PostgreSQL port and owned HTTP origins (admin, web, synthetic provider)
 *   are permitted.
 * - Any other destination (external host, non-whitelisted port, deceptive domain) is blocked
 *   BEFORE DNS resolution / TCP connect.
 * - Records sanitized origin/port/count metrics without leaking tokens, cookies, or queries.
 */

import net from 'node:net';

const allowedPorts = new Set();
const allowedHosts = new Set(['127.0.0.1', 'localhost']);

const allowedInventory = new Map();
const blockedInventory = [];

let guardInstalled = false;
const originalSocketConnect = net.Socket.prototype.connect;
const originalFetch = globalThis.fetch;

function parseAllowedPortsFromEnv() {
  const envPorts = process.env.TEST_ALLOWED_PORTS;
  if (envPorts) {
    for (const p of envPorts.split(',')) {
      const trimmed = p.trim();
      if (trimmed) {
        const num = Number(trimmed);
        if (Number.isFinite(num) && num > 0) {
          allowedPorts.add(num);
        }
      }
    }
  }
}

parseAllowedPortsFromEnv();

export function addAllowedPort(port) {
  if (typeof port === 'number' && Number.isFinite(port) && port > 0) {
    allowedPorts.add(port);
  }
}

export function addAllowedHost(host) {
  if (typeof host === 'string' && host.trim()) {
    allowedHosts.add(host.trim().toLowerCase());
  }
}

export function installNetworkGuard(options = {}) {
  if (guardInstalled) {
    if (options.allowedPorts) {
      for (const p of options.allowedPorts) addAllowedPort(p);
    }
    return;
  }
  guardInstalled = true;

  if (options.allowedPorts) {
    for (const p of options.allowedPorts) addAllowedPort(p);
  }

  // 1. Intercept net.Socket.prototype.connect
  net.Socket.prototype.connect = function (...args) {
    let targetHost = 'localhost';
    let targetPort = null;
    let isIpc = false;

    if (typeof args[0] === 'object' && args[0] !== null) {
      if (args[0].path) {
        isIpc = true;
      } else {
        targetHost = (args[0].host || 'localhost').toLowerCase();
        targetPort = Number(args[0].port);
      }
    } else if (typeof args[0] === 'number') {
      targetPort = Number(args[0]);
      if (typeof args[1] === 'string') {
        targetHost = args[1].toLowerCase();
      }
    } else if (typeof args[0] === 'string' && !/^\d+$/.test(args[0])) {
      isIpc = true;
    }

    if (!isIpc) {
      const isLoopbackHost = allowedHosts.has(targetHost);
      const isAllowedPort = targetPort !== null && allowedPorts.has(targetPort);

      if (!isLoopbackHost || !isAllowedPort) {
        const errorMsg = `BLOCKED_OUTBOUND: Connection to ${targetHost}:${targetPort} is forbidden by test network guard`;
        blockedInventory.push({
          type: 'socket',
          destination: `${targetHost}:${targetPort}`,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        });

        const blockedError = new Error(errorMsg);
        blockedError.code = 'ERR_BLOCKED_OUTBOUND';

        // Fail closed immediately before DNS / connect
        process.nextTick(() => {
          this.destroy(blockedError);
        });
        return this;
      }

      // Record allowed connection
      const destKey = `${targetHost}:${targetPort}`;
      allowedInventory.set(destKey, (allowedInventory.get(destKey) || 0) + 1);
    }

    return originalSocketConnect.apply(this, args);
  };

  // 2. Intercept globalThis.fetch
  if (typeof originalFetch === 'function') {
    globalThis.fetch = async function (input, init) {
      let parsedUrl;
      try {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        parsedUrl = new URL(urlStr);
      } catch {
        // let native fetch handle malformed URL
        return originalFetch.apply(this, arguments);
      }

      const host = parsedUrl.hostname.toLowerCase();
      const port = Number(parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80));

      const isLoopbackHost = allowedHosts.has(host);
      const isAllowedPort = allowedPorts.has(port);

      if (!isLoopbackHost || !isAllowedPort) {
        const errorMsg = `BLOCKED_OUTBOUND: Fetch to ${parsedUrl.protocol}//${host}:${port} is forbidden by test network guard`;
        blockedInventory.push({
          type: 'fetch',
          method: init?.method || 'GET',
          destination: `${host}:${port}`,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        });

        const blockedError = new TypeError(errorMsg);
        blockedError.code = 'ERR_BLOCKED_OUTBOUND';
        throw blockedError;
      }

      const destKey = `${parsedUrl.protocol}//${host}:${port}`;
      allowedInventory.set(destKey, (allowedInventory.get(destKey) || 0) + 1);

      return originalFetch.apply(this, arguments);
    };
  }
}

export function getNetworkGuardSummary() {
  return {
    allowedCount: [...allowedInventory.values()].reduce((sum, c) => sum + c, 0),
    allowedDestinations: Object.fromEntries(allowedInventory),
    blockedCount: blockedInventory.length,
    blockedDestinations: [...blockedInventory],
  };
}

export function resetNetworkGuardInventory() {
  allowedInventory.clear();
  blockedInventory.length = 0;
}

export function assertNoForbiddenOutbound() {
  if (blockedInventory.length > 0) {
    throw new Error(
      `Forbidden outbound connections detected: ${JSON.stringify(blockedInventory)}`
    );
  }
}

// Auto-install if flag present
if (process.env.LINGORA_TEST_NETWORK_GUARD === '1') {
  installNetworkGuard();
}
