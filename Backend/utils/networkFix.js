/**
 * Cloud Deployment IPv4 Enforcer
 * On cloud container platforms like Render, AWS ECS, and Docker,
 * IPv6 addresses are often returned by DNS resolvers even though the container
 * environment has no outbound IPv6 route (causing ENETUNREACH / Connection Timeout).
 *
 * This module forces DNS lookups, OS interface detection, and Nodemailer resolvers
 * to strictly prioritize and use IPv4, preventing ENETUNREACH and timeouts when
 * connecting to SMTP servers like Gmail.
 */

const dns = require("dns");
const os = require("os");

function enforceIpv4() {
  try {
    // 1. Filter out IPv6 addresses from os.networkInterfaces
    // Nodemailer's internal shared library checks isFamilySupported() using os.networkInterfaces().
    // If IPv6 is reported present (e.g. ::1 loopback), it resolves both IPv4 and IPv6 and randomly picks one.
    // Stripping IPv6 forces Nodemailer to strictly recognize IPv4 as the only supported network family.
    const origNetInterfaces = os.networkInterfaces;
    if (typeof origNetInterfaces === "function") {
      os.networkInterfaces = function () {
        const ifaces = origNetInterfaces.apply(this, arguments);
        const filtered = {};
        for (const [name, list] of Object.entries(ifaces || {})) {
          filtered[name] = (list || []).filter(
            (item) => item && (item.family === 4 || item.family === "IPv4")
          );
        }
        return filtered;
      };
    }

    // 2. Default result order: IPv4 first
    if (typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }

    // 3. Filter out IPv6 from dns.lookup
    const origLookup = dns.lookup;
    if (typeof origLookup === "function") {
      dns.lookup = function (hostname, options, callback) {
        const cb = typeof options === "function" ? options : callback;
        const opts = typeof options === "object" ? options : {};

        return origLookup.call(dns, hostname, { ...opts, family: 4 }, (err, address, family) => {
          if (err) return cb(err);
          if (opts && opts.all) {
            const addresses = Array.isArray(address)
              ? address
              : [{ address, family: 4 }];
            const v4Only = addresses.filter(
              (a) => a && (a.family === 4 || a.family === "IPv4")
            );
            return cb(null, v4Only.length ? v4Only : addresses);
          }
          return cb(null, address, family);
        });
      };
    }

    // 4. Return NOTFOUND for resolve6 to prevent IPv6 queries
    const notFoundHandler = (hostname, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      const err = Object.assign(new Error(`queryAaaa ENOTFOUND ${hostname}`), {
        code: dns.NOTFOUND || "ENOTFOUND",
      });
      if (typeof cb === "function") cb(err, []);
    };

    const notFoundPromiseHandler = async (hostname) => {
      const err = Object.assign(new Error(`queryAaaa ENOTFOUND ${hostname}`), {
        code: dns.NOTFOUND || "ENOTFOUND",
      });
      throw err;
    };

    dns.resolve6 = notFoundHandler;

    if (dns.Resolver && dns.Resolver.prototype) {
      dns.Resolver.prototype.resolve6 = notFoundHandler;
    }

    if (dns.promises) {
      dns.promises.resolve6 = notFoundPromiseHandler;
      if (dns.promises.Resolver && dns.promises.Resolver.prototype) {
        dns.promises.Resolver.prototype.resolve6 = notFoundPromiseHandler;
      }
    }
  } catch (err) {
    console.warn("[NETWORK WARNING] Failed to enforce IPv4 DNS order:", err.message);
  }
}

enforceIpv4();

module.exports = { enforceIpv4 };
