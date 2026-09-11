/**
 * Cloud Deployment IPv4 Enforcer
 * On cloud container platforms like Render, AWS ECS, and Docker,
 * IPv6 addresses are often returned by DNS resolvers even though the container
 * environment has no outbound IPv6 route (causing ENETUNREACH / Connection Timeout).
 *
 * This module forces DNS lookups and Nodemailer resolvers to strictly prioritize
 * and use IPv4, preventing ENETUNREACH errors when connecting to SMTP servers like Gmail.
 */

const dns = require("dns");

function enforceIpv4() {
  try {
    if (typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }

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
