var Ws = Object.defineProperty;
var Ds = (r, e, t) => e in r ? Ws(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var xt = (r, e, t) => (Ds(r, typeof e != "symbol" ? e + "" : e, t), t);
var Fe = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function si(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
function Us(r) {
  if (r.__esModule)
    return r;
  var e = r.default;
  if (typeof e == "function") {
    var t = function n() {
      if (this instanceof n) {
        var i = [null];
        i.push.apply(i, arguments);
        var s = Function.bind.apply(e, i);
        return new s();
      }
      return e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else
    t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(r).forEach(function(n) {
    var i = Object.getOwnPropertyDescriptor(r, n);
    Object.defineProperty(t, n, i.get ? i : {
      enumerable: !0,
      get: function() {
        return r[n];
      }
    });
  }), t;
}
const Js = {}, Vs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Js
}, Symbol.toStringTag, { value: "Module" })), E = /* @__PURE__ */ Us(Vs);
var Ut = { exports: {} }, Pt, qr;
function Gs() {
  if (qr)
    return Pt;
  qr = 1;
  var r = 1e3, e = r * 60, t = e * 60, n = t * 24, i = n * 7, s = n * 365.25;
  Pt = function(l, h) {
    h = h || {};
    var d = typeof l;
    if (d === "string" && l.length > 0)
      return o(l);
    if (d === "number" && isFinite(l))
      return h.long ? u(l) : a(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function o(l) {
    if (l = String(l), !(l.length > 100)) {
      var h = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (h) {
        var d = parseFloat(h[1]), _ = (h[2] || "ms").toLowerCase();
        switch (_) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return d * s;
          case "weeks":
          case "week":
          case "w":
            return d * i;
          case "days":
          case "day":
          case "d":
            return d * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return d * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return d * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return d * r;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return d;
          default:
            return;
        }
      }
    }
  }
  function a(l) {
    var h = Math.abs(l);
    return h >= n ? Math.round(l / n) + "d" : h >= t ? Math.round(l / t) + "h" : h >= e ? Math.round(l / e) + "m" : h >= r ? Math.round(l / r) + "s" : l + "ms";
  }
  function u(l) {
    var h = Math.abs(l);
    return h >= n ? c(l, h, n, "day") : h >= t ? c(l, h, t, "hour") : h >= e ? c(l, h, e, "minute") : h >= r ? c(l, h, r, "second") : l + " ms";
  }
  function c(l, h, d, _) {
    var m = h >= d * 1.5;
    return Math.round(l / d) + " " + _ + (m ? "s" : "");
  }
  return Pt;
}
function Ks(r) {
  t.debug = t, t.default = t, t.coerce = u, t.disable = s, t.enable = i, t.enabled = o, t.humanize = Gs(), t.destroy = c, Object.keys(r).forEach((l) => {
    t[l] = r[l];
  }), t.names = [], t.skips = [], t.formatters = {};
  function e(l) {
    let h = 0;
    for (let d = 0; d < l.length; d++)
      h = (h << 5) - h + l.charCodeAt(d), h |= 0;
    return t.colors[Math.abs(h) % t.colors.length];
  }
  t.selectColor = e;
  function t(l) {
    let h, d = null, _, m;
    function g(...b) {
      if (!g.enabled)
        return;
      const v = g, x = Number(/* @__PURE__ */ new Date()), ie = x - (h || x);
      v.diff = ie, v.prev = h, v.curr = x, h = x, b[0] = t.coerce(b[0]), typeof b[0] != "string" && b.unshift("%O");
      let M = 0;
      b[0] = b[0].replace(/%([a-zA-Z%])/g, (It, Hs) => {
        if (It === "%%")
          return "%";
        M++;
        const Br = t.formatters[Hs];
        if (typeof Br == "function") {
          const Qs = b[M];
          It = Br.call(v, Qs), b.splice(M, 1), M--;
        }
        return It;
      }), t.formatArgs.call(v, b), (v.log || t.log).apply(v, b);
    }
    return g.namespace = l, g.useColors = t.useColors(), g.color = t.selectColor(l), g.extend = n, g.destroy = t.destroy, Object.defineProperty(g, "enabled", {
      enumerable: !0,
      configurable: !1,
      get: () => d !== null ? d : (_ !== t.namespaces && (_ = t.namespaces, m = t.enabled(l)), m),
      set: (b) => {
        d = b;
      }
    }), typeof t.init == "function" && t.init(g), g;
  }
  function n(l, h) {
    const d = t(this.namespace + (typeof h > "u" ? ":" : h) + l);
    return d.log = this.log, d;
  }
  function i(l) {
    t.save(l), t.namespaces = l, t.names = [], t.skips = [];
    let h;
    const d = (typeof l == "string" ? l : "").split(/[\s,]+/), _ = d.length;
    for (h = 0; h < _; h++)
      d[h] && (l = d[h].replace(/\*/g, ".*?"), l[0] === "-" ? t.skips.push(new RegExp("^" + l.slice(1) + "$")) : t.names.push(new RegExp("^" + l + "$")));
  }
  function s() {
    const l = [
      ...t.names.map(a),
      ...t.skips.map(a).map((h) => "-" + h)
    ].join(",");
    return t.enable(""), l;
  }
  function o(l) {
    if (l[l.length - 1] === "*")
      return !0;
    let h, d;
    for (h = 0, d = t.skips.length; h < d; h++)
      if (t.skips[h].test(l))
        return !1;
    for (h = 0, d = t.names.length; h < d; h++)
      if (t.names[h].test(l))
        return !0;
    return !1;
  }
  function a(l) {
    return l.toString().substring(2, l.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function u(l) {
    return l instanceof Error ? l.stack || l.message : l;
  }
  function c() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  return t.enable(t.load()), t;
}
var zs = Ks;
(function(r, e) {
  e.formatArgs = n, e.save = i, e.load = s, e.useColors = t, e.storage = o(), e.destroy = (() => {
    let u = !1;
    return () => {
      u || (u = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
    };
  })(), e.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function t() {
    return typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs) ? !0 : typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/) ? !1 : typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
    typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
    typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function n(u) {
    if (u[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + u[0] + (this.useColors ? "%c " : " ") + "+" + r.exports.humanize(this.diff), !this.useColors)
      return;
    const c = "color: " + this.color;
    u.splice(1, 0, c, "color: inherit");
    let l = 0, h = 0;
    u[0].replace(/%[a-zA-Z%]/g, (d) => {
      d !== "%%" && (l++, d === "%c" && (h = l));
    }), u.splice(h, 0, c);
  }
  e.log = console.debug || console.log || (() => {
  });
  function i(u) {
    try {
      u ? e.storage.setItem("debug", u) : e.storage.removeItem("debug");
    } catch {
    }
  }
  function s() {
    let u;
    try {
      u = e.storage.getItem("debug");
    } catch {
    }
    return !u && typeof process < "u" && "env" in process && (u = process.env.DEBUG), u;
  }
  function o() {
    try {
      return localStorage;
    } catch {
    }
  }
  r.exports = zs(e);
  const { formatters: a } = r.exports;
  a.j = function(u) {
    try {
      return JSON.stringify(u);
    } catch (c) {
      return "[UnexpectedJSONParseError]: " + c.message;
    }
  };
})(Ut, Ut.exports);
var he = Ut.exports, Ys = typeof Fe == "object" && Fe && Fe.Object === Object && Fe, oi = Ys, Xs = oi, Zs = typeof self == "object" && self && self.Object === Object && self, eo = Xs || Zs || Function("return this")(), B = eo, to = B, ro = to.Symbol, z = ro;
function no(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length, i = Array(n); ++t < n; )
    i[t] = e(r[t], t, r);
  return i;
}
var it = no, io = Array.isArray, A = io, kr = z, ai = Object.prototype, so = ai.hasOwnProperty, oo = ai.toString, Te = kr ? kr.toStringTag : void 0;
function ao(r) {
  var e = so.call(r, Te), t = r[Te];
  try {
    r[Te] = void 0;
    var n = !0;
  } catch {
  }
  var i = oo.call(r);
  return n && (e ? r[Te] = t : delete r[Te]), i;
}
var uo = ao, lo = Object.prototype, co = lo.toString;
function ho(r) {
  return co.call(r);
}
var fo = ho, Rr = z, po = uo, go = fo, yo = "[object Null]", mo = "[object Undefined]", Mr = Rr ? Rr.toStringTag : void 0;
function bo(r) {
  return r == null ? r === void 0 ? mo : yo : Mr && Mr in Object(r) ? po(r) : go(r);
}
var Y = bo;
function _o(r) {
  return r != null && typeof r == "object";
}
var q = _o, wo = Y, vo = q, $o = "[object Symbol]";
function Co(r) {
  return typeof r == "symbol" || vo(r) && wo(r) == $o;
}
var st = Co, Lr = z, To = it, Oo = A, Ao = st, Eo = 1 / 0, Fr = Lr ? Lr.prototype : void 0, Hr = Fr ? Fr.toString : void 0;
function ui(r) {
  if (typeof r == "string")
    return r;
  if (Oo(r))
    return To(r, ui) + "";
  if (Ao(r))
    return Hr ? Hr.call(r) : "";
  var e = r + "";
  return e == "0" && 1 / r == -Eo ? "-0" : e;
}
var So = ui, Io = So;
function xo(r) {
  return r == null ? "" : Io(r);
}
var li = xo, Po = li, No = 0;
function jo(r) {
  var e = ++No;
  return Po(r) + e;
}
var ci = jo, nr = function() {
};
let Bo = class {
  constructor(e) {
    this.client = e;
  }
  now(e) {
    return typeof e == "number" ? this.client.raw(`CURRENT_TIMESTAMP(${e})`) : this.client.raw("CURRENT_TIMESTAMP");
  }
  uuidToBin(e, t = !0) {
    const n = Buffer.from(e.replace(/-/g, ""), "hex");
    return t ? Buffer.concat([
      n.slice(6, 8),
      n.slice(4, 6),
      n.slice(0, 4),
      n.slice(8, 16)
    ]) : Buffer.concat([
      n.slice(0, 4),
      n.slice(4, 6),
      n.slice(6, 8),
      n.slice(8, 16)
    ]);
  }
  binToUuid(e, t = !0) {
    const n = Buffer.from(e, "hex");
    return t ? [
      n.toString("hex", 4, 8),
      n.toString("hex", 2, 4),
      n.toString("hex", 0, 2),
      n.toString("hex", 8, 10),
      n.toString("hex", 10, 16)
    ].join("-") : [
      n.toString("hex", 0, 4),
      n.toString("hex", 4, 6),
      n.toString("hex", 6, 8),
      n.toString("hex", 8, 10),
      n.toString("hex", 10, 16)
    ].join("-");
  }
};
var qo = Bo, ko = [
  "with",
  "withRecursive",
  "withMaterialized",
  "withNotMaterialized",
  "select",
  "as",
  "columns",
  "column",
  "from",
  "fromJS",
  "fromRaw",
  "into",
  "withSchema",
  "table",
  "distinct",
  "join",
  "joinRaw",
  "innerJoin",
  "leftJoin",
  "leftOuterJoin",
  "rightJoin",
  "rightOuterJoin",
  "outerJoin",
  "fullOuterJoin",
  "crossJoin",
  "where",
  "andWhere",
  "orWhere",
  "whereNot",
  "orWhereNot",
  "whereLike",
  "andWhereLike",
  "orWhereLike",
  "whereILike",
  "andWhereILike",
  "orWhereILike",
  "whereRaw",
  "whereWrapped",
  "havingWrapped",
  "orWhereRaw",
  "whereExists",
  "orWhereExists",
  "whereNotExists",
  "orWhereNotExists",
  "whereIn",
  "orWhereIn",
  "whereNotIn",
  "orWhereNotIn",
  "whereNull",
  "orWhereNull",
  "whereNotNull",
  "orWhereNotNull",
  "whereBetween",
  "whereNotBetween",
  "andWhereBetween",
  "andWhereNotBetween",
  "orWhereBetween",
  "orWhereNotBetween",
  "groupBy",
  "groupByRaw",
  "orderBy",
  "orderByRaw",
  "union",
  "unionAll",
  "intersect",
  "having",
  "havingRaw",
  "orHaving",
  "orHavingRaw",
  "offset",
  "limit",
  "count",
  "countDistinct",
  "min",
  "max",
  "sum",
  "sumDistinct",
  "avg",
  "avgDistinct",
  "increment",
  "decrement",
  "first",
  "debug",
  "pluck",
  "clearSelect",
  "clearWhere",
  "clearGroup",
  "clearOrder",
  "clearHaving",
  "insert",
  "update",
  "returning",
  "del",
  "delete",
  "truncate",
  "transacting",
  "connection",
  // JSON methods
  // Json manipulation functions
  "jsonExtract",
  "jsonSet",
  "jsonInsert",
  "jsonRemove",
  // Wheres Json
  "whereJsonObject",
  "orWhereJsonObject",
  "andWhereJsonObject",
  "whereNotJsonObject",
  "orWhereNotJsonObject",
  "andWhereNotJsonObject",
  "whereJsonPath",
  "orWhereJsonPath",
  "andWhereJsonPath",
  "whereJsonSupersetOf",
  "orWhereJsonSupersetOf",
  "andWhereJsonSupersetOf",
  "whereJsonNotSupersetOf",
  "orWhereJsonNotSupersetOf",
  "andWhereJsonNotSupersetOf",
  "whereJsonSubsetOf",
  "orWhereJsonSubsetOf",
  "andWhereJsonSubsetOf",
  "whereJsonNotSubsetOf",
  "orWhereJsonNotSubsetOf",
  "andWhereJsonNotSubsetOf"
];
function Ro() {
  this.__data__ = [], this.size = 0;
}
var Mo = Ro;
function Lo(r, e) {
  return r === e || r !== r && e !== e;
}
var de = Lo, Fo = de;
function Ho(r, e) {
  for (var t = r.length; t--; )
    if (Fo(r[t][0], e))
      return t;
  return -1;
}
var ot = Ho, Qo = ot, Wo = Array.prototype, Do = Wo.splice;
function Uo(r) {
  var e = this.__data__, t = Qo(e, r);
  if (t < 0)
    return !1;
  var n = e.length - 1;
  return t == n ? e.pop() : Do.call(e, t, 1), --this.size, !0;
}
var Jo = Uo, Vo = ot;
function Go(r) {
  var e = this.__data__, t = Vo(e, r);
  return t < 0 ? void 0 : e[t][1];
}
var Ko = Go, zo = ot;
function Yo(r) {
  return zo(this.__data__, r) > -1;
}
var Xo = Yo, Zo = ot;
function ea(r, e) {
  var t = this.__data__, n = Zo(t, r);
  return n < 0 ? (++this.size, t.push([r, e])) : t[n][1] = e, this;
}
var ta = ea, ra = Mo, na = Jo, ia = Ko, sa = Xo, oa = ta;
function fe(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var n = r[e];
    this.set(n[0], n[1]);
  }
}
fe.prototype.clear = ra;
fe.prototype.delete = na;
fe.prototype.get = ia;
fe.prototype.has = sa;
fe.prototype.set = oa;
var at = fe, aa = at;
function ua() {
  this.__data__ = new aa(), this.size = 0;
}
var la = ua;
function ca(r) {
  var e = this.__data__, t = e.delete(r);
  return this.size = e.size, t;
}
var ha = ca;
function da(r) {
  return this.__data__.get(r);
}
var fa = da;
function pa(r) {
  return this.__data__.has(r);
}
var ga = pa;
function ya(r) {
  var e = typeof r;
  return r != null && (e == "object" || e == "function");
}
var P = ya, ma = Y, ba = P, _a = "[object AsyncFunction]", wa = "[object Function]", va = "[object GeneratorFunction]", $a = "[object Proxy]";
function Ca(r) {
  if (!ba(r))
    return !1;
  var e = ma(r);
  return e == wa || e == va || e == _a || e == $a;
}
var ut = Ca, Ta = B, Oa = Ta["__core-js_shared__"], Aa = Oa, Nt = Aa, Qr = function() {
  var r = /[^.]+$/.exec(Nt && Nt.keys && Nt.keys.IE_PROTO || "");
  return r ? "Symbol(src)_1." + r : "";
}();
function Ea(r) {
  return !!Qr && Qr in r;
}
var Sa = Ea, Ia = Function.prototype, xa = Ia.toString;
function Pa(r) {
  if (r != null) {
    try {
      return xa.call(r);
    } catch {
    }
    try {
      return r + "";
    } catch {
    }
  }
  return "";
}
var hi = Pa, Na = ut, ja = Sa, Ba = P, qa = hi, ka = /[\\^$.*+?()[\]{}|]/g, Ra = /^\[object .+?Constructor\]$/, Ma = Function.prototype, La = Object.prototype, Fa = Ma.toString, Ha = La.hasOwnProperty, Qa = RegExp(
  "^" + Fa.call(Ha).replace(ka, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function Wa(r) {
  if (!Ba(r) || ja(r))
    return !1;
  var e = Na(r) ? Qa : Ra;
  return e.test(qa(r));
}
var Da = Wa;
function Ua(r, e) {
  return r == null ? void 0 : r[e];
}
var Ja = Ua, Va = Da, Ga = Ja;
function Ka(r, e) {
  var t = Ga(r, e);
  return Va(t) ? t : void 0;
}
var X = Ka, za = X, Ya = B, Xa = za(Ya, "Map"), ir = Xa, Za = X, eu = Za(Object, "create"), lt = eu, Wr = lt;
function tu() {
  this.__data__ = Wr ? Wr(null) : {}, this.size = 0;
}
var ru = tu;
function nu(r) {
  var e = this.has(r) && delete this.__data__[r];
  return this.size -= e ? 1 : 0, e;
}
var iu = nu, su = lt, ou = "__lodash_hash_undefined__", au = Object.prototype, uu = au.hasOwnProperty;
function lu(r) {
  var e = this.__data__;
  if (su) {
    var t = e[r];
    return t === ou ? void 0 : t;
  }
  return uu.call(e, r) ? e[r] : void 0;
}
var cu = lu, hu = lt, du = Object.prototype, fu = du.hasOwnProperty;
function pu(r) {
  var e = this.__data__;
  return hu ? e[r] !== void 0 : fu.call(e, r);
}
var gu = pu, yu = lt, mu = "__lodash_hash_undefined__";
function bu(r, e) {
  var t = this.__data__;
  return this.size += this.has(r) ? 0 : 1, t[r] = yu && e === void 0 ? mu : e, this;
}
var _u = bu, wu = ru, vu = iu, $u = cu, Cu = gu, Tu = _u;
function pe(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var n = r[e];
    this.set(n[0], n[1]);
  }
}
pe.prototype.clear = wu;
pe.prototype.delete = vu;
pe.prototype.get = $u;
pe.prototype.has = Cu;
pe.prototype.set = Tu;
var Ou = pe, Dr = Ou, Au = at, Eu = ir;
function Su() {
  this.size = 0, this.__data__ = {
    hash: new Dr(),
    map: new (Eu || Au)(),
    string: new Dr()
  };
}
var Iu = Su;
function xu(r) {
  var e = typeof r;
  return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? r !== "__proto__" : r === null;
}
var Pu = xu, Nu = Pu;
function ju(r, e) {
  var t = r.__data__;
  return Nu(e) ? t[typeof e == "string" ? "string" : "hash"] : t.map;
}
var ct = ju, Bu = ct;
function qu(r) {
  var e = Bu(this, r).delete(r);
  return this.size -= e ? 1 : 0, e;
}
var ku = qu, Ru = ct;
function Mu(r) {
  return Ru(this, r).get(r);
}
var Lu = Mu, Fu = ct;
function Hu(r) {
  return Fu(this, r).has(r);
}
var Qu = Hu, Wu = ct;
function Du(r, e) {
  var t = Wu(this, r), n = t.size;
  return t.set(r, e), this.size += t.size == n ? 0 : 1, this;
}
var Uu = Du, Ju = Iu, Vu = ku, Gu = Lu, Ku = Qu, zu = Uu;
function ge(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var n = r[e];
    this.set(n[0], n[1]);
  }
}
ge.prototype.clear = Ju;
ge.prototype.delete = Vu;
ge.prototype.get = Gu;
ge.prototype.has = Ku;
ge.prototype.set = zu;
var sr = ge, Yu = at, Xu = ir, Zu = sr, el = 200;
function tl(r, e) {
  var t = this.__data__;
  if (t instanceof Yu) {
    var n = t.__data__;
    if (!Xu || n.length < el - 1)
      return n.push([r, e]), this.size = ++t.size, this;
    t = this.__data__ = new Zu(n);
  }
  return t.set(r, e), this.size = t.size, this;
}
var rl = tl, nl = at, il = la, sl = ha, ol = fa, al = ga, ul = rl;
function ye(r) {
  var e = this.__data__ = new nl(r);
  this.size = e.size;
}
ye.prototype.clear = il;
ye.prototype.delete = sl;
ye.prototype.get = ol;
ye.prototype.has = al;
ye.prototype.set = ul;
var ht = ye, ll = X, cl = function() {
  try {
    var r = ll(Object, "defineProperty");
    return r({}, "", {}), r;
  } catch {
  }
}(), di = cl, Ur = di;
function hl(r, e, t) {
  e == "__proto__" && Ur ? Ur(r, e, {
    configurable: !0,
    enumerable: !0,
    value: t,
    writable: !0
  }) : r[e] = t;
}
var dt = hl, dl = dt, fl = de;
function pl(r, e, t) {
  (t !== void 0 && !fl(r[e], t) || t === void 0 && !(e in r)) && dl(r, e, t);
}
var fi = pl;
function gl(r) {
  return function(e, t, n) {
    for (var i = -1, s = Object(e), o = n(e), a = o.length; a--; ) {
      var u = o[r ? a : ++i];
      if (t(s[u], u, s) === !1)
        break;
    }
    return e;
  };
}
var yl = gl, ml = yl, bl = ml(), pi = bl, Xe = { exports: {} };
Xe.exports;
(function(r, e) {
  var t = B, n = e && !e.nodeType && e, i = n && !0 && r && !r.nodeType && r, s = i && i.exports === n, o = s ? t.Buffer : void 0, a = o ? o.allocUnsafe : void 0;
  function u(c, l) {
    if (l)
      return c.slice();
    var h = c.length, d = a ? a(h) : new c.constructor(h);
    return c.copy(d), d;
  }
  r.exports = u;
})(Xe, Xe.exports);
var gi = Xe.exports, _l = B, wl = _l.Uint8Array, yi = wl, Jr = yi;
function vl(r) {
  var e = new r.constructor(r.byteLength);
  return new Jr(e).set(new Jr(r)), e;
}
var or = vl, $l = or;
function Cl(r, e) {
  var t = e ? $l(r.buffer) : r.buffer;
  return new r.constructor(t, r.byteOffset, r.length);
}
var mi = Cl;
function Tl(r, e) {
  var t = -1, n = r.length;
  for (e || (e = Array(n)); ++t < n; )
    e[t] = r[t];
  return e;
}
var ar = Tl, Ol = P, Vr = Object.create, Al = function() {
  function r() {
  }
  return function(e) {
    if (!Ol(e))
      return {};
    if (Vr)
      return Vr(e);
    r.prototype = e;
    var t = new r();
    return r.prototype = void 0, t;
  };
}(), bi = Al;
function El(r, e) {
  return function(t) {
    return r(e(t));
  };
}
var _i = El, Sl = _i, Il = Sl(Object.getPrototypeOf, Object), ft = Il, xl = Object.prototype;
function Pl(r) {
  var e = r && r.constructor, t = typeof e == "function" && e.prototype || xl;
  return r === t;
}
var je = Pl, Nl = bi, jl = ft, Bl = je;
function ql(r) {
  return typeof r.constructor == "function" && !Bl(r) ? Nl(jl(r)) : {};
}
var wi = ql, kl = Y, Rl = q, Ml = "[object Arguments]";
function Ll(r) {
  return Rl(r) && kl(r) == Ml;
}
var Fl = Ll, Gr = Fl, Hl = q, vi = Object.prototype, Ql = vi.hasOwnProperty, Wl = vi.propertyIsEnumerable, Dl = Gr(function() {
  return arguments;
}()) ? Gr : function(r) {
  return Hl(r) && Ql.call(r, "callee") && !Wl.call(r, "callee");
}, Be = Dl, Ul = 9007199254740991;
function Jl(r) {
  return typeof r == "number" && r > -1 && r % 1 == 0 && r <= Ul;
}
var ur = Jl, Vl = ut, Gl = ur;
function Kl(r) {
  return r != null && Gl(r.length) && !Vl(r);
}
var Q = Kl, zl = Q, Yl = q;
function Xl(r) {
  return Yl(r) && zl(r);
}
var Zl = Xl, Ze = { exports: {} };
function ec() {
  return !1;
}
var tc = ec;
Ze.exports;
(function(r, e) {
  var t = B, n = tc, i = e && !e.nodeType && e, s = i && !0 && r && !r.nodeType && r, o = s && s.exports === i, a = o ? t.Buffer : void 0, u = a ? a.isBuffer : void 0, c = u || n;
  r.exports = c;
})(Ze, Ze.exports);
var me = Ze.exports, rc = Y, nc = ft, ic = q, sc = "[object Object]", oc = Function.prototype, ac = Object.prototype, $i = oc.toString, uc = ac.hasOwnProperty, lc = $i.call(Object);
function cc(r) {
  if (!ic(r) || rc(r) != sc)
    return !1;
  var e = nc(r);
  if (e === null)
    return !0;
  var t = uc.call(e, "constructor") && e.constructor;
  return typeof t == "function" && t instanceof t && $i.call(t) == lc;
}
var qe = cc, hc = Y, dc = ur, fc = q, pc = "[object Arguments]", gc = "[object Array]", yc = "[object Boolean]", mc = "[object Date]", bc = "[object Error]", _c = "[object Function]", wc = "[object Map]", vc = "[object Number]", $c = "[object Object]", Cc = "[object RegExp]", Tc = "[object Set]", Oc = "[object String]", Ac = "[object WeakMap]", Ec = "[object ArrayBuffer]", Sc = "[object DataView]", Ic = "[object Float32Array]", xc = "[object Float64Array]", Pc = "[object Int8Array]", Nc = "[object Int16Array]", jc = "[object Int32Array]", Bc = "[object Uint8Array]", qc = "[object Uint8ClampedArray]", kc = "[object Uint16Array]", Rc = "[object Uint32Array]", $ = {};
$[Ic] = $[xc] = $[Pc] = $[Nc] = $[jc] = $[Bc] = $[qc] = $[kc] = $[Rc] = !0;
$[pc] = $[gc] = $[Ec] = $[yc] = $[Sc] = $[mc] = $[bc] = $[_c] = $[wc] = $[vc] = $[$c] = $[Cc] = $[Tc] = $[Oc] = $[Ac] = !1;
function Mc(r) {
  return fc(r) && dc(r.length) && !!$[hc(r)];
}
var Lc = Mc;
function Fc(r) {
  return function(e) {
    return r(e);
  };
}
var lr = Fc, et = { exports: {} };
et.exports;
(function(r, e) {
  var t = oi, n = e && !e.nodeType && e, i = n && !0 && r && !r.nodeType && r, s = i && i.exports === n, o = s && t.process, a = function() {
    try {
      var u = i && i.require && i.require("util").types;
      return u || o && o.binding && o.binding("util");
    } catch {
    }
  }();
  r.exports = a;
})(et, et.exports);
var cr = et.exports, Hc = Lc, Qc = lr, Kr = cr, zr = Kr && Kr.isTypedArray, Wc = zr ? Qc(zr) : Hc, be = Wc;
function Dc(r, e) {
  if (!(e === "constructor" && typeof r[e] == "function") && e != "__proto__")
    return r[e];
}
var Ci = Dc, Uc = dt, Jc = de, Vc = Object.prototype, Gc = Vc.hasOwnProperty;
function Kc(r, e, t) {
  var n = r[e];
  (!(Gc.call(r, e) && Jc(n, t)) || t === void 0 && !(e in r)) && Uc(r, e, t);
}
var pt = Kc, zc = pt, Yc = dt;
function Xc(r, e, t, n) {
  var i = !t;
  t || (t = {});
  for (var s = -1, o = e.length; ++s < o; ) {
    var a = e[s], u = n ? n(t[a], r[a], a, t, r) : void 0;
    u === void 0 && (u = r[a]), i ? Yc(t, a, u) : zc(t, a, u);
  }
  return t;
}
var Z = Xc;
function Zc(r, e) {
  for (var t = -1, n = Array(r); ++t < r; )
    n[t] = e(t);
  return n;
}
var eh = Zc, th = 9007199254740991, rh = /^(?:0|[1-9]\d*)$/;
function nh(r, e) {
  var t = typeof r;
  return e = e ?? th, !!e && (t == "number" || t != "symbol" && rh.test(r)) && r > -1 && r % 1 == 0 && r < e;
}
var gt = nh, ih = eh, sh = Be, oh = A, ah = me, uh = gt, lh = be, ch = Object.prototype, hh = ch.hasOwnProperty;
function dh(r, e) {
  var t = oh(r), n = !t && sh(r), i = !t && !n && ah(r), s = !t && !n && !i && lh(r), o = t || n || i || s, a = o ? ih(r.length, String) : [], u = a.length;
  for (var c in r)
    (e || hh.call(r, c)) && !(o && // Safari 9 has enumerable `arguments.length` in strict mode.
    (c == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    i && (c == "offset" || c == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    s && (c == "buffer" || c == "byteLength" || c == "byteOffset") || // Skip index properties.
    uh(c, u))) && a.push(c);
  return a;
}
var Ti = dh;
function fh(r) {
  var e = [];
  if (r != null)
    for (var t in Object(r))
      e.push(t);
  return e;
}
var ph = fh, gh = P, yh = je, mh = ph, bh = Object.prototype, _h = bh.hasOwnProperty;
function wh(r) {
  if (!gh(r))
    return mh(r);
  var e = yh(r), t = [];
  for (var n in r)
    n == "constructor" && (e || !_h.call(r, n)) || t.push(n);
  return t;
}
var vh = wh, $h = Ti, Ch = vh, Th = Q;
function Oh(r) {
  return Th(r) ? $h(r, !0) : Ch(r);
}
var ee = Oh, Ah = Z, Eh = ee;
function Sh(r) {
  return Ah(r, Eh(r));
}
var Ih = Sh, Yr = fi, xh = gi, Ph = mi, Nh = ar, jh = wi, Xr = Be, Zr = A, Bh = Zl, qh = me, kh = ut, Rh = P, Mh = qe, Lh = be, en = Ci, Fh = Ih;
function Hh(r, e, t, n, i, s, o) {
  var a = en(r, t), u = en(e, t), c = o.get(u);
  if (c) {
    Yr(r, t, c);
    return;
  }
  var l = s ? s(a, u, t + "", r, e, o) : void 0, h = l === void 0;
  if (h) {
    var d = Zr(u), _ = !d && qh(u), m = !d && !_ && Lh(u);
    l = u, d || _ || m ? Zr(a) ? l = a : Bh(a) ? l = Nh(a) : _ ? (h = !1, l = xh(u, !0)) : m ? (h = !1, l = Ph(u, !0)) : l = [] : Mh(u) || Xr(u) ? (l = a, Xr(a) ? l = Fh(a) : (!Rh(a) || kh(a)) && (l = jh(u))) : h = !1;
  }
  h && (o.set(u, l), i(l, u, n, s, o), o.delete(u)), Yr(r, t, l);
}
var Qh = Hh, Wh = ht, Dh = fi, Uh = pi, Jh = Qh, Vh = P, Gh = ee, Kh = Ci;
function Oi(r, e, t, n, i) {
  r !== e && Uh(e, function(s, o) {
    if (i || (i = new Wh()), Vh(s))
      Jh(r, e, o, t, Oi, n, i);
    else {
      var a = n ? n(Kh(r, o), s, o + "", r, e, i) : void 0;
      a === void 0 && (a = s), Dh(r, o, a);
    }
  }, Gh);
}
var zh = Oi;
function Yh(r) {
  return r;
}
var yt = Yh;
function Xh(r, e, t) {
  switch (t.length) {
    case 0:
      return r.call(e);
    case 1:
      return r.call(e, t[0]);
    case 2:
      return r.call(e, t[0], t[1]);
    case 3:
      return r.call(e, t[0], t[1], t[2]);
  }
  return r.apply(e, t);
}
var Zh = Xh, ed = Zh, tn = Math.max;
function td(r, e, t) {
  return e = tn(e === void 0 ? r.length - 1 : e, 0), function() {
    for (var n = arguments, i = -1, s = tn(n.length - e, 0), o = Array(s); ++i < s; )
      o[i] = n[e + i];
    i = -1;
    for (var a = Array(e + 1); ++i < e; )
      a[i] = n[i];
    return a[e] = t(o), ed(r, this, a);
  };
}
var rd = td;
function nd(r) {
  return function() {
    return r;
  };
}
var id = nd, sd = id, rn = di, od = yt, ad = rn ? function(r, e) {
  return rn(r, "toString", {
    configurable: !0,
    enumerable: !1,
    value: sd(e),
    writable: !0
  });
} : od, ud = ad, ld = 800, cd = 16, hd = Date.now;
function dd(r) {
  var e = 0, t = 0;
  return function() {
    var n = hd(), i = cd - (n - t);
    if (t = n, i > 0) {
      if (++e >= ld)
        return arguments[0];
    } else
      e = 0;
    return r.apply(void 0, arguments);
  };
}
var fd = dd, pd = ud, gd = fd, yd = gd(pd), md = yd, bd = yt, _d = rd, wd = md;
function vd(r, e) {
  return wd(_d(r, e, bd), r + "");
}
var Ai = vd, $d = de, Cd = Q, Td = gt, Od = P;
function Ad(r, e, t) {
  if (!Od(t))
    return !1;
  var n = typeof e;
  return (n == "number" ? Cd(t) && Td(e, t.length) : n == "string" && e in t) ? $d(t[e], r) : !1;
}
var hr = Ad, Ed = Ai, Sd = hr;
function Id(r) {
  return Ed(function(e, t) {
    var n = -1, i = t.length, s = i > 1 ? t[i - 1] : void 0, o = i > 2 ? t[2] : void 0;
    for (s = r.length > 3 && typeof s == "function" ? (i--, s) : void 0, o && Sd(t[0], t[1], o) && (s = i < 3 ? void 0 : s, i = 1), e = Object(e); ++n < i; ) {
      var a = t[n];
      a && r(e, a, n, s);
    }
    return e;
  });
}
var dr = Id, xd = zh, Pd = dr, Nd = Pd(function(r, e, t) {
  xd(r, e, t);
}), jd = Nd;
function Bd(r, e, t) {
  var n = -1, i = r.length;
  e < 0 && (e = -e > i ? 0 : i + e), t = t > i ? i : t, t < 0 && (t += i), i = e > t ? 0 : t - e >>> 0, e >>>= 0;
  for (var s = Array(i); ++n < i; )
    s[n] = r[n + e];
  return s;
}
var Ei = Bd, qd = /\s/;
function kd(r) {
  for (var e = r.length; e-- && qd.test(r.charAt(e)); )
    ;
  return e;
}
var Rd = kd, Md = Rd, Ld = /^\s+/;
function Fd(r) {
  return r && r.slice(0, Md(r) + 1).replace(Ld, "");
}
var Hd = Fd, Qd = Hd, nn = P, Wd = st, sn = 0 / 0, Dd = /^[-+]0x[0-9a-f]+$/i, Ud = /^0b[01]+$/i, Jd = /^0o[0-7]+$/i, Vd = parseInt;
function Gd(r) {
  if (typeof r == "number")
    return r;
  if (Wd(r))
    return sn;
  if (nn(r)) {
    var e = typeof r.valueOf == "function" ? r.valueOf() : r;
    r = nn(e) ? e + "" : e;
  }
  if (typeof r != "string")
    return r === 0 ? r : +r;
  r = Qd(r);
  var t = Ud.test(r);
  return t || Jd.test(r) ? Vd(r.slice(2), t ? 2 : 8) : Dd.test(r) ? sn : +r;
}
var Kd = Gd, zd = Kd, on = 1 / 0, Yd = 17976931348623157e292;
function Xd(r) {
  if (!r)
    return r === 0 ? r : 0;
  if (r = zd(r), r === on || r === -on) {
    var e = r < 0 ? -1 : 1;
    return e * Yd;
  }
  return r === r ? r : 0;
}
var Zd = Xd, ef = Zd;
function tf(r) {
  var e = ef(r), t = e % 1;
  return e === e ? t ? e - t : e : 0;
}
var Si = tf, rf = Ei, nf = hr, sf = Si, of = Math.ceil, af = Math.max;
function uf(r, e, t) {
  (t ? nf(r, e, t) : e === void 0) ? e = 1 : e = af(sf(e), 0);
  var n = r == null ? 0 : r.length;
  if (!n || e < 1)
    return [];
  for (var i = 0, s = 0, o = Array(of(n / e)); i < n; )
    o[s++] = rf(r, i, i += e);
  return o;
}
var lf = uf;
function cf(r, e) {
  for (var t = -1, n = e.length, i = r.length; ++t < n; )
    r[i + t] = e[t];
  return r;
}
var fr = cf, an = z, hf = Be, df = A, un = an ? an.isConcatSpreadable : void 0;
function ff(r) {
  return df(r) || hf(r) || !!(un && r && r[un]);
}
var pf = ff, gf = fr, yf = pf;
function Ii(r, e, t, n, i) {
  var s = -1, o = r.length;
  for (t || (t = yf), i || (i = []); ++s < o; ) {
    var a = r[s];
    e > 0 && t(a) ? e > 1 ? Ii(a, e - 1, t, n, i) : gf(i, a) : n || (i[i.length] = a);
  }
  return i;
}
var mf = Ii, bf = mf;
function _f(r) {
  var e = r == null ? 0 : r.length;
  return e ? bf(r, 1) : [];
}
var wf = _f, vf = (r) => new Promise((e) => setTimeout(e, r));
function $f(r) {
  return typeof r == "string";
}
function Cf(r) {
  return typeof r == "number";
}
function Tf(r) {
  return typeof r == "boolean";
}
function Of(r) {
  return typeof r > "u";
}
function Af(r) {
  return typeof r == "object" && r !== null;
}
function Ef(r) {
  return typeof r == "function";
}
var j = {
  isString: $f,
  isNumber: Cf,
  isBoolean: Tf,
  isUndefined: Of,
  isObject: Af,
  isFunction: Ef
};
const Sf = lf, If = wf, xf = vf, { isNumber: Pf } = j;
function Nf(r, e, t, n = 1e3) {
  let i, s = null;
  if (!Pf(n) || n < 1)
    throw new TypeError(`Invalid chunkSize: ${n}`);
  if (!Array.isArray(t))
    throw new TypeError(`Invalid batch: Expected array, got ${typeof t}`);
  const o = Sf(t, n), a = (u) => s ? u(s) : r.transaction(u);
  return Object.assign(
    Promise.resolve().then(async () => (await xf(1), a(async (u) => {
      const c = [];
      for (const l of o)
        c.push(await u(e).insert(l, i));
      return If(c);
    }))),
    {
      returning(u) {
        return i = u, this;
      },
      transacting(u) {
        return s = u, this;
      }
    }
  );
}
var jf = Nf;
const { EventEmitter: Bf } = E, { Migrator: qf } = nr, kf = nr, Rf = qo, ln = ko, Mf = jd, Lf = jf, { isObject: Ff } = j, xi = {
  client: {
    get() {
      return this.context.client;
    },
    set(r) {
      this.context.client = r;
    },
    configurable: !0
  },
  userParams: {
    get() {
      return this.context.userParams;
    },
    set(r) {
      this.context.userParams = r;
    },
    configurable: !0
  },
  schema: {
    get() {
      return this.client.schemaBuilder();
    },
    configurable: !0
  },
  migrate: {
    get() {
      return new qf(this);
    },
    configurable: !0
  },
  seed: {
    get() {
      return new kf();
    },
    configurable: !0
  },
  fn: {
    get() {
      return new Rf(this.client);
    },
    configurable: !0
  }
}, Hf = [
  "raw",
  "batchInsert",
  "transaction",
  "transactionProvider",
  "initialize",
  "destroy",
  "ref",
  "withUserParams",
  "queryBuilder",
  "disableProcessing",
  "enableProcessing"
];
for (const r of Hf)
  xi[r] = {
    value: function(...e) {
      return this.context[r](...e);
    },
    configurable: !0
  };
function Qf(r) {
  function e(t, n) {
    return Ni(e.context, t, n);
  }
  return Pi(e, r), e;
}
function Wf(r) {
  const e = r.context || {};
  Object.assign(e, {
    queryBuilder() {
      return this.client.queryBuilder();
    },
    raw() {
      return this.client.raw.apply(this.client, arguments);
    },
    batchInsert(t, n, i = 1e3) {
      return Lf(this, t, n, i);
    },
    // Creates a new transaction.
    // If container is provided, returns a promise for when the transaction is resolved.
    // If container is not provided, returns a promise with a transaction that is resolved
    // when transaction is ready to be used.
    transaction(t, n) {
      !n && Ff(t) && (n = t, t = null);
      const i = Object.assign({}, n);
      return i.userParams = this.userParams || {}, i.doNotRejectOnRollback === void 0 && (i.doNotRejectOnRollback = !0), this._transaction(t, i);
    },
    // Internal method that actually establishes the Transaction.  It makes no assumptions
    // about the `config` or `outerTx`, and expects the caller to handle these details.
    _transaction(t, n, i = null) {
      return t ? this.client.transaction(t, n, i) : new Promise((s, o) => {
        this.client.transaction(s, n, i).catch(o);
      });
    },
    transactionProvider(t) {
      let n;
      return () => (n || (n = this.transaction(void 0, t)), n);
    },
    // Typically never needed, initializes the pool for a knex client.
    initialize(t) {
      return this.client.initializePool(t);
    },
    // Convenience method for tearing down the pool.
    destroy(t) {
      return this.client.destroy(t);
    },
    ref(t) {
      return this.client.ref(t);
    },
    // Do not document this as public API until naming and API is improved for general consumption
    // This method exists to disable processing of internal queries in migrations
    disableProcessing() {
      this.userParams.isProcessingDisabled || (this.userParams.wrapIdentifier = this.client.config.wrapIdentifier, this.userParams.postProcessResponse = this.client.config.postProcessResponse, this.client.config.wrapIdentifier = null, this.client.config.postProcessResponse = null, this.userParams.isProcessingDisabled = !0);
    },
    // Do not document this as public API until naming and API is improved for general consumption
    // This method exists to enable execution of non-internal queries with consistent identifier naming in migrations
    enableProcessing() {
      this.userParams.isProcessingDisabled && (this.client.config.wrapIdentifier = this.userParams.wrapIdentifier, this.client.config.postProcessResponse = this.userParams.postProcessResponse, this.userParams.isProcessingDisabled = !1);
    },
    withUserParams(t) {
      const n = Df(r);
      return this.client && (n.client = Object.create(this.client.constructor.prototype), Mf(n.client, this.client), n.client.config = Object.assign({}, this.client.config)), Pi(n, n.client), He("query", r, n), He("query-error", r, n), He("query-response", r, n), He("start", r, n), n.userParams = t, n;
    }
  }), r.context || (r.context = e);
}
function He(r, e, t) {
  e.listeners(r).forEach((i) => {
    t.on(r, i);
  });
}
function Pi(r, e) {
  for (let n = 0; n < ln.length; n++) {
    const i = ln[n];
    r[i] = function() {
      const s = this.queryBuilder();
      return s[i].apply(s, arguments);
    };
  }
  Object.defineProperties(r, xi), Wf(r), r.client = e, r.userParams = {};
  const t = new Bf();
  for (const n in t)
    r[n] = t[n];
  r._internalListeners && r._internalListeners.forEach(({ eventName: n, listener: i }) => {
    r.client.removeListener(n, i);
  }), r._internalListeners = [], Qe(r, "start", (n) => {
    r.emit("start", n);
  }), Qe(r, "query", (n) => {
    r.emit("query", n);
  }), Qe(r, "query-error", (n, i) => {
    r.emit("query-error", n, i);
  }), Qe(r, "query-response", (n, i, s) => {
    r.emit("query-response", n, i, s);
  });
}
function Qe(r, e, t) {
  r.client.on(e, t), r._internalListeners.push({
    eventName: e,
    listener: t
  });
}
function Ni(r, e, t) {
  const n = r.queryBuilder();
  return e || r.client.logger.warn(
    "calling knex without a tableName is deprecated. Use knex.queryBuilder() instead."
  ), e ? n.table(e, t) : n;
}
function Df(r) {
  const e = Object.create(
    Object.getPrototypeOf(r),
    Object.getOwnPropertyDescriptors(r)
  ), t = {}, i = ((s, o) => Ni(t, s, o)).bind(e);
  return Object.assign(i, r), i.context = t, i;
}
var Uf = Qf, _e = {};
let ji = class extends Error {
  constructor(e) {
    super(e), this.name = "KnexTimeoutError";
  }
};
function Jf(r, e) {
  return new Promise(function(t, n) {
    const i = setTimeout(function() {
      n(new ji("operation timed out"));
    }, e);
    function s(a) {
      clearTimeout(i), t(a);
    }
    function o(a) {
      clearTimeout(i), n(a);
    }
    r.then(s, o);
  });
}
_e.KnexTimeoutError = ji;
_e.timeout = Jf;
const Vf = nr, Gf = (r) => Object.assign(r, {
  finally(e) {
    return this.then().finally(e);
  }
});
var Bi = Promise.prototype.finally ? Gf : Vf;
const { EventEmitter: Kf } = E, zf = he, Yf = ci, { callbackify: Xf } = E, Zf = Uf, { timeout: cn, KnexTimeoutError: hn } = _e, ep = Bi, Ie = zf("knex:tx");
function tp() {
  return {
    userParams: {},
    doNotRejectOnRollback: !0
  };
}
const dn = [
  // Doesn't really work in postgres, it treats it as read committed
  "read uncommitted",
  "read committed",
  "snapshot",
  // snapshot and repeatable read are basically the same, most "repeatable
  // read" implementations are actually "snapshot" also known as Multi Version
  // Concurrency Control (MVCC). Mssql's repeatable read doesn't stop
  // repeated reads for inserts as it uses a pessimistic locking system so
  // you should probably use 'snapshot' to stop read skew.
  "repeatable read",
  // mysql pretends to have serializable, but it is not
  "serializable"
];
let qi = class extends Kf {
  constructor(e, t, n = tp(), i = null) {
    super(), this.userParams = n.userParams, this.doNotRejectOnRollback = n.doNotRejectOnRollback;
    const s = this.txid = Yf("trx");
    this.client = e, this.logger = e.logger, this.outerTx = i, this.trxClient = void 0, this._completed = !1, this._debug = e.config && e.config.debug, n.isolationLevel && this.setIsolationLevel(n.isolationLevel), Ie(
      "%s: Starting %s transaction",
      s,
      i ? "nested" : "top level"
    ), this._lastChild = Promise.resolve();
    const a = (i ? i._lastChild : Promise.resolve()).then(
      () => this._evaluateContainer(n, t)
    );
    this._promise = a.then((u) => u), i && (i._lastChild = a.catch(() => {
    }));
  }
  isCompleted() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || !1;
  }
  begin(e) {
    return (this.isolationLevel ? this.query(
      e,
      `SET TRANSACTION ISOLATION LEVEL ${this.isolationLevel};`
    ) : Promise.resolve()).then(() => this.query(e, "BEGIN;"));
  }
  savepoint(e) {
    return this.query(e, `SAVEPOINT ${this.txid};`);
  }
  commit(e, t) {
    return this.query(e, "COMMIT;", 1, t);
  }
  release(e, t) {
    return this.query(e, `RELEASE SAVEPOINT ${this.txid};`, 1, t);
  }
  setIsolationLevel(e) {
    if (!dn.includes(e))
      throw new Error(
        `Invalid isolationLevel, supported isolation levels are: ${JSON.stringify(
          dn
        )}`
      );
    return this.isolationLevel = e, this;
  }
  rollback(e, t) {
    return cn(this.query(e, "ROLLBACK", 2, t), 5e3).catch(
      (n) => {
        if (!(n instanceof hn))
          return Promise.reject(n);
        this._rejecter(t);
      }
    );
  }
  rollbackTo(e, t) {
    return cn(
      this.query(e, `ROLLBACK TO SAVEPOINT ${this.txid}`, 2, t),
      5e3
    ).catch((n) => {
      if (!(n instanceof hn))
        return Promise.reject(n);
      this._rejecter(t);
    });
  }
  query(e, t, n, i) {
    const s = this.trxClient.query(e, t).catch((o) => {
      n = 2, i = o, this._completed = !0, Ie("%s error running transaction query", this.txid);
    }).then((o) => {
      if (n === 1 && this._resolver(i), n === 2) {
        if (i === void 0) {
          if (this.doNotRejectOnRollback && /^ROLLBACK\b/i.test(t)) {
            this._resolver();
            return;
          }
          i = new Error(`Transaction rejected with non-error: ${i}`);
        }
        this._rejecter(i);
      }
      return o;
    });
    return (n === 1 || n === 2) && (this._completed = !0), s;
  }
  debug(e) {
    return this._debug = arguments.length ? e : !0, this;
  }
  async _evaluateContainer(e, t) {
    return this.acquireConnection(e, (n) => {
      const i = this.trxClient = np(
        this,
        this.client,
        n
      ), s = this.client.transacting ? this.savepoint(n) : this.begin(n), o = new Promise((a, u) => {
        this._resolver = a, this._rejecter = u;
      });
      return s.then(() => rp(this, n, i)).then((a) => {
        a.executionPromise = o;
        let u;
        try {
          u = t(a);
        } catch (c) {
          u = Promise.reject(c);
        }
        return u && u.then && typeof u.then == "function" && u.then((c) => a.commit(c)).catch((c) => a.rollback(c)), null;
      }).catch((a) => this._rejecter(a)), o;
    });
  }
  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  async acquireConnection(e, t) {
    const n = e && e.connection, i = n || await this.client.acquireConnection();
    try {
      return i.__knexTxId = this.txid, await t(i);
    } finally {
      n ? Ie("%s: not releasing external connection", this.txid) : (Ie("%s: releasing connection", this.txid), this.client.releaseConnection(i));
    }
  }
  then(e, t) {
    return this._promise.then(e, t);
  }
  catch(...e) {
    return this._promise.catch(...e);
  }
  asCallback(e) {
    return Xf(() => this._promise)(e), this._promise;
  }
};
ep(qi.prototype);
function rp(r, e, t) {
  const n = Zf(t);
  return n.context.withUserParams = () => {
    throw new Error(
      "Cannot set user params on a transaction - it can only inherit params from main knex instance"
    );
  }, n.isTransaction = !0, n.userParams = r.userParams || {}, n.context.transaction = function(i, s) {
    return s ? s.doNotRejectOnRollback === void 0 && (s.doNotRejectOnRollback = !0) : s = { doNotRejectOnRollback: !0 }, this._transaction(i, s, r);
  }, n.savepoint = function(i, s) {
    return n.transaction(i, s);
  }, r.client.transacting ? (n.commit = (i) => r.release(e, i), n.rollback = (i) => r.rollbackTo(e, i)) : (n.commit = (i) => r.commit(e, i), n.rollback = (i) => r.rollback(e, i)), n.isCompleted = () => r.isCompleted(), n;
}
function np(r, e, t) {
  const n = Object.create(e.constructor.prototype);
  n.version = e.version, n.config = e.config, n.driver = e.driver, n.connectionSettings = e.connectionSettings, n.transacting = !0, n.valueForUndefined = e.valueForUndefined, n.logger = e.logger, n.on("start", function(o) {
    r.emit("start", o), e.emit("start", o);
  }), n.on("query", function(o) {
    r.emit("query", o), e.emit("query", o);
  }), n.on("query-error", function(o, a) {
    r.emit("query-error", o, a), e.emit("query-error", o, a);
  }), n.on("query-response", function(o, a, u) {
    r.emit("query-response", o, a, u), e.emit("query-response", o, a, u);
  });
  const i = n.query;
  n.query = function(o, a) {
    const u = r.isCompleted();
    return new Promise(function(c, l) {
      try {
        if (o !== t)
          throw new Error("Invalid connection for transaction query.");
        u && fn(r, a), c(i.call(n, o, a));
      } catch (h) {
        l(h);
      }
    });
  };
  const s = n.stream;
  return n.stream = function(o, a, u, c) {
    const l = r.isCompleted();
    return new Promise(function(h, d) {
      try {
        if (o !== t)
          throw new Error("Invalid connection for transaction query.");
        l && fn(r, a), h(s.call(n, o, a, u, c));
      } catch (_) {
        d(_);
      }
    });
  }, n.acquireConnection = function() {
    return Promise.resolve(t);
  }, n.releaseConnection = function() {
    return Promise.resolve();
  }, n;
}
function fn(r, e) {
  const t = typeof e == "string" ? e : e && e.sql;
  throw Ie("%s: Transaction completed: %s", r.txid, t), new Error(
    "Transaction query already complete, run with DEBUG=knex:tx for more info"
  );
}
var ki = qi;
const ip = /* @__PURE__ */ si(ki);
class sp extends ip {
}
var Jt = { exports: {} }, pr = {}, gr = {}, mt = {};
Object.defineProperty(mt, "__esModule", { value: !0 });
let op = class extends Error {
};
mt.TimeoutError = op;
var N = {}, yr = {};
Object.defineProperty(yr, "__esModule", { value: !0 });
class ap {
  constructor(e) {
    this._value = e.value, this._error = e.error;
  }
  value() {
    return this._value;
  }
  reason() {
    return this._error;
  }
  isRejected() {
    return !!this._error;
  }
  isFulfilled() {
    return !!this._value;
  }
}
yr.PromiseInspection = ap;
Object.defineProperty(N, "__esModule", { value: !0 });
const pn = yr;
function up() {
  let r = null, e = null;
  return {
    promise: new Promise((n, i) => {
      r = n, e = i;
    }),
    resolve: r,
    reject: e
  };
}
N.defer = up;
function lp() {
  return Date.now();
}
N.now = lp;
function cp(r, e) {
  return Math.abs(e - r);
}
N.duration = cp;
function hp(r) {
  return typeof r > "u" ? !0 : Ri(r);
}
N.checkOptionalTime = hp;
function Ri(r) {
  return typeof r == "number" && r === Math.round(r) && r > 0;
}
N.checkRequiredTime = Ri;
function dp(r) {
  return new Promise((e) => setTimeout(e, r));
}
N.delay = dp;
function fp(r) {
  return r.then((e) => new pn.PromiseInspection({ value: e })).catch((e) => new pn.PromiseInspection({ error: e }));
}
N.reflect = fp;
function pp(r) {
  try {
    const e = r();
    return Promise.resolve(e);
  } catch (e) {
    return Promise.reject(e);
  }
}
N.tryPromise = pp;
Object.defineProperty(gr, "__esModule", { value: !0 });
const Ke = mt, gp = N;
class yp {
  constructor(e) {
    this.timeoutMillis = e, this.deferred = gp.defer(), this.possibleTimeoutCause = null, this.isRejected = !1, this.promise = mp(this.deferred.promise, e).catch((t) => (t instanceof Ke.TimeoutError && (this.possibleTimeoutCause ? t = new Ke.TimeoutError(this.possibleTimeoutCause.message) : t = new Ke.TimeoutError("operation timed out for an unknown reason")), this.isRejected = !0, Promise.reject(t)));
  }
  abort() {
    this.reject(new Error("aborted"));
  }
  reject(e) {
    this.deferred.reject(e);
  }
  resolve(e) {
    this.deferred.resolve(e);
  }
}
gr.PendingOperation = yp;
function mp(r, e) {
  return new Promise((t, n) => {
    const i = setTimeout(() => n(new Ke.TimeoutError()), e);
    r.then((s) => {
      clearTimeout(i), t(s);
    }).catch((s) => {
      clearTimeout(i), n(s);
    });
  });
}
var mr = {};
Object.defineProperty(mr, "__esModule", { value: !0 });
const gn = N;
class br {
  constructor(e) {
    this.resource = e, this.resource = e, this.timestamp = gn.now(), this.deferred = gn.defer();
  }
  get promise() {
    return this.deferred.promise;
  }
  resolve() {
    return this.deferred.resolve(void 0), new br(this.resource);
  }
}
mr.Resource = br;
Object.defineProperty(pr, "__esModule", { value: !0 });
const We = gr, bp = mr, I = N, _p = E, yn = E;
let wp = class {
  constructor(e) {
    if (this.destroyed = !1, this.emitter = new _p.EventEmitter(), e = e || {}, !e.create)
      throw new Error("Tarn: opt.create function most be provided");
    if (!e.destroy)
      throw new Error("Tarn: opt.destroy function most be provided");
    if (typeof e.min != "number" || e.min < 0 || e.min !== Math.round(e.min))
      throw new Error("Tarn: opt.min must be an integer >= 0");
    if (typeof e.max != "number" || e.max <= 0 || e.max !== Math.round(e.max))
      throw new Error("Tarn: opt.max must be an integer > 0");
    if (e.min > e.max)
      throw new Error("Tarn: opt.max is smaller than opt.min");
    if (!I.checkOptionalTime(e.acquireTimeoutMillis))
      throw new Error("Tarn: invalid opt.acquireTimeoutMillis " + JSON.stringify(e.acquireTimeoutMillis));
    if (!I.checkOptionalTime(e.createTimeoutMillis))
      throw new Error("Tarn: invalid opt.createTimeoutMillis " + JSON.stringify(e.createTimeoutMillis));
    if (!I.checkOptionalTime(e.destroyTimeoutMillis))
      throw new Error("Tarn: invalid opt.destroyTimeoutMillis " + JSON.stringify(e.destroyTimeoutMillis));
    if (!I.checkOptionalTime(e.idleTimeoutMillis))
      throw new Error("Tarn: invalid opt.idleTimeoutMillis " + JSON.stringify(e.idleTimeoutMillis));
    if (!I.checkOptionalTime(e.reapIntervalMillis))
      throw new Error("Tarn: invalid opt.reapIntervalMillis " + JSON.stringify(e.reapIntervalMillis));
    if (!I.checkOptionalTime(e.createRetryIntervalMillis))
      throw new Error("Tarn: invalid opt.createRetryIntervalMillis " + JSON.stringify(e.createRetryIntervalMillis));
    const t = {
      create: !0,
      validate: !0,
      destroy: !0,
      log: !0,
      min: !0,
      max: !0,
      acquireTimeoutMillis: !0,
      createTimeoutMillis: !0,
      destroyTimeoutMillis: !0,
      idleTimeoutMillis: !0,
      reapIntervalMillis: !0,
      createRetryIntervalMillis: !0,
      propagateCreateError: !0
    };
    for (const n of Object.keys(e))
      if (!t[n])
        throw new Error(`Tarn: unsupported option opt.${n}`);
    this.creator = e.create, this.destroyer = e.destroy, this.validate = typeof e.validate == "function" ? e.validate : () => !0, this.log = e.log || (() => {
    }), this.acquireTimeoutMillis = e.acquireTimeoutMillis || 3e4, this.createTimeoutMillis = e.createTimeoutMillis || 3e4, this.destroyTimeoutMillis = e.destroyTimeoutMillis || 5e3, this.idleTimeoutMillis = e.idleTimeoutMillis || 3e4, this.reapIntervalMillis = e.reapIntervalMillis || 1e3, this.createRetryIntervalMillis = e.createRetryIntervalMillis || 200, this.propagateCreateError = !!e.propagateCreateError, this.min = e.min, this.max = e.max, this.used = [], this.free = [], this.pendingCreates = [], this.pendingAcquires = [], this.pendingDestroys = [], this.pendingValidations = [], this.destroyed = !1, this.interval = null, this.eventId = 1;
  }
  numUsed() {
    return this.used.length;
  }
  numFree() {
    return this.free.length;
  }
  numPendingAcquires() {
    return this.pendingAcquires.length;
  }
  numPendingValidations() {
    return this.pendingValidations.length;
  }
  numPendingCreates() {
    return this.pendingCreates.length;
  }
  acquire() {
    const e = this.eventId++;
    this._executeEventHandlers("acquireRequest", e);
    const t = new We.PendingOperation(this.acquireTimeoutMillis);
    return this.pendingAcquires.push(t), t.promise = t.promise.then((n) => (this._executeEventHandlers("acquireSuccess", e, n), n)).catch((n) => (this._executeEventHandlers("acquireFail", e, n), se(this.pendingAcquires, t), Promise.reject(n))), this._tryAcquireOrCreate(), t;
  }
  release(e) {
    this._executeEventHandlers("release", e);
    for (let t = 0, n = this.used.length; t < n; ++t) {
      const i = this.used[t];
      if (i.resource === e)
        return this.used.splice(t, 1), this.free.push(i.resolve()), this._tryAcquireOrCreate(), !0;
    }
    return !1;
  }
  isEmpty() {
    return [
      this.numFree(),
      this.numUsed(),
      this.numPendingAcquires(),
      this.numPendingValidations(),
      this.numPendingCreates()
    ].reduce((e, t) => e + t) === 0;
  }
  /**
   * Reaping cycle.
   */
  check() {
    const e = I.now(), t = [], n = this.min - this.used.length, i = this.free.length - n;
    let s = 0;
    this.free.forEach((o) => {
      I.duration(e, o.timestamp) >= this.idleTimeoutMillis && s < i ? (s++, this._destroy(o.resource)) : t.push(o);
    }), this.free = t, this.isEmpty() && this._stopReaping();
  }
  destroy() {
    const e = this.eventId++;
    return this._executeEventHandlers("poolDestroyRequest", e), this._stopReaping(), this.destroyed = !0, I.reflect(Promise.all(this.pendingCreates.map((t) => I.reflect(t.promise))).then(() => new Promise((t, n) => {
      if (this.numPendingValidations() === 0) {
        t();
        return;
      }
      const i = setInterval(() => {
        this.numPendingValidations() === 0 && (yn.clearInterval(i), t());
      }, 100);
    })).then(() => Promise.all(this.used.map((t) => I.reflect(t.promise)))).then(() => Promise.all(this.pendingAcquires.map((t) => (t.abort(), I.reflect(t.promise))))).then(() => Promise.all(this.free.map((t) => I.reflect(this._destroy(t.resource))))).then(() => Promise.all(this.pendingDestroys.map((t) => t.promise))).then(() => {
      this.free = [], this.pendingAcquires = [];
    })).then((t) => (this._executeEventHandlers("poolDestroySuccess", e), this.emitter.removeAllListeners(), t));
  }
  on(e, t) {
    this.emitter.on(e, t);
  }
  removeListener(e, t) {
    this.emitter.removeListener(e, t);
  }
  removeAllListeners(e) {
    this.emitter.removeAllListeners(e);
  }
  /**
   * The most important method that is called always when resources
   * are created / destroyed / acquired / released. In other words
   * every time when resources are moved from used to free or vice
   * versa.
   *
   * Either assigns free resources to pendingAcquires or creates new
   * resources if there is room for it in the pool.
   */
  _tryAcquireOrCreate() {
    this.destroyed || (this._hasFreeResources() ? this._doAcquire() : this._shouldCreateMoreResources() && this._doCreate());
  }
  _hasFreeResources() {
    return this.free.length > 0;
  }
  _doAcquire() {
    for (; this._canAcquire(); ) {
      const e = this.pendingAcquires.shift(), t = this.free.pop();
      if (t === void 0 || e === void 0) {
        const i = "this.free was empty while trying to acquire resource";
        throw this.log(`Tarn: ${i}`, "warn"), new Error(`Internal error, should never happen. ${i}`);
      }
      this.pendingValidations.push(e), this.used.push(t);
      const n = new We.PendingOperation(this.acquireTimeoutMillis);
      e.promise.catch((i) => {
        n.abort();
      }), n.promise.catch((i) => (this.log("Tarn: resource validator threw an exception " + i.stack, "warn"), !1)).then((i) => {
        try {
          i && !e.isRejected ? (this._startReaping(), e.resolve(t.resource)) : (se(this.used, t), i ? this.free.push(t) : (this._destroy(t.resource), setTimeout(() => {
            this._tryAcquireOrCreate();
          }, 0)), e.isRejected || this.pendingAcquires.unshift(e));
        } finally {
          se(this.pendingValidations, e);
        }
      }), this._validateResource(t.resource).then((i) => {
        n.resolve(i);
      }).catch((i) => {
        n.reject(i);
      });
    }
  }
  _canAcquire() {
    return this.free.length > 0 && this.pendingAcquires.length > 0;
  }
  _validateResource(e) {
    try {
      return Promise.resolve(this.validate(e));
    } catch (t) {
      return Promise.reject(t);
    }
  }
  _shouldCreateMoreResources() {
    return this.used.length + this.pendingCreates.length < this.max && this.pendingCreates.length < this.pendingAcquires.length;
  }
  _doCreate() {
    const e = this.pendingAcquires.slice();
    this._create().promise.then(() => (this._tryAcquireOrCreate(), null)).catch((n) => {
      this.propagateCreateError && this.pendingAcquires.length !== 0 && this.pendingAcquires[0].reject(n), e.forEach((i) => {
        i.possibleTimeoutCause = n;
      }), I.delay(this.createRetryIntervalMillis).then(() => this._tryAcquireOrCreate());
    });
  }
  _create() {
    const e = this.eventId++;
    this._executeEventHandlers("createRequest", e);
    const t = new We.PendingOperation(this.createTimeoutMillis);
    return t.promise = t.promise.catch((n) => {
      throw se(this.pendingCreates, t) && this._executeEventHandlers("createFail", e, n), n;
    }), this.pendingCreates.push(t), vp(this.creator).then((n) => t.isRejected ? (this.destroyer(n), null) : (se(this.pendingCreates, t), this.free.push(new bp.Resource(n)), t.resolve(n), this._executeEventHandlers("createSuccess", e, n), null)).catch((n) => (t.isRejected || (se(this.pendingCreates, t) && this._executeEventHandlers("createFail", e, n), t.reject(n)), null)), t;
  }
  _destroy(e) {
    const t = this.eventId++;
    this._executeEventHandlers("destroyRequest", t, e);
    const n = new We.PendingOperation(this.destroyTimeoutMillis);
    return Promise.resolve().then(() => this.destroyer(e)).then(() => {
      n.resolve(e);
    }).catch((s) => {
      n.reject(s);
    }), this.pendingDestroys.push(n), n.promise.then((s) => (this._executeEventHandlers("destroySuccess", t, e), s)).catch((s) => this._logDestroyerError(t, e, s)).then((s) => {
      const o = this.pendingDestroys.findIndex((a) => a === n);
      return this.pendingDestroys.splice(o, 1), s;
    });
  }
  _logDestroyerError(e, t, n) {
    this._executeEventHandlers("destroyFail", e, t, n), this.log("Tarn: resource destroyer threw an exception " + n.stack, "warn");
  }
  _startReaping() {
    this.interval || (this._executeEventHandlers("startReaping"), this.interval = setInterval(() => this.check(), this.reapIntervalMillis));
  }
  _stopReaping() {
    this.interval !== null && (this._executeEventHandlers("stopReaping"), yn.clearInterval(this.interval)), this.interval = null;
  }
  _executeEventHandlers(e, ...t) {
    this.emitter.listeners(e).forEach((i) => {
      try {
        i(...t);
      } catch (s) {
        this.log(`Tarn: event handler "${e}" threw an exception ${s.stack}`, "warn");
      }
    });
  }
};
pr.Pool = wp;
function se(r, e) {
  const t = r.indexOf(e);
  return t === -1 ? !1 : (r.splice(t, 1), !0);
}
function vp(r) {
  return new Promise((e, t) => {
    const n = (i, s) => {
      i ? t(i) : e(s);
    };
    I.tryPromise(() => r(n)).then((i) => {
      i && e(i);
    }).catch((i) => {
      t(i);
    });
  });
}
(function(r, e) {
  Object.defineProperty(e, "__esModule", { value: !0 });
  const t = pr;
  e.Pool = t.Pool;
  const n = mt;
  e.TimeoutError = n.TimeoutError, r.exports = {
    Pool: t.Pool,
    TimeoutError: n.TimeoutError
  };
})(Jt, Jt.exports);
var $p = Jt.exports;
const ze = /[\0\b\t\n\r\x1a"'\\]/g, Mi = {
  "\0": "\\0",
  "\b": "\\b",
  "	": "\\t",
  "\n": "\\n",
  "\r": "\\r",
  "": "\\Z",
  '"': '\\"',
  "'": "\\'",
  "\\": "\\\\"
};
function Cp(r) {
  return function e(t, n = {}) {
    return r(t, e, n);
  };
}
function Tp(r = {}) {
  const e = r.escapeDate || Hi, t = r.escapeArray || _r, n = r.escapeBuffer || Fi, i = r.escapeString || wr, s = r.escapeObject || Li, o = r.wrap || Cp;
  function a(u, c, l) {
    if (u == null)
      return "NULL";
    switch (typeof u) {
      case "boolean":
        return u ? "true" : "false";
      case "number":
        return u + "";
      case "object":
        if (u instanceof Date)
          u = e(u, c, l);
        else
          return Array.isArray(u) ? t(u, c, l) : Buffer.isBuffer(u) ? n(u, c, l) : s(u, c, l);
    }
    return i(u, c, l);
  }
  return o ? o(a) : a;
}
function Li(r, e, t) {
  return r && typeof r.toSQL == "function" ? r.toSQL(t) : JSON.stringify(r);
}
function _r(r, e, t) {
  let n = "";
  for (let i = 0; i < r.length; i++) {
    const s = r[i];
    Array.isArray(s) ? n += (i === 0 ? "" : ", ") + "(" + _r(s, e, t) + ")" : n += (i === 0 ? "" : ", ") + e(s, t);
  }
  return n;
}
function Fi(r) {
  return "X" + wr(r.toString("hex"));
}
function wr(r, e, t) {
  let n = ze.lastIndex = 0, i = "", s;
  for (; s = ze.exec(r); )
    i += r.slice(n, s.index) + Mi[s[0]], n = ze.lastIndex;
  return n === 0 ? "'" + r + "'" : n < r.length ? "'" + i + r.slice(n) + "'" : "'" + i + "'";
}
function Hi(r, e, t = {}) {
  const n = t.timeZone || "local", i = new Date(r);
  let s, o, a, u, c, l, h;
  if (n === "local")
    s = i.getFullYear(), o = i.getMonth() + 1, a = i.getDate(), u = i.getHours(), c = i.getMinutes(), l = i.getSeconds(), h = i.getMilliseconds();
  else {
    const d = Op(n);
    d !== !1 && d !== 0 && i.setTime(i.getTime() + d * 6e4), s = i.getUTCFullYear(), o = i.getUTCMonth() + 1, a = i.getUTCDate(), u = i.getUTCHours(), c = i.getUTCMinutes(), l = i.getUTCSeconds(), h = i.getUTCMilliseconds();
  }
  return V(s, 4) + "-" + V(o, 2) + "-" + V(a, 2) + " " + V(u, 2) + ":" + V(c, 2) + ":" + V(l, 2) + "." + V(h, 3);
}
function V(r, e) {
  for (r = r.toString(); r.length < e; )
    r = "0" + r;
  return r;
}
function Op(r) {
  if (r === "Z")
    return 0;
  const e = r.match(/([+\-\s])(\d\d):?(\d\d)?/);
  return e ? (e[1] == "-" ? -1 : 1) * (parseInt(e[2], 10) + (e[3] ? parseInt(e[3], 10) : 0) / 60) * 60 : !1;
}
var Ap = {
  arrayToList: _r,
  bufferToString: Fi,
  dateToString: Hi,
  escapeString: wr,
  charsRegex: ze,
  charsMap: Mi,
  escapeObject: Li,
  makeEscape: Tp
};
function Ep(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length; ++t < n && e(r[t], t, r) !== !1; )
    ;
  return r;
}
var vr = Ep, Sp = _i, Ip = Sp(Object.keys, Object), xp = Ip, Pp = je, Np = xp, jp = Object.prototype, Bp = jp.hasOwnProperty;
function qp(r) {
  if (!Pp(r))
    return Np(r);
  var e = [];
  for (var t in Object(r))
    Bp.call(r, t) && t != "constructor" && e.push(t);
  return e;
}
var Qi = qp, kp = Ti, Rp = Qi, Mp = Q;
function Lp(r) {
  return Mp(r) ? kp(r) : Rp(r);
}
var te = Lp, Fp = Z, Hp = te;
function Qp(r, e) {
  return r && Fp(e, Hp(e), r);
}
var Wp = Qp, Dp = Z, Up = ee;
function Jp(r, e) {
  return r && Dp(e, Up(e), r);
}
var Vp = Jp;
function Gp(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length, i = 0, s = []; ++t < n; ) {
    var o = r[t];
    e(o, t, r) && (s[i++] = o);
  }
  return s;
}
var Wi = Gp;
function Kp() {
  return [];
}
var Di = Kp, zp = Wi, Yp = Di, Xp = Object.prototype, Zp = Xp.propertyIsEnumerable, mn = Object.getOwnPropertySymbols, eg = mn ? function(r) {
  return r == null ? [] : (r = Object(r), zp(mn(r), function(e) {
    return Zp.call(r, e);
  }));
} : Yp, $r = eg, tg = Z, rg = $r;
function ng(r, e) {
  return tg(r, rg(r), e);
}
var ig = ng, sg = fr, og = ft, ag = $r, ug = Di, lg = Object.getOwnPropertySymbols, cg = lg ? function(r) {
  for (var e = []; r; )
    sg(e, ag(r)), r = og(r);
  return e;
} : ug, Ui = cg, hg = Z, dg = Ui;
function fg(r, e) {
  return hg(r, dg(r), e);
}
var pg = fg, gg = fr, yg = A;
function mg(r, e, t) {
  var n = e(r);
  return yg(r) ? n : gg(n, t(r));
}
var Ji = mg, bg = Ji, _g = $r, wg = te;
function vg(r) {
  return bg(r, wg, _g);
}
var Vi = vg, $g = Ji, Cg = Ui, Tg = ee;
function Og(r) {
  return $g(r, Tg, Cg);
}
var Gi = Og, Ag = X, Eg = B, Sg = Ag(Eg, "DataView"), Ig = Sg, xg = X, Pg = B, Ng = xg(Pg, "Promise"), jg = Ng, Bg = X, qg = B, kg = Bg(qg, "Set"), Rg = kg, Mg = X, Lg = B, Fg = Mg(Lg, "WeakMap"), Hg = Fg, Vt = Ig, Gt = ir, Kt = jg, zt = Rg, Yt = Hg, Ki = Y, we = hi, bn = "[object Map]", Qg = "[object Object]", _n = "[object Promise]", wn = "[object Set]", vn = "[object WeakMap]", $n = "[object DataView]", Wg = we(Vt), Dg = we(Gt), Ug = we(Kt), Jg = we(zt), Vg = we(Yt), G = Ki;
(Vt && G(new Vt(new ArrayBuffer(1))) != $n || Gt && G(new Gt()) != bn || Kt && G(Kt.resolve()) != _n || zt && G(new zt()) != wn || Yt && G(new Yt()) != vn) && (G = function(r) {
  var e = Ki(r), t = e == Qg ? r.constructor : void 0, n = t ? we(t) : "";
  if (n)
    switch (n) {
      case Wg:
        return $n;
      case Dg:
        return bn;
      case Ug:
        return _n;
      case Jg:
        return wn;
      case Vg:
        return vn;
    }
  return e;
});
var ve = G, Gg = Object.prototype, Kg = Gg.hasOwnProperty;
function zg(r) {
  var e = r.length, t = new r.constructor(e);
  return e && typeof r[0] == "string" && Kg.call(r, "index") && (t.index = r.index, t.input = r.input), t;
}
var Yg = zg, Xg = or;
function Zg(r, e) {
  var t = e ? Xg(r.buffer) : r.buffer;
  return new r.constructor(t, r.byteOffset, r.byteLength);
}
var ey = Zg, ty = /\w*$/;
function ry(r) {
  var e = new r.constructor(r.source, ty.exec(r));
  return e.lastIndex = r.lastIndex, e;
}
var ny = ry, Cn = z, Tn = Cn ? Cn.prototype : void 0, On = Tn ? Tn.valueOf : void 0;
function iy(r) {
  return On ? Object(On.call(r)) : {};
}
var sy = iy, oy = or, ay = ey, uy = ny, ly = sy, cy = mi, hy = "[object Boolean]", dy = "[object Date]", fy = "[object Map]", py = "[object Number]", gy = "[object RegExp]", yy = "[object Set]", my = "[object String]", by = "[object Symbol]", _y = "[object ArrayBuffer]", wy = "[object DataView]", vy = "[object Float32Array]", $y = "[object Float64Array]", Cy = "[object Int8Array]", Ty = "[object Int16Array]", Oy = "[object Int32Array]", Ay = "[object Uint8Array]", Ey = "[object Uint8ClampedArray]", Sy = "[object Uint16Array]", Iy = "[object Uint32Array]";
function xy(r, e, t) {
  var n = r.constructor;
  switch (e) {
    case _y:
      return oy(r);
    case hy:
    case dy:
      return new n(+r);
    case wy:
      return ay(r, t);
    case vy:
    case $y:
    case Cy:
    case Ty:
    case Oy:
    case Ay:
    case Ey:
    case Sy:
    case Iy:
      return cy(r, t);
    case fy:
      return new n();
    case py:
    case my:
      return new n(r);
    case gy:
      return uy(r);
    case yy:
      return new n();
    case by:
      return ly(r);
  }
}
var Py = xy, Ny = ve, jy = q, By = "[object Map]";
function qy(r) {
  return jy(r) && Ny(r) == By;
}
var ky = qy, Ry = ky, My = lr, An = cr, En = An && An.isMap, Ly = En ? My(En) : Ry, Fy = Ly, Hy = ve, Qy = q, Wy = "[object Set]";
function Dy(r) {
  return Qy(r) && Hy(r) == Wy;
}
var Uy = Dy, Jy = Uy, Vy = lr, Sn = cr, In = Sn && Sn.isSet, Gy = In ? Vy(In) : Jy, Ky = Gy, zy = ht, Yy = vr, Xy = pt, Zy = Wp, em = Vp, tm = gi, rm = ar, nm = ig, im = pg, sm = Vi, om = Gi, am = ve, um = Yg, lm = Py, cm = wi, hm = A, dm = me, fm = Fy, pm = P, gm = Ky, ym = te, mm = ee, bm = 1, _m = 2, wm = 4, zi = "[object Arguments]", vm = "[object Array]", $m = "[object Boolean]", Cm = "[object Date]", Tm = "[object Error]", Yi = "[object Function]", Om = "[object GeneratorFunction]", Am = "[object Map]", Em = "[object Number]", Xi = "[object Object]", Sm = "[object RegExp]", Im = "[object Set]", xm = "[object String]", Pm = "[object Symbol]", Nm = "[object WeakMap]", jm = "[object ArrayBuffer]", Bm = "[object DataView]", qm = "[object Float32Array]", km = "[object Float64Array]", Rm = "[object Int8Array]", Mm = "[object Int16Array]", Lm = "[object Int32Array]", Fm = "[object Uint8Array]", Hm = "[object Uint8ClampedArray]", Qm = "[object Uint16Array]", Wm = "[object Uint32Array]", w = {};
w[zi] = w[vm] = w[jm] = w[Bm] = w[$m] = w[Cm] = w[qm] = w[km] = w[Rm] = w[Mm] = w[Lm] = w[Am] = w[Em] = w[Xi] = w[Sm] = w[Im] = w[xm] = w[Pm] = w[Fm] = w[Hm] = w[Qm] = w[Wm] = !0;
w[Tm] = w[Yi] = w[Nm] = !1;
function Ye(r, e, t, n, i, s) {
  var o, a = e & bm, u = e & _m, c = e & wm;
  if (t && (o = i ? t(r, n, i, s) : t(r)), o !== void 0)
    return o;
  if (!pm(r))
    return r;
  var l = hm(r);
  if (l) {
    if (o = um(r), !a)
      return rm(r, o);
  } else {
    var h = am(r), d = h == Yi || h == Om;
    if (dm(r))
      return tm(r, a);
    if (h == Xi || h == zi || d && !i) {
      if (o = u || d ? {} : cm(r), !a)
        return u ? im(r, em(o, r)) : nm(r, Zy(o, r));
    } else {
      if (!w[h])
        return i ? r : {};
      o = lm(r, h, a);
    }
  }
  s || (s = new zy());
  var _ = s.get(r);
  if (_)
    return _;
  s.set(r, o), gm(r) ? r.forEach(function(b) {
    o.add(Ye(b, e, t, b, r, s));
  }) : fm(r) && r.forEach(function(b, v) {
    o.set(v, Ye(b, e, t, v, r, s));
  });
  var m = c ? u ? om : sm : u ? mm : ym, g = l ? void 0 : m(r);
  return Yy(g || r, function(b, v) {
    g && (v = b, b = r[v]), Xy(o, v, Ye(b, e, t, v, r, s));
  }), o;
}
var Zi = Ye, Dm = Zi, Um = 1, Jm = 4;
function Vm(r) {
  return Dm(r, Um | Jm);
}
var Gm = Vm, Km = Ai, zm = de, Ym = hr, Xm = ee, es = Object.prototype, Zm = es.hasOwnProperty, eb = Km(function(r, e) {
  r = Object(r);
  var t = -1, n = e.length, i = n > 2 ? e[2] : void 0;
  for (i && Ym(e[0], e[1], i) && (n = 1); ++t < n; )
    for (var s = e[t], o = Xm(s), a = -1, u = o.length; ++a < u; ) {
      var c = o[a], l = r[c];
      (l === void 0 || zm(l, es[c]) && !Zm.call(r, c)) && (r[c] = s[c]);
    }
  return r;
}), tb = eb;
function rb(r) {
  r.client.emit("start", r.builder), r.builder.emit("start", r.builder);
  const e = r.builder.toSQL();
  return r.builder._debug && r.client.logger.debug(e), Array.isArray(e) ? r.queryArray(e) : r.query(e);
}
function nb(r, e) {
  try {
    const t = r.builder.toSQL();
    if (Array.isArray(t) && e.hasHandler)
      throw new Error(
        "The stream may only be used with a single query statement."
      );
    return r.client.stream(
      r.connection,
      t,
      e.stream,
      e.options
    );
  } catch (t) {
    throw e.stream.emit("error", t), t;
  }
}
var ib = {
  ensureConnectionCallback: rb,
  ensureConnectionStreamCallback: nb
};
const { KnexTimeoutError: xn } = _e, { timeout: sb } = _e, {
  ensureConnectionCallback: ob,
  ensureConnectionStreamCallback: ab
} = ib;
let jt, ub = class ts {
  constructor(e, t) {
    this.client = e, this.builder = t, this.queries = [], this.connection = void 0;
  }
  // "Run" the target, calling "toSQL" on the builder, returning
  // an object or array of queries to run, each of which are run on
  // a single connection.
  async run() {
    const e = this;
    try {
      const t = await this.ensureConnection(ob);
      return e.builder.emit("end"), t;
    } catch (t) {
      throw e.builder._events && e.builder._events.error && e.builder.emit("error", t), t;
    }
  }
  // Stream the result set, by passing through to the dialect's streaming
  // capabilities. If the options are
  stream(e, t) {
    const n = typeof e == "function" && arguments.length === 1, i = n ? {} : e, s = n ? e : t, o = typeof s == "function";
    jt = jt || E.Transform;
    const a = this.builder.queryContext(), u = new jt({
      objectMode: !0,
      transform: (l, h, d) => {
        d(null, this.client.postProcessResponse(l, a));
      }
    });
    u.on("close", () => {
      this.client.releaseConnection(this.connection);
    });
    const c = this.ensureConnection(
      ab,
      {
        options: i,
        hasHandler: o,
        stream: u
      }
    ).catch((l) => {
      this.connection || u.emit("error", l);
    });
    return o ? (s(u), c) : u;
  }
  // Allow you to pipe the stream to a writable stream.
  pipe(e, t) {
    return this.stream(t).pipe(e);
  }
  // "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
  // to run in sequence, and on the same connection, especially helpful when schema building
  // and dealing with foreign key constraints, etc.
  async query(e) {
    const { __knexUid: t, __knexTxId: n } = this.connection;
    this.builder.emit("query", Object.assign({ __knexUid: t, __knexTxId: n }, e));
    const i = this, s = this.builder.queryContext();
    e !== null && typeof e == "object" && (e.queryContext = s);
    let o = this.client.query(this.connection, e);
    return e.timeout && (o = sb(o, e.timeout)), o.then((a) => this.client.processResponse(a, i)).then((a) => {
      const u = this.client.postProcessResponse(
        a,
        s
      );
      return this.builder.emit(
        "query-response",
        u,
        Object.assign({ __knexUid: t, __knexTxId: n }, e),
        this.builder
      ), this.client.emit(
        "query-response",
        u,
        Object.assign({ __knexUid: t, __knexTxId: n }, e),
        this.builder
      ), u;
    }).catch((a) => {
      if (!(a instanceof xn))
        return Promise.reject(a);
      const { timeout: u, sql: c, bindings: l } = e;
      let h;
      return e.cancelOnTimeout ? h = this.client.cancelQuery(this.connection) : (this.connection.__knex__disposed = a, h = Promise.resolve()), h.catch((d) => {
        throw this.connection.__knex__disposed = a, Object.assign(d, {
          message: `After query timeout of ${u}ms exceeded, cancelling of query failed.`,
          sql: c,
          bindings: l,
          timeout: u
        });
      }).then(() => {
        throw Object.assign(a, {
          message: `Defined query timeout of ${u}ms exceeded when running query.`,
          sql: c,
          bindings: l,
          timeout: u
        });
      });
    }).catch((a) => {
      throw this.builder.emit(
        "query-error",
        a,
        Object.assign({ __knexUid: t, __knexTxId: n, queryContext: s }, e)
      ), a;
    });
  }
  // In the case of the "schema builder" we call `queryArray`, which runs each
  // of the queries in sequence.
  async queryArray(e) {
    if (e.length === 1) {
      const n = e[0];
      if (!n.statementsProducer)
        return this.query(n);
      const i = await n.statementsProducer(
        void 0,
        this.connection
      ), s = i.sql.map((c) => ({
        sql: c,
        bindings: n.bindings
      })), o = i.pre.map((c) => ({
        sql: c,
        bindings: n.bindings
      })), a = i.post.map((c) => ({
        sql: c,
        bindings: n.bindings
      }));
      let u = [];
      await this.queryArray(o);
      try {
        await this.client.transaction(
          async (c) => {
            const l = new ts(c.client, this.builder);
            if (l.connection = this.connection, u = await l.queryArray(s), i.check && (await c.raw(i.check)).length > 0)
              throw new Error("FOREIGN KEY constraint failed");
          },
          { connection: this.connection }
        );
      } finally {
        await this.queryArray(a);
      }
      return u;
    }
    const t = [];
    for (const n of e)
      t.push(await this.queryArray([n]));
    return t;
  }
  // Check whether there's a transaction flag, and that it has a connection.
  async ensureConnection(e, t) {
    if (this.builder._connection && (this.connection = this.builder._connection), this.connection)
      return e(this, t);
    let n;
    try {
      n = await this.client.acquireConnection();
    } catch (i) {
      if (!(i instanceof xn))
        return Promise.reject(i);
      throw this.builder && (i.sql = this.builder.sql, i.bindings = this.builder.bindings), i;
    }
    try {
      return this.connection = n, await e(this, t);
    } finally {
      await this.client.releaseConnection(n);
    }
  }
};
var lb = ub;
const cb = he("knex:query"), hb = he("knex:bindings"), db = (r, e) => cb(r.replace(/%/g, "%%"), e), { isString: fb } = j;
function rs(r, e, t, n) {
  e = e == null ? [] : [].concat(e);
  let i = 0;
  return r.replace(/\\?\?/g, (s) => {
    if (s === "\\?")
      return "?";
    if (i === e.length)
      return s;
    const o = e[i++];
    return n._escapeBinding(o, { timeZone: t });
  });
}
function pb(r, e, t) {
  const n = fb(e) ? { sql: e } : e;
  n.bindings = t.prepBindings(n.bindings), n.sql = t.positionBindings(n.sql);
  const { __knexUid: i, __knexTxId: s } = r;
  return t.emit("query", Object.assign({ __knexUid: i, __knexTxId: s }, n)), db(n.sql, s), hb(n.bindings, s), n;
}
function gb(r, e, t) {
  return t._query(r, e).catch((n) => {
    throw t.config && t.config.compileSqlOnError === !1 ? n.message = e.sql + " - " + n.message : n.message = rs(e.sql, e.bindings, void 0, t) + " - " + n.message, t.emit(
      "query-error",
      n,
      Object.assign(
        { __knexUid: r.__knexUid, __knexTxId: r.__knexUid },
        e
      )
    ), n;
  });
}
var ns = {
  enrichQueryObject: pb,
  executeQuery: gb,
  formatQuery: rs
}, yb = pt, mb = Z, bb = dr, _b = Q, wb = je, vb = te, $b = Object.prototype, Cb = $b.hasOwnProperty, Tb = bb(function(r, e) {
  if (wb(e) || _b(e)) {
    mb(e, vb(e), r);
    return;
  }
  for (var t in e)
    Cb.call(e, t) && yb(r, t, e[t]);
}), re = Tb, Ob = Zi, Ab = 4;
function Eb(r) {
  return Ob(r, Ab);
}
var is = Eb, Sb = pi, Ib = te;
function xb(r, e) {
  return r && Sb(r, e, Ib);
}
var ss = xb, Pb = Q;
function Nb(r, e) {
  return function(t, n) {
    if (t == null)
      return t;
    if (!Pb(t))
      return r(t, n);
    for (var i = t.length, s = e ? i : -1, o = Object(t); (e ? s-- : ++s < i) && n(o[s], s, o) !== !1; )
      ;
    return t;
  };
}
var jb = Nb, Bb = ss, qb = jb, kb = qb(Bb), ke = kb, Rb = yt;
function Mb(r) {
  return typeof r == "function" ? r : Rb;
}
var Lb = Mb, Fb = vr, Hb = ke, Qb = Lb, Wb = A;
function Db(r, e) {
  var t = Wb(r) ? Fb : Hb;
  return t(r, Qb(e));
}
var Ub = Db, os = Ub, Jb = Qi, Vb = ve, Gb = Be, Kb = A, zb = Q, Yb = me, Xb = je, Zb = be, e_ = "[object Map]", t_ = "[object Set]", r_ = Object.prototype, n_ = r_.hasOwnProperty;
function i_(r) {
  if (r == null)
    return !0;
  if (zb(r) && (Kb(r) || typeof r == "string" || typeof r.splice == "function" || Yb(r) || Zb(r) || Gb(r)))
    return !r.length;
  var e = Vb(r);
  if (e == e_ || e == t_)
    return !r.size;
  if (Xb(r))
    return !Jb(r).length;
  for (var t in r)
    if (n_.call(r, t))
      return !1;
  return !0;
}
var bt = i_;
function s_(r) {
  var e = r == null ? 0 : r.length;
  return e ? r[e - 1] : void 0;
}
var o_ = s_, a_ = ke;
function u_(r, e) {
  var t = [];
  return a_(r, function(n, i, s) {
    e(n, i, s) && t.push(n);
  }), t;
}
var l_ = u_, c_ = "__lodash_hash_undefined__";
function h_(r) {
  return this.__data__.set(r, c_), this;
}
var d_ = h_;
function f_(r) {
  return this.__data__.has(r);
}
var p_ = f_, g_ = sr, y_ = d_, m_ = p_;
function tt(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.__data__ = new g_(); ++e < t; )
    this.add(r[e]);
}
tt.prototype.add = tt.prototype.push = y_;
tt.prototype.has = m_;
var b_ = tt;
function __(r, e) {
  for (var t = -1, n = r == null ? 0 : r.length; ++t < n; )
    if (e(r[t], t, r))
      return !0;
  return !1;
}
var w_ = __;
function v_(r, e) {
  return r.has(e);
}
var $_ = v_, C_ = b_, T_ = w_, O_ = $_, A_ = 1, E_ = 2;
function S_(r, e, t, n, i, s) {
  var o = t & A_, a = r.length, u = e.length;
  if (a != u && !(o && u > a))
    return !1;
  var c = s.get(r), l = s.get(e);
  if (c && l)
    return c == e && l == r;
  var h = -1, d = !0, _ = t & E_ ? new C_() : void 0;
  for (s.set(r, e), s.set(e, r); ++h < a; ) {
    var m = r[h], g = e[h];
    if (n)
      var b = o ? n(g, m, h, e, r, s) : n(m, g, h, r, e, s);
    if (b !== void 0) {
      if (b)
        continue;
      d = !1;
      break;
    }
    if (_) {
      if (!T_(e, function(v, x) {
        if (!O_(_, x) && (m === v || i(m, v, t, n, s)))
          return _.push(x);
      })) {
        d = !1;
        break;
      }
    } else if (!(m === g || i(m, g, t, n, s))) {
      d = !1;
      break;
    }
  }
  return s.delete(r), s.delete(e), d;
}
var as = S_;
function I_(r) {
  var e = -1, t = Array(r.size);
  return r.forEach(function(n, i) {
    t[++e] = [i, n];
  }), t;
}
var us = I_;
function x_(r) {
  var e = -1, t = Array(r.size);
  return r.forEach(function(n) {
    t[++e] = n;
  }), t;
}
var ls = x_, Pn = z, Nn = yi, P_ = de, N_ = as, j_ = us, B_ = ls, q_ = 1, k_ = 2, R_ = "[object Boolean]", M_ = "[object Date]", L_ = "[object Error]", F_ = "[object Map]", H_ = "[object Number]", Q_ = "[object RegExp]", W_ = "[object Set]", D_ = "[object String]", U_ = "[object Symbol]", J_ = "[object ArrayBuffer]", V_ = "[object DataView]", jn = Pn ? Pn.prototype : void 0, Bt = jn ? jn.valueOf : void 0;
function G_(r, e, t, n, i, s, o) {
  switch (t) {
    case V_:
      if (r.byteLength != e.byteLength || r.byteOffset != e.byteOffset)
        return !1;
      r = r.buffer, e = e.buffer;
    case J_:
      return !(r.byteLength != e.byteLength || !s(new Nn(r), new Nn(e)));
    case R_:
    case M_:
    case H_:
      return P_(+r, +e);
    case L_:
      return r.name == e.name && r.message == e.message;
    case Q_:
    case D_:
      return r == e + "";
    case F_:
      var a = j_;
    case W_:
      var u = n & q_;
      if (a || (a = B_), r.size != e.size && !u)
        return !1;
      var c = o.get(r);
      if (c)
        return c == e;
      n |= k_, o.set(r, e);
      var l = N_(a(r), a(e), n, i, s, o);
      return o.delete(r), l;
    case U_:
      if (Bt)
        return Bt.call(r) == Bt.call(e);
  }
  return !1;
}
var K_ = G_, Bn = Vi, z_ = 1, Y_ = Object.prototype, X_ = Y_.hasOwnProperty;
function Z_(r, e, t, n, i, s) {
  var o = t & z_, a = Bn(r), u = a.length, c = Bn(e), l = c.length;
  if (u != l && !o)
    return !1;
  for (var h = u; h--; ) {
    var d = a[h];
    if (!(o ? d in e : X_.call(e, d)))
      return !1;
  }
  var _ = s.get(r), m = s.get(e);
  if (_ && m)
    return _ == e && m == r;
  var g = !0;
  s.set(r, e), s.set(e, r);
  for (var b = o; ++h < u; ) {
    d = a[h];
    var v = r[d], x = e[d];
    if (n)
      var ie = o ? n(x, v, d, e, r, s) : n(v, x, d, r, e, s);
    if (!(ie === void 0 ? v === x || i(v, x, t, n, s) : ie)) {
      g = !1;
      break;
    }
    b || (b = d == "constructor");
  }
  if (g && !b) {
    var M = r.constructor, Ce = e.constructor;
    M != Ce && "constructor" in r && "constructor" in e && !(typeof M == "function" && M instanceof M && typeof Ce == "function" && Ce instanceof Ce) && (g = !1);
  }
  return s.delete(r), s.delete(e), g;
}
var ew = Z_, qt = ht, tw = as, rw = K_, nw = ew, qn = ve, kn = A, Rn = me, iw = be, sw = 1, Mn = "[object Arguments]", Ln = "[object Array]", De = "[object Object]", ow = Object.prototype, Fn = ow.hasOwnProperty;
function aw(r, e, t, n, i, s) {
  var o = kn(r), a = kn(e), u = o ? Ln : qn(r), c = a ? Ln : qn(e);
  u = u == Mn ? De : u, c = c == Mn ? De : c;
  var l = u == De, h = c == De, d = u == c;
  if (d && Rn(r)) {
    if (!Rn(e))
      return !1;
    o = !0, l = !1;
  }
  if (d && !l)
    return s || (s = new qt()), o || iw(r) ? tw(r, e, t, n, i, s) : rw(r, e, u, t, n, i, s);
  if (!(t & sw)) {
    var _ = l && Fn.call(r, "__wrapped__"), m = h && Fn.call(e, "__wrapped__");
    if (_ || m) {
      var g = _ ? r.value() : r, b = m ? e.value() : e;
      return s || (s = new qt()), i(g, b, t, n, s);
    }
  }
  return d ? (s || (s = new qt()), nw(r, e, t, n, i, s)) : !1;
}
var uw = aw, lw = uw, Hn = q;
function cs(r, e, t, n, i) {
  return r === e ? !0 : r == null || e == null || !Hn(r) && !Hn(e) ? r !== r && e !== e : lw(r, e, t, n, cs, i);
}
var hs = cs, cw = ht, hw = hs, dw = 1, fw = 2;
function pw(r, e, t, n) {
  var i = t.length, s = i, o = !n;
  if (r == null)
    return !s;
  for (r = Object(r); i--; ) {
    var a = t[i];
    if (o && a[2] ? a[1] !== r[a[0]] : !(a[0] in r))
      return !1;
  }
  for (; ++i < s; ) {
    a = t[i];
    var u = a[0], c = r[u], l = a[1];
    if (o && a[2]) {
      if (c === void 0 && !(u in r))
        return !1;
    } else {
      var h = new cw();
      if (n)
        var d = n(c, l, u, r, e, h);
      if (!(d === void 0 ? hw(l, c, dw | fw, n, h) : d))
        return !1;
    }
  }
  return !0;
}
var gw = pw, yw = P;
function mw(r) {
  return r === r && !yw(r);
}
var ds = mw, bw = ds, _w = te;
function ww(r) {
  for (var e = _w(r), t = e.length; t--; ) {
    var n = e[t], i = r[n];
    e[t] = [n, i, bw(i)];
  }
  return e;
}
var vw = ww;
function $w(r, e) {
  return function(t) {
    return t == null ? !1 : t[r] === e && (e !== void 0 || r in Object(t));
  };
}
var fs = $w, Cw = gw, Tw = vw, Ow = fs;
function Aw(r) {
  var e = Tw(r);
  return e.length == 1 && e[0][2] ? Ow(e[0][0], e[0][1]) : function(t) {
    return t === r || Cw(t, r, e);
  };
}
var Ew = Aw, Sw = A, Iw = st, xw = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Pw = /^\w*$/;
function Nw(r, e) {
  if (Sw(r))
    return !1;
  var t = typeof r;
  return t == "number" || t == "symbol" || t == "boolean" || r == null || Iw(r) ? !0 : Pw.test(r) || !xw.test(r) || e != null && r in Object(e);
}
var Cr = Nw, ps = sr, jw = "Expected a function";
function Tr(r, e) {
  if (typeof r != "function" || e != null && typeof e != "function")
    throw new TypeError(jw);
  var t = function() {
    var n = arguments, i = e ? e.apply(this, n) : n[0], s = t.cache;
    if (s.has(i))
      return s.get(i);
    var o = r.apply(this, n);
    return t.cache = s.set(i, o) || s, o;
  };
  return t.cache = new (Tr.Cache || ps)(), t;
}
Tr.Cache = ps;
var Bw = Tr, qw = Bw, kw = 500;
function Rw(r) {
  var e = qw(r, function(n) {
    return t.size === kw && t.clear(), n;
  }), t = e.cache;
  return e;
}
var Mw = Rw, Lw = Mw, Fw = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Hw = /\\(\\)?/g, Qw = Lw(function(r) {
  var e = [];
  return r.charCodeAt(0) === 46 && e.push(""), r.replace(Fw, function(t, n, i, s) {
    e.push(i ? s.replace(Hw, "$1") : n || t);
  }), e;
}), Ww = Qw, Dw = A, Uw = Cr, Jw = Ww, Vw = li;
function Gw(r, e) {
  return Dw(r) ? r : Uw(r, e) ? [r] : Jw(Vw(r));
}
var _t = Gw, Kw = st, zw = 1 / 0;
function Yw(r) {
  if (typeof r == "string" || Kw(r))
    return r;
  var e = r + "";
  return e == "0" && 1 / r == -zw ? "-0" : e;
}
var Re = Yw, Xw = _t, Zw = Re;
function ev(r, e) {
  e = Xw(e, r);
  for (var t = 0, n = e.length; r != null && t < n; )
    r = r[Zw(e[t++])];
  return t && t == n ? r : void 0;
}
var Or = ev, tv = Or;
function rv(r, e, t) {
  var n = r == null ? void 0 : tv(r, e);
  return n === void 0 ? t : n;
}
var nv = rv;
function iv(r, e) {
  return r != null && e in Object(r);
}
var sv = iv, ov = _t, av = Be, uv = A, lv = gt, cv = ur, hv = Re;
function dv(r, e, t) {
  e = ov(e, r);
  for (var n = -1, i = e.length, s = !1; ++n < i; ) {
    var o = hv(e[n]);
    if (!(s = r != null && t(r, o)))
      break;
    r = r[o];
  }
  return s || ++n != i ? s : (i = r == null ? 0 : r.length, !!i && cv(i) && lv(o, i) && (uv(r) || av(r)));
}
var gs = dv, fv = sv, pv = gs;
function gv(r, e) {
  return r != null && pv(r, e, fv);
}
var yv = gv, mv = hs, bv = nv, _v = yv, wv = Cr, vv = ds, $v = fs, Cv = Re, Tv = 1, Ov = 2;
function Av(r, e) {
  return wv(r) && vv(e) ? $v(Cv(r), e) : function(t) {
    var n = bv(t, r);
    return n === void 0 && n === e ? _v(t, r) : mv(e, n, Tv | Ov);
  };
}
var Ev = Av;
function Sv(r) {
  return function(e) {
    return e == null ? void 0 : e[r];
  };
}
var Iv = Sv, xv = Or;
function Pv(r) {
  return function(e) {
    return xv(e, r);
  };
}
var Nv = Pv, jv = Iv, Bv = Nv, qv = Cr, kv = Re;
function Rv(r) {
  return qv(r) ? jv(kv(r)) : Bv(r);
}
var Mv = Rv, Lv = Ew, Fv = Ev, Hv = yt, Qv = A, Wv = Mv;
function Dv(r) {
  return typeof r == "function" ? r : r == null ? Hv : typeof r == "object" ? Qv(r) ? Fv(r[0], r[1]) : Lv(r) : Wv(r);
}
var ne = Dv, Uv = "Expected a function";
function Jv(r) {
  if (typeof r != "function")
    throw new TypeError(Uv);
  return function() {
    var e = arguments;
    switch (e.length) {
      case 0:
        return !r.call(this);
      case 1:
        return !r.call(this, e[0]);
      case 2:
        return !r.call(this, e[0], e[1]);
      case 3:
        return !r.call(this, e[0], e[1], e[2]);
    }
    return !r.apply(this, e);
  };
}
var ys = Jv, Vv = Wi, Gv = l_, Kv = ne, zv = A, Yv = ys;
function Xv(r, e) {
  var t = zv(r) ? Vv : Gv;
  return t(r, Yv(Kv(e)));
}
var Zv = Xv, e$ = Ei;
function t$(r) {
  var e = r == null ? 0 : r.length;
  return e ? e$(r, 1, e) : [];
}
var wt = t$, r$ = Y, n$ = A, i$ = q, s$ = "[object String]";
function o$(r) {
  return typeof r == "string" || !n$(r) && i$(r) && r$(r) == s$;
}
var a$ = o$;
function u$(r) {
  for (var e, t = []; !(e = r.next()).done; )
    t.push(e.value);
  return t;
}
var l$ = u$;
function c$(r) {
  return r.split("");
}
var h$ = c$, d$ = "\\ud800-\\udfff", f$ = "\\u0300-\\u036f", p$ = "\\ufe20-\\ufe2f", g$ = "\\u20d0-\\u20ff", y$ = f$ + p$ + g$, m$ = "\\ufe0e\\ufe0f", b$ = "\\u200d", _$ = RegExp("[" + b$ + d$ + y$ + m$ + "]");
function w$(r) {
  return _$.test(r);
}
var v$ = w$, ms = "\\ud800-\\udfff", $$ = "\\u0300-\\u036f", C$ = "\\ufe20-\\ufe2f", T$ = "\\u20d0-\\u20ff", O$ = $$ + C$ + T$, A$ = "\\ufe0e\\ufe0f", E$ = "[" + ms + "]", Xt = "[" + O$ + "]", Zt = "\\ud83c[\\udffb-\\udfff]", S$ = "(?:" + Xt + "|" + Zt + ")", bs = "[^" + ms + "]", _s = "(?:\\ud83c[\\udde6-\\uddff]){2}", ws = "[\\ud800-\\udbff][\\udc00-\\udfff]", I$ = "\\u200d", vs = S$ + "?", $s = "[" + A$ + "]?", x$ = "(?:" + I$ + "(?:" + [bs, _s, ws].join("|") + ")" + $s + vs + ")*", P$ = $s + vs + x$, N$ = "(?:" + [bs + Xt + "?", Xt, _s, ws, E$].join("|") + ")", j$ = RegExp(Zt + "(?=" + Zt + ")|" + N$ + P$, "g");
function B$(r) {
  return r.match(j$) || [];
}
var q$ = B$, k$ = h$, R$ = v$, M$ = q$;
function L$(r) {
  return R$(r) ? M$(r) : k$(r);
}
var F$ = L$, H$ = it;
function Q$(r, e) {
  return H$(e, function(t) {
    return r[t];
  });
}
var W$ = Q$, D$ = W$, U$ = te;
function J$(r) {
  return r == null ? [] : D$(r, U$(r));
}
var V$ = J$, Qn = z, G$ = ar, K$ = ve, z$ = Q, Y$ = a$, X$ = l$, Z$ = us, eC = ls, tC = F$, rC = V$, nC = "[object Map]", iC = "[object Set]", kt = Qn ? Qn.iterator : void 0;
function sC(r) {
  if (!r)
    return [];
  if (z$(r))
    return Y$(r) ? tC(r) : G$(r);
  if (kt && r[kt])
    return X$(r[kt]());
  var e = K$(r), t = e == nC ? Z$ : e == iC ? eC : rC;
  return t(r);
}
var vt = sC;
const Cs = Object.freeze({
  pg: "postgres",
  postgresql: "postgres",
  sqlite: "sqlite3"
}), oC = Object.freeze(
  [
    "mssql",
    "mysql",
    "mysql2",
    "oracledb",
    "postgres",
    "pgnative",
    "redshift",
    "sqlite3",
    "cockroachdb",
    "better-sqlite3"
  ].concat(Object.keys(Cs))
), aC = Object.freeze({
  MsSQL: "mssql",
  MySQL: "mysql",
  MySQL2: "mysql2",
  Oracle: "oracledb",
  PostgreSQL: "pg",
  PgNative: "pgnative",
  Redshift: "pg-redshift",
  SQLite: "sqlite3",
  CockroachDB: "cockroachdb",
  BetterSQLite3: "better-sqlite3"
}), uC = Object.freeze([
  "maxWaitingClients",
  "testOnBorrow",
  "fifo",
  "priorityRange",
  "autostart",
  "evictionRunIntervalMillis",
  "numTestsPerRun",
  "softIdleTimeoutMillis",
  "Promise"
]), lC = /,[\s](?![^(]*\))/g;
var Ts = {
  CLIENT_ALIASES: Cs,
  SUPPORTED_CLIENTS: oC,
  POOL_CONFIG_OPTIONS: uC,
  COMMA_NO_PAREN_REGEX: lC,
  DRIVER_NAMES: aC
};
const Os = qe, cC = be, { CLIENT_ALIASES: hC } = Ts, { isFunction: dC } = j;
function fC(...r) {
  return Array.isArray(r[0]) ? r[0] : r;
}
function Pe(r) {
  let e = !1;
  if (cC(r))
    return !1;
  if (r && dC(r.toSQL))
    return e;
  if (Array.isArray(r))
    for (let t = 0; t < r.length && !e; t++)
      e = Pe(r[t]);
  else
    Os(r) ? Object.keys(r).forEach((t) => {
      e || (e = Pe(r[t]));
    }) : e = r === void 0;
  return e;
}
function pC(r) {
  const e = [];
  return Array.isArray(r) ? r.forEach((t, n) => {
    Pe(t) && e.push(n);
  }) : Os(r) ? Object.keys(r).forEach((t) => {
    Pe(r[t]) && e.push(t);
  }) : e.push(0), e;
}
function gC(r) {
  r.prototype.queryContext = function(e) {
    return e === void 0 ? this._queryContext : (this._queryContext = e, this);
  };
}
function yC(r) {
  return hC[r] || r;
}
function mC(r, e) {
  if (r == null)
    return e;
  const t = parseInt(r, 10);
  return isNaN(t) ? e : t;
}
var k = {
  addQueryContext: gC,
  containsUndefined: Pe,
  getUndefinedIndices: pC,
  normalizeArr: fC,
  resolveClientNameWithAliases: yC,
  toNumber: mC
};
const Wn = E;
function Dn(r, e, t, n, i) {
  if (typeof t == "function")
    return {
      type: "onWrapped",
      value: t,
      bool: e
    };
  switch (arguments.length) {
    case 3:
      return { type: "onRaw", value: t, bool: e };
    case 4:
      return {
        type: r,
        column: t,
        operator: "=",
        value: n,
        bool: e
      };
    default:
      return {
        type: r,
        column: t,
        operator: n,
        value: i,
        bool: e
      };
  }
}
let T = class {
  constructor(e, t, n) {
    this.schema = n, this.table = e, this.joinType = t, this.and = this, this.clauses = [];
  }
  get or() {
    return this._bool("or");
  }
  // Adds an "on" clause to the current join object.
  on(e) {
    if (typeof e == "object" && typeof e.toSQL != "function") {
      const n = Object.keys(e);
      let i = -1;
      const s = this._bool() === "or" ? "orOn" : "on";
      for (; ++i < n.length; )
        this[s](n[i], e[n[i]]);
      return this;
    }
    const t = Dn("onBasic", this._bool(), ...arguments);
    return t && this.clauses.push(t), this;
  }
  // Adds an "or on" clause to the current join object.
  orOn(e, t, n) {
    return this._bool("or").on.apply(this, arguments);
  }
  onJsonPathEquals(e, t, n, i) {
    return this.clauses.push({
      type: "onJsonPathEquals",
      columnFirst: e,
      jsonPathFirst: t,
      columnSecond: n,
      jsonPathSecond: i,
      bool: this._bool(),
      not: this._not()
    }), this;
  }
  orOnJsonPathEquals(e, t, n, i) {
    return this._bool("or").onJsonPathEquals.apply(this, arguments);
  }
  // Adds a "using" clause to the current join.
  using(e) {
    return this.clauses.push({ type: "onUsing", column: e, bool: this._bool() });
  }
  onVal(e) {
    if (typeof e == "object" && typeof e.toSQL != "function") {
      const n = Object.keys(e);
      let i = -1;
      const s = this._bool() === "or" ? "orOnVal" : "onVal";
      for (; ++i < n.length; )
        this[s](n[i], e[n[i]]);
      return this;
    }
    const t = Dn("onVal", this._bool(), ...arguments);
    return t && this.clauses.push(t), this;
  }
  andOnVal() {
    return this.onVal(...arguments);
  }
  orOnVal() {
    return this._bool("or").onVal(...arguments);
  }
  onBetween(e, t) {
    return Wn(
      Array.isArray(t),
      "The second argument to onBetween must be an array."
    ), Wn(
      t.length === 2,
      "You must specify 2 values for the onBetween clause"
    ), this.clauses.push({
      type: "onBetween",
      column: e,
      value: t,
      bool: this._bool(),
      not: this._not()
    }), this;
  }
  onNotBetween(e, t) {
    return this._not(!0).onBetween(e, t);
  }
  orOnBetween(e, t) {
    return this._bool("or").onBetween(e, t);
  }
  orOnNotBetween(e, t) {
    return this._bool("or")._not(!0).onBetween(e, t);
  }
  onIn(e, t) {
    return Array.isArray(t) && t.length === 0 ? this.on(1, "=", 0) : (this.clauses.push({
      type: "onIn",
      column: e,
      value: t,
      not: this._not(),
      bool: this._bool()
    }), this);
  }
  onNotIn(e, t) {
    return this._not(!0).onIn(e, t);
  }
  orOnIn(e, t) {
    return this._bool("or").onIn(e, t);
  }
  orOnNotIn(e, t) {
    return this._bool("or")._not(!0).onIn(e, t);
  }
  onNull(e) {
    return this.clauses.push({
      type: "onNull",
      column: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  orOnNull(e) {
    return this._bool("or").onNull(e);
  }
  onNotNull(e) {
    return this._not(!0).onNull(e);
  }
  orOnNotNull(e) {
    return this._not(!0)._bool("or").onNull(e);
  }
  onExists(e) {
    return this.clauses.push({
      type: "onExists",
      value: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  orOnExists(e) {
    return this._bool("or").onExists(e);
  }
  onNotExists(e) {
    return this._not(!0).onExists(e);
  }
  orOnNotExists(e) {
    return this._not(!0)._bool("or").onExists(e);
  }
  // Explicitly set the type of join, useful within a function when creating a grouped join.
  type(e) {
    return this.joinType = e, this;
  }
  _bool(e) {
    if (arguments.length === 1)
      return this._boolFlag = e, this;
    const t = this._boolFlag || "and";
    return this._boolFlag = "and", t;
  }
  _not(e) {
    if (arguments.length === 1)
      return this._notFlag = e, this;
    const t = this._notFlag;
    return this._notFlag = !1, t;
  }
};
Object.assign(T.prototype, {
  grouping: "join"
});
T.prototype.andOn = T.prototype.on;
T.prototype.andOnIn = T.prototype.onIn;
T.prototype.andOnNotIn = T.prototype.onNotIn;
T.prototype.andOnNull = T.prototype.onNull;
T.prototype.andOnNotNull = T.prototype.onNotNull;
T.prototype.andOnExists = T.prototype.onExists;
T.prototype.andOnNotExists = T.prototype.onNotExists;
T.prototype.andOnBetween = T.prototype.onBetween;
T.prototype.andOnNotBetween = T.prototype.onNotBetween;
T.prototype.andOnJsonPathEquals = T.prototype.onJsonPathEquals;
var As = T;
const Un = E;
let bC = class {
  constructor(e, t, n, i, s) {
    this.schema = t, this.type = "analytic", this.method = e, this.order = i || [], this.partitions = s || [], this.alias = n, this.and = this, this.grouping = "columns";
  }
  partitionBy(e, t) {
    return Un(
      Array.isArray(e) || typeof e == "string",
      `The argument to an analytic partitionBy function must be either a string
            or an array of string.`
    ), Array.isArray(e) ? this.partitions = this.partitions.concat(e) : this.partitions.push({ column: e, order: t }), this;
  }
  orderBy(e, t) {
    return Un(
      Array.isArray(e) || typeof e == "string",
      `The argument to an analytic orderBy function must be either a string
            or an array of string.`
    ), Array.isArray(e) ? this.order = this.order.concat(e) : this.order.push({ column: e, order: t }), this;
  }
};
var _C = bC, Ar = function(e, t) {
  e.client.config.asyncStackTraces && (e._asyncStack = {
    error: new Error(),
    lines: t
  });
}, wC = {
  lockMode: {
    forShare: "forShare",
    forUpdate: "forUpdate",
    forNoKeyUpdate: "forNoKeyUpdate",
    forKeyShare: "forKeyShare"
  },
  waitMode: {
    skipLocked: "skipLocked",
    noWait: "noWait"
  }
};
const vC = is, $C = bt, { callbackify: CC } = E, TC = Bi, { formatQuery: OC } = ns;
function AC(r) {
  r.prototype.toQuery = function(e) {
    let t = this.toSQL(this._method, e);
    return Array.isArray(t) || (t = [t]), t.length ? t.map((n) => OC(n.sql, n.bindings, e, this.client)).reduce((n, i) => n.concat(n.endsWith(";") ? `
` : `;
`, i)) : "";
  }, r.prototype.then = function() {
    let e = this.client.runner(this).run();
    return this.client.config.asyncStackTraces && (e = e.catch((t) => {
      t.originalStack = t.stack;
      const n = t.stack.split(`
`)[0], { error: i, lines: s } = this._asyncStack, a = i.stack.split(`
`).slice(s);
      throw a.unshift(n), t.stack = a.join(`
`), t;
    })), e.then.apply(e, arguments);
  }, r.prototype.options = function(e) {
    return this._options = this._options || [], this._options.push(vC(e) || {}), this;
  }, r.prototype.connection = function(e) {
    return this._connection = e, this.client.processPassedConnection(e), this;
  }, r.prototype.debug = function(e) {
    return this._debug = arguments.length ? e : !0, this;
  }, r.prototype.transacting = function(e) {
    if (e && e.client && (e.client.transacting ? this.client = e.client : e.client.logger.warn(
      `Invalid transaction value: ${e.client}`
    )), $C(e))
      throw this.client.logger.error(
        "Invalid value on transacting call, potential bug"
      ), Error(
        "Invalid transacting value (null, undefined or empty object)"
      );
    return this;
  }, r.prototype.stream = function(e) {
    return this.client.runner(this).stream(e);
  }, r.prototype.pipe = function(e, t) {
    return this.client.runner(this).pipe(e, t);
  }, r.prototype.asCallback = function(e) {
    const t = this.then();
    return CC(() => t)(e), t;
  }, r.prototype.catch = function(e) {
    return this.then().catch(e);
  }, Object.defineProperty(r.prototype, Symbol.toStringTag, {
    get: () => "object"
  }), TC(r.prototype);
}
var Er = {
  augmentWithBuilderInterface: AC
};
const oe = E, { EventEmitter: EC } = E, SC = re, Ue = is, IC = os, ae = bt, Jn = qe, xC = o_, PC = Zv, NC = wt, Vn = vt, { addQueryContext: jC, normalizeArr: Oe } = k, Rt = As, BC = _C, qC = Ar, {
  isBoolean: Ae,
  isNumber: kC,
  isObject: L,
  isString: Mt,
  isFunction: RC
} = j, { lockMode: D, waitMode: Je } = wC, {
  augmentWithBuilderInterface: MC
} = Er, LC = /* @__PURE__ */ new Set(["pluck", "first", "select"]), FC = /* @__PURE__ */ new Set([
  "with",
  "select",
  "columns",
  "hintComments",
  "where",
  "union",
  "join",
  "group",
  "order",
  "having",
  "limit",
  "offset",
  "counter",
  "counters"
]), HC = /* @__PURE__ */ new Set([
  D.forShare,
  D.forUpdate,
  D.forNoKeyUpdate,
  D.forKeyShare
]);
class f extends EC {
  constructor(e) {
    super(), this.client = e, this.and = this, this._single = {}, this._statements = [], this._method = "select", e.config && (qC(this, 5), this._debug = e.config.debug), this._joinFlag = "inner", this._boolFlag = "and", this._notFlag = !1, this._asColumnFlag = !1;
  }
  toString() {
    return this.toQuery();
  }
  // Convert the current query "toSQL"
  toSQL(e, t) {
    return this.client.queryCompiler(this).toSQL(e || this._method, t);
  }
  // Create a shallow clone of the current query builder.
  clone() {
    const e = new this.constructor(this.client);
    return e._method = this._method, e._single = Ue(this._single), e._statements = Ue(this._statements), e._debug = this._debug, this._options !== void 0 && (e._options = Ue(this._options)), this._queryContext !== void 0 && (e._queryContext = Ue(this._queryContext)), this._connection !== void 0 && (e._connection = this._connection), e;
  }
  timeout(e, { cancel: t } = {}) {
    return kC(e) && e > 0 && (this._timeout = e, t && (this.client.assertCanCancelQuery(), this._cancelOnTimeout = !0)), this;
  }
  // With
  // ------
  isValidStatementArg(e) {
    return typeof e == "function" || e instanceof f || e && e.isRawInstance;
  }
  _validateWithArgs(e, t, n, i) {
    const [s, o] = typeof n > "u" ? [t, void 0] : [n, t];
    if (typeof e != "string")
      throw new Error(`${i}() first argument must be a string`);
    if (this.isValidStatementArg(s) && typeof o > "u")
      return;
    if (!(Array.isArray(o) && o.length > 0 && o.every((u) => typeof u == "string")))
      throw new Error(
        `${i}() second argument must be a statement or non-empty column name list.`
      );
    if (!this.isValidStatementArg(s))
      throw new Error(
        `${i}() third argument must be a function / QueryBuilder or a raw when its second argument is a column name list`
      );
  }
  with(e, t, n) {
    return this._validateWithArgs(
      e,
      t,
      n,
      "with"
    ), this.withWrapped(e, t, n);
  }
  withMaterialized(e, t, n) {
    throw new Error("With materialized is not supported by this dialect");
  }
  withNotMaterialized(e, t, n) {
    throw new Error("With materialized is not supported by this dialect");
  }
  // Helper for compiling any advanced `with` queries.
  withWrapped(e, t, n, i) {
    const [s, o] = typeof n > "u" ? [t, void 0] : [n, t], a = {
      grouping: "with",
      type: "withWrapped",
      alias: e,
      columnList: o,
      value: s
    };
    return i !== void 0 && (a.materialized = i), this._statements.push(a), this;
  }
  // With Recursive
  // ------
  withRecursive(e, t, n) {
    return this._validateWithArgs(
      e,
      t,
      n,
      "withRecursive"
    ), this.withRecursiveWrapped(
      e,
      t,
      n
    );
  }
  // Helper for compiling any advanced `withRecursive` queries.
  withRecursiveWrapped(e, t, n) {
    return this.withWrapped(e, t, n), this._statements[this._statements.length - 1].recursive = !0, this;
  }
  // Select
  // ------
  // Adds a column or columns to the list of "columns"
  // being selected on the query.
  columns(e) {
    return !e && e !== 0 ? this : (this._statements.push({
      grouping: "columns",
      value: Oe(...arguments)
    }), this);
  }
  // Allow for a sub-select to be explicitly aliased as a column,
  // without needing to compile the query in a where.
  as(e) {
    return this._single.as = e, this;
  }
  // Adds a single hint or an array of hits to the list of "hintComments" on the query.
  hintComment(e) {
    if (e = Array.isArray(e) ? e : [e], e.some((t) => !Mt(t)))
      throw new Error("Hint comment must be a string");
    if (e.some((t) => t.includes("/*") || t.includes("*/")))
      throw new Error('Hint comment cannot include "/*" or "*/"');
    if (e.some((t) => t.includes("?")))
      throw new Error('Hint comment cannot include "?"');
    return this._statements.push({
      grouping: "hintComments",
      value: e
    }), this;
  }
  // Prepends the `schemaName` on `tableName` defined by `.table` and `.join`.
  withSchema(e) {
    return this._single.schema = e, this;
  }
  // Sets the `tableName` on the query.
  // Alias to "from" for select and "into" for insert statements
  // e.g. builder.insert({a: value}).into('tableName')
  // `options`: options object containing keys:
  //   - `only`: whether the query should use SQL's ONLY to not return
  //           inheriting table data. Defaults to false.
  table(e, t = {}) {
    return this._single.table = e, this._single.only = t.only === !0, this;
  }
  // Adds a `distinct` clause to the query.
  distinct(...e) {
    return this._statements.push({
      grouping: "columns",
      value: Oe(...e),
      distinct: !0
    }), this;
  }
  distinctOn(...e) {
    if (ae(e))
      throw new Error("distinctOn requires at least on argument");
    return this._statements.push({
      grouping: "columns",
      value: Oe(...e),
      distinctOn: !0
    }), this;
  }
  // Adds a join clause to the query, allowing for advanced joins
  // with an anonymous function as the second argument.
  join(e, t, ...n) {
    let i;
    const s = e instanceof f || typeof e == "function" ? void 0 : this._single.schema, o = this._joinType();
    return typeof t == "function" ? (i = new Rt(e, o, s), t.call(i, i)) : o === "raw" ? i = new Rt(this.client.raw(e, t), "raw") : (i = new Rt(e, o, s), t && i.on(t, ...n)), this._statements.push(i), this;
  }
  using(e) {
    throw new Error(
      "'using' function is only available in PostgreSQL dialect with Delete statements."
    );
  }
  // JOIN blocks:
  innerJoin(...e) {
    return this._joinType("inner").join(...e);
  }
  leftJoin(...e) {
    return this._joinType("left").join(...e);
  }
  leftOuterJoin(...e) {
    return this._joinType("left outer").join(...e);
  }
  rightJoin(...e) {
    return this._joinType("right").join(...e);
  }
  rightOuterJoin(...e) {
    return this._joinType("right outer").join(...e);
  }
  outerJoin(...e) {
    return this._joinType("outer").join(...e);
  }
  fullOuterJoin(...e) {
    return this._joinType("full outer").join(...e);
  }
  crossJoin(...e) {
    return this._joinType("cross").join(...e);
  }
  joinRaw(...e) {
    return this._joinType("raw").join(...e);
  }
  // Where modifiers:
  get or() {
    return this._bool("or");
  }
  get not() {
    return this._not(!0);
  }
  // The where function can be used in several ways:
  // The most basic is `where(key, value)`, which expands to
  // where key = value.
  where(e, t, n) {
    const i = arguments.length;
    if (e === !1 || e === !0)
      return this.where(1, "=", e ? 1 : 0);
    if (typeof e == "function")
      return this.whereWrapped(e);
    if (L(e) && !e.isRawInstance)
      return this._objectWhere(e);
    if (e && e.isRawInstance && i === 1)
      return this.whereRaw(e);
    if (i === 2 && (n = t, t = "=", n === null))
      return this.whereNull(e);
    const s = `${t}`.toLowerCase().trim();
    if (i === 3) {
      if (s === "in" || s === "not in")
        return this._not(s === "not in").whereIn(e, n);
      if (s === "between" || s === "not between")
        return this._not(s === "not between").whereBetween(
          e,
          n
        );
    }
    return n === null && (s === "is" || s === "is not") ? this._not(s === "is not").whereNull(e) : (this._statements.push({
      grouping: "where",
      type: "whereBasic",
      column: e,
      operator: t,
      value: n,
      not: this._not(),
      bool: this._bool(),
      asColumn: this._asColumnFlag
    }), this);
  }
  whereColumn(...e) {
    return this._asColumnFlag = !0, this.where(...e), this._asColumnFlag = !1, this;
  }
  // Adds an `or where` clause to the query.
  orWhere(e, ...t) {
    this._bool("or");
    const n = e;
    return L(n) && !n.isRawInstance ? this.whereWrapped(function() {
      for (const i in n)
        this.andWhere(i, n[i]);
    }) : this.where(e, ...t);
  }
  orWhereColumn(e, ...t) {
    this._bool("or");
    const n = e;
    return L(n) && !n.isRawInstance ? this.whereWrapped(function() {
      for (const i in n)
        this.andWhereColumn(i, "=", n[i]);
    }) : this.whereColumn(e, ...t);
  }
  // Adds an `not where` clause to the query.
  whereNot(e, ...t) {
    return t.length >= 2 && (t[0] === "in" || t[0] === "between") && this.client.logger.warn(
      'whereNot is not suitable for "in" and "between" type subqueries. You should use "not in" and "not between" instead.'
    ), this._not(!0).where(e, ...t);
  }
  whereNotColumn(...e) {
    return this._not(!0).whereColumn(...e);
  }
  // Adds an `or not where` clause to the query.
  orWhereNot(...e) {
    return this._bool("or").whereNot(...e);
  }
  orWhereNotColumn(...e) {
    return this._bool("or").whereNotColumn(...e);
  }
  // Processes an object literal provided in a "where" clause.
  _objectWhere(e) {
    const t = this._bool(), n = this._not() ? "Not" : "";
    for (const i in e)
      this[t + "Where" + n](i, e[i]);
    return this;
  }
  // Adds a raw `where` clause to the query.
  whereRaw(e, t) {
    const n = e.isRawInstance ? e : this.client.raw(e, t);
    return this._statements.push({
      grouping: "where",
      type: "whereRaw",
      value: n,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  orWhereRaw(e, t) {
    return this._bool("or").whereRaw(e, t);
  }
  // Helper for compiling any advanced `where` queries.
  whereWrapped(e) {
    return this._statements.push({
      grouping: "where",
      type: "whereWrapped",
      value: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  // Adds a `where exists` clause to the query.
  whereExists(e) {
    return this._statements.push({
      grouping: "where",
      type: "whereExists",
      value: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  // Adds an `or where exists` clause to the query.
  orWhereExists(e) {
    return this._bool("or").whereExists(e);
  }
  // Adds a `where not exists` clause to the query.
  whereNotExists(e) {
    return this._not(!0).whereExists(e);
  }
  // Adds a `or where not exists` clause to the query.
  orWhereNotExists(e) {
    return this._bool("or").whereNotExists(e);
  }
  // Adds a `where in` clause to the query.
  whereIn(e, t) {
    return Array.isArray(t) && ae(t) ? this.where(this._not()) : (this._statements.push({
      grouping: "where",
      type: "whereIn",
      column: e,
      value: t,
      not: this._not(),
      bool: this._bool()
    }), this);
  }
  // Adds a `or where in` clause to the query.
  orWhereIn(e, t) {
    return this._bool("or").whereIn(e, t);
  }
  // Adds a `where not in` clause to the query.
  whereNotIn(e, t) {
    return this._not(!0).whereIn(e, t);
  }
  // Adds a `or where not in` clause to the query.
  orWhereNotIn(e, t) {
    return this._bool("or")._not(!0).whereIn(e, t);
  }
  // Adds a `where null` clause to the query.
  whereNull(e) {
    return this._statements.push({
      grouping: "where",
      type: "whereNull",
      column: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  // Adds a `or where null` clause to the query.
  orWhereNull(e) {
    return this._bool("or").whereNull(e);
  }
  // Adds a `where not null` clause to the query.
  whereNotNull(e) {
    return this._not(!0).whereNull(e);
  }
  // Adds a `or where not null` clause to the query.
  orWhereNotNull(e) {
    return this._bool("or").whereNotNull(e);
  }
  // Adds a `where between` clause to the query.
  whereBetween(e, t) {
    return oe(
      Array.isArray(t),
      "The second argument to whereBetween must be an array."
    ), oe(
      t.length === 2,
      "You must specify 2 values for the whereBetween clause"
    ), this._statements.push({
      grouping: "where",
      type: "whereBetween",
      column: e,
      value: t,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  // Adds a `where not between` clause to the query.
  whereNotBetween(e, t) {
    return this._not(!0).whereBetween(e, t);
  }
  // Adds a `or where between` clause to the query.
  orWhereBetween(e, t) {
    return this._bool("or").whereBetween(e, t);
  }
  // Adds a `or where not between` clause to the query.
  orWhereNotBetween(e, t) {
    return this._bool("or").whereNotBetween(e, t);
  }
  _whereLike(e, t, n) {
    return this._statements.push({
      grouping: "where",
      type: e,
      column: t,
      value: n,
      not: this._not(),
      bool: this._bool(),
      asColumn: this._asColumnFlag
    }), this;
  }
  // Adds a `where like` clause to the query.
  whereLike(e, t) {
    return this._whereLike("whereLike", e, t);
  }
  // Adds a `or where like` clause to the query.
  orWhereLike(e, t) {
    return this._bool("or")._whereLike("whereLike", e, t);
  }
  // Adds a `where ilike` clause to the query.
  whereILike(e, t) {
    return this._whereLike("whereILike", e, t);
  }
  // Adds a `or where ilike` clause to the query.
  orWhereILike(e, t) {
    return this._bool("or")._whereLike("whereILike", e, t);
  }
  // Adds a `group by` clause to the query.
  groupBy(e) {
    return e && e.isRawInstance ? this.groupByRaw.apply(this, arguments) : (this._statements.push({
      grouping: "group",
      type: "groupByBasic",
      value: Oe(...arguments)
    }), this);
  }
  // Adds a raw `group by` clause to the query.
  groupByRaw(e, t) {
    const n = e.isRawInstance ? e : this.client.raw(e, t);
    return this._statements.push({
      grouping: "group",
      type: "groupByRaw",
      value: n
    }), this;
  }
  // Adds a `order by` clause to the query.
  orderBy(e, t, n = "") {
    return Array.isArray(e) ? this._orderByArray(e) : (this._statements.push({
      grouping: "order",
      type: "orderByBasic",
      value: e,
      direction: t,
      nulls: n
    }), this);
  }
  // Adds a `order by` with multiple columns to the query.
  _orderByArray(e) {
    for (let t = 0; t < e.length; t++) {
      const n = e[t];
      L(n) ? this._statements.push({
        grouping: "order",
        type: "orderByBasic",
        value: n.column,
        direction: n.order,
        nulls: n.nulls
      }) : Mt(n) && this._statements.push({
        grouping: "order",
        type: "orderByBasic",
        value: n
      });
    }
    return this;
  }
  // Add a raw `order by` clause to the query.
  orderByRaw(e, t) {
    const n = e.isRawInstance ? e : this.client.raw(e, t);
    return this._statements.push({
      grouping: "order",
      type: "orderByRaw",
      value: n
    }), this;
  }
  _union(e, t) {
    let n = t[0], i = t[1];
    if (t.length === 1 || t.length === 2 && Ae(i)) {
      Array.isArray(n) || (n = [n]);
      for (let s = 0, o = n.length; s < o; s++)
        this._statements.push({
          grouping: "union",
          clause: e,
          value: n[s],
          wrap: i || !1
        });
    } else
      n = Vn(t).slice(0, t.length - 1), i = t[t.length - 1], Ae(i) || (n.push(i), i = !1), this._union(e, [n, i]);
    return this;
  }
  // Add a union statement to the query.
  union(...e) {
    return this._union("union", e);
  }
  // Adds a union all statement to the query.
  unionAll(...e) {
    return this._union("union all", e);
  }
  // Adds an intersect statement to the query
  intersect(e, t) {
    if (arguments.length === 1 || arguments.length === 2 && Ae(t)) {
      Array.isArray(e) || (e = [e]);
      for (let n = 0, i = e.length; n < i; n++)
        this._statements.push({
          grouping: "union",
          clause: "intersect",
          value: e[n],
          wrap: t || !1
        });
    } else
      e = Vn(arguments).slice(0, arguments.length - 1), t = arguments[arguments.length - 1], Ae(t) || (e.push(t), t = !1), this.intersect(e, t);
    return this;
  }
  // Adds a `having` clause to the query.
  having(e, t, n) {
    return e.isRawInstance && arguments.length === 1 ? this.havingRaw(e) : typeof e == "function" ? this.havingWrapped(e) : (this._statements.push({
      grouping: "having",
      type: "havingBasic",
      column: e,
      operator: t,
      value: n,
      bool: this._bool(),
      not: this._not()
    }), this);
  }
  orHaving(e, ...t) {
    this._bool("or");
    const n = e;
    return L(n) && !n.isRawInstance ? this.havingWrapped(function() {
      for (const i in n)
        this.andHaving(i, n[i]);
    }) : this.having(e, ...t);
  }
  // Helper for compiling any advanced `having` queries.
  havingWrapped(e) {
    return this._statements.push({
      grouping: "having",
      type: "havingWrapped",
      value: e,
      bool: this._bool(),
      not: this._not()
    }), this;
  }
  havingNull(e) {
    return this._statements.push({
      grouping: "having",
      type: "havingNull",
      column: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  orHavingNull(e) {
    return this._bool("or").havingNull(e);
  }
  havingNotNull(e) {
    return this._not(!0).havingNull(e);
  }
  orHavingNotNull(e) {
    return this._not(!0)._bool("or").havingNull(e);
  }
  havingExists(e) {
    return this._statements.push({
      grouping: "having",
      type: "havingExists",
      value: e,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  orHavingExists(e) {
    return this._bool("or").havingExists(e);
  }
  havingNotExists(e) {
    return this._not(!0).havingExists(e);
  }
  orHavingNotExists(e) {
    return this._not(!0)._bool("or").havingExists(e);
  }
  havingBetween(e, t) {
    return oe(
      Array.isArray(t),
      "The second argument to havingBetween must be an array."
    ), oe(
      t.length === 2,
      "You must specify 2 values for the havingBetween clause"
    ), this._statements.push({
      grouping: "having",
      type: "havingBetween",
      column: e,
      value: t,
      not: this._not(),
      bool: this._bool()
    }), this;
  }
  orHavingBetween(e, t) {
    return this._bool("or").havingBetween(e, t);
  }
  havingNotBetween(e, t) {
    return this._not(!0).havingBetween(e, t);
  }
  orHavingNotBetween(e, t) {
    return this._not(!0)._bool("or").havingBetween(e, t);
  }
  havingIn(e, t) {
    return Array.isArray(t) && ae(t) ? this.where(this._not()) : (this._statements.push({
      grouping: "having",
      type: "havingIn",
      column: e,
      value: t,
      not: this._not(),
      bool: this._bool()
    }), this);
  }
  // Adds a `or where in` clause to the query.
  orHavingIn(e, t) {
    return this._bool("or").havingIn(e, t);
  }
  // Adds a `where not in` clause to the query.
  havingNotIn(e, t) {
    return this._not(!0).havingIn(e, t);
  }
  // Adds a `or where not in` clause to the query.
  orHavingNotIn(e, t) {
    return this._bool("or")._not(!0).havingIn(e, t);
  }
  // Adds a raw `having` clause to the query.
  havingRaw(e, t) {
    const n = e.isRawInstance ? e : this.client.raw(e, t);
    return this._statements.push({
      grouping: "having",
      type: "havingRaw",
      value: n,
      bool: this._bool(),
      not: this._not()
    }), this;
  }
  orHavingRaw(e, t) {
    return this._bool("or").havingRaw(e, t);
  }
  // set the skip binding parameter (= insert the raw value in the query) for an attribute.
  _setSkipBinding(e, t) {
    let n = t;
    L(t) && (n = t.skipBinding), this._single.skipBinding = this._single.skipBinding || {}, this._single.skipBinding[e] = n;
  }
  // Only allow a single "offset" to be set for the current query.
  offset(e, t) {
    if (e == null || e.isRawInstance || e instanceof f)
      this._single.offset = e;
    else {
      const n = parseInt(e, 10);
      if (isNaN(n))
        this.client.logger.warn("A valid integer must be provided to offset");
      else {
        if (n < 0)
          throw new Error("A non-negative integer must be provided to offset.");
        this._single.offset = n;
      }
    }
    return this._setSkipBinding("offset", t), this;
  }
  // Only allow a single "limit" to be set for the current query.
  limit(e, t) {
    const n = parseInt(e, 10);
    return isNaN(n) ? this.client.logger.warn("A valid integer must be provided to limit") : (this._single.limit = n, this._setSkipBinding("limit", t)), this;
  }
  // Retrieve the "count" result of the query.
  count(e, t) {
    return this._aggregate("count", e || "*", t);
  }
  // Retrieve the minimum value of a given column.
  min(e, t) {
    return this._aggregate("min", e, t);
  }
  // Retrieve the maximum value of a given column.
  max(e, t) {
    return this._aggregate("max", e, t);
  }
  // Retrieve the sum of the values of a given column.
  sum(e, t) {
    return this._aggregate("sum", e, t);
  }
  // Retrieve the average of the values of a given column.
  avg(e, t) {
    return this._aggregate("avg", e, t);
  }
  // Retrieve the "count" of the distinct results of the query.
  countDistinct(...e) {
    let t;
    return e.length > 1 && Jn(xC(e)) && ([t] = e.splice(e.length - 1, 1)), e.length ? e.length === 1 && (e = e[0]) : e = "*", this._aggregate("count", e, { ...t, distinct: !0 });
  }
  // Retrieve the sum of the distinct values of a given column.
  sumDistinct(e, t) {
    return this._aggregate("sum", e, { ...t, distinct: !0 });
  }
  // Retrieve the vg of the distinct results of the query.
  avgDistinct(e, t) {
    return this._aggregate("avg", e, { ...t, distinct: !0 });
  }
  // Increments a column's value by the specified amount.
  increment(e, t = 1) {
    if (L(e)) {
      for (const n in e)
        this._counter(n, e[n]);
      return this;
    }
    return this._counter(e, t);
  }
  // Decrements a column's value by the specified amount.
  decrement(e, t = 1) {
    if (L(e)) {
      for (const n in e)
        this._counter(n, -e[n]);
      return this;
    }
    return this._counter(e, -t);
  }
  // Clears increments/decrements
  clearCounters() {
    return this._single.counter = {}, this;
  }
  // Sets the values for a `select` query, informing that only the first
  // row should be returned (limit 1).
  first(...e) {
    if (this._method && this._method !== "select")
      throw new Error(`Cannot chain .first() on "${this._method}" query`);
    return this.select(Oe(...e)), this._method = "first", this.limit(1), this;
  }
  // Use existing connection to execute the query
  // Same value that client.acquireConnection() for an according client returns should be passed
  connection(e) {
    return this._connection = e, this.client.processPassedConnection(e), this;
  }
  // Pluck a column from a query.
  pluck(e) {
    if (this._method && this._method !== "select")
      throw new Error(`Cannot chain .pluck() on "${this._method}" query`);
    return this._method = "pluck", this._single.pluck = e, this._statements.push({
      grouping: "columns",
      type: "pluck",
      value: e
    }), this;
  }
  // Deprecated. Remove everything from select clause
  clearSelect() {
    return this._clearGrouping("columns"), this;
  }
  // Deprecated. Remove everything from where clause
  clearWhere() {
    return this._clearGrouping("where"), this;
  }
  // Deprecated. Remove everything from group clause
  clearGroup() {
    return this._clearGrouping("group"), this;
  }
  // Deprecated. Remove everything from order clause
  clearOrder() {
    return this._clearGrouping("order"), this;
  }
  // Deprecated. Remove everything from having clause
  clearHaving() {
    return this._clearGrouping("having"), this;
  }
  // Remove everything from statement clause
  clear(e) {
    if (!FC.has(e))
      throw new Error(`Knex Error: unknown statement '${e}'`);
    return e.startsWith("counter") ? this.clearCounters() : (e === "select" && (e = "columns"), this._clearGrouping(e), this);
  }
  // Insert & Update
  // ------
  // Sets the values for an `insert` query.
  insert(e, t, n) {
    return this._method = "insert", ae(t) || this.returning(t, n), this._single.insert = e, this;
  }
  // Sets the values for an `update`, allowing for both
  // `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
  update(e, t, n) {
    let i;
    const s = this._single.update || {};
    if (this._method = "update", Mt(e))
      Jn(t) ? s[e] = JSON.stringify(t) : s[e] = t, arguments.length > 2 && (i = arguments[2]);
    else {
      const o = Object.keys(e);
      this._single.update && this.client.logger.warn("Update called multiple times with objects.");
      let a = -1;
      for (; ++a < o.length; )
        s[o[a]] = e[o[a]];
      i = arguments[1];
    }
    return ae(i) || this.returning(i, n), this._single.update = s, this;
  }
  // Sets the returning value for the query.
  returning(e, t) {
    return this._single.returning = e, this._single.options = t, this;
  }
  onConflict(e) {
    return typeof e == "string" && (e = [e]), new QC(this, e || !0);
  }
  // Delete
  // ------
  // Executes a delete statement on the query;
  delete(e, t) {
    return this._method = "del", ae(e) || this.returning(e, t), this;
  }
  // Truncates a table, ends the query chain.
  truncate(e) {
    return this._method = "truncate", e && (this._single.table = e), this;
  }
  // Retrieves columns for the table specified by `knex(tableName)`
  columnInfo(e) {
    return this._method = "columnInfo", this._single.columnInfo = e, this;
  }
  // Set a lock for update constraint.
  forUpdate(...e) {
    return this._single.lock = D.forUpdate, e.length === 1 && Array.isArray(e[0]) ? this._single.lockTables = e[0] : this._single.lockTables = e, this;
  }
  // Set a lock for share constraint.
  forShare(...e) {
    return this._single.lock = D.forShare, this._single.lockTables = e, this;
  }
  // Set a lock for no key update constraint.
  forNoKeyUpdate(...e) {
    return this._single.lock = D.forNoKeyUpdate, this._single.lockTables = e, this;
  }
  // Set a lock for key share constraint.
  forKeyShare(...e) {
    return this._single.lock = D.forKeyShare, this._single.lockTables = e, this;
  }
  // Skips locked rows when using a lock constraint.
  skipLocked() {
    if (!this._isSelectQuery())
      throw new Error(`Cannot chain .skipLocked() on "${this._method}" query!`);
    if (!this._hasLockMode())
      throw new Error(
        ".skipLocked() can only be used after a call to .forShare() or .forUpdate()!"
      );
    if (this._single.waitMode === Je.noWait)
      throw new Error(".skipLocked() cannot be used together with .noWait()!");
    return this._single.waitMode = Je.skipLocked, this;
  }
  // Causes error when acessing a locked row instead of waiting for it to be released.
  noWait() {
    if (!this._isSelectQuery())
      throw new Error(`Cannot chain .noWait() on "${this._method}" query!`);
    if (!this._hasLockMode())
      throw new Error(
        ".noWait() can only be used after a call to .forShare() or .forUpdate()!"
      );
    if (this._single.waitMode === Je.skipLocked)
      throw new Error(".noWait() cannot be used together with .skipLocked()!");
    return this._single.waitMode = Je.noWait, this;
  }
  // Takes a JS object of methods to call and calls them
  fromJS(e) {
    return IC(e, (t, n) => {
      typeof this[n] != "function" && this.client.logger.warn(`Knex Error: unknown key ${n}`), Array.isArray(t) ? this[n].apply(this, t) : this[n](t);
    }), this;
  }
  fromRaw(e, t) {
    const n = e.isRawInstance ? e : this.client.raw(e, t);
    return this.from(n);
  }
  // Passes query to provided callback function, useful for e.g. composing
  // domain-specific helpers
  modify(e) {
    return e.apply(this, [this].concat(NC(arguments))), this;
  }
  upsert(e, t, n) {
    throw new Error(
      `Upsert is not yet supported for dialect ${this.client.dialect}`
    );
  }
  // JSON support functions
  _json(e, t) {
    return this._statements.push({
      grouping: "columns",
      type: "json",
      method: e,
      params: t
    }), this;
  }
  jsonExtract() {
    const e = arguments[0];
    let t, n, i = !0;
    return arguments.length >= 2 && (t = arguments[1]), arguments.length >= 3 && (n = arguments[2]), arguments.length === 4 && (i = arguments[3]), arguments.length === 2 && Array.isArray(arguments[0]) && Ae(arguments[1]) && (i = arguments[1]), this._json("jsonExtract", {
      column: e,
      path: t,
      alias: n,
      singleValue: i
      // boolean used only in MSSQL to use function for extract value instead of object/array.
    });
  }
  jsonSet(e, t, n, i) {
    return this._json("jsonSet", {
      column: e,
      path: t,
      value: n,
      alias: i
    });
  }
  jsonInsert(e, t, n, i) {
    return this._json("jsonInsert", {
      column: e,
      path: t,
      value: n,
      alias: i
    });
  }
  jsonRemove(e, t, n) {
    return this._json("jsonRemove", {
      column: e,
      path: t,
      alias: n
    });
  }
  // Wheres for JSON
  _isJsonObject(e) {
    return L(e) && !(e instanceof f);
  }
  _whereJsonWrappedValue(e, t, n) {
    const i = {
      grouping: "where",
      type: e,
      column: t,
      value: n,
      not: this._not(),
      bool: this._bool(),
      asColumn: this._asColumnFlag
    };
    arguments[3] && (i.operator = arguments[3]), arguments[4] && (i.jsonPath = arguments[4]), this._statements.push(i);
  }
  whereJsonObject(e, t) {
    return this._whereJsonWrappedValue("whereJsonObject", e, t), this;
  }
  orWhereJsonObject(e, t) {
    return this._bool("or").whereJsonObject(e, t);
  }
  whereNotJsonObject(e, t) {
    return this._not(!0).whereJsonObject(e, t);
  }
  orWhereNotJsonObject(e, t) {
    return this._bool("or").whereNotJsonObject(e, t);
  }
  whereJsonPath(e, t, n, i) {
    return this._whereJsonWrappedValue("whereJsonPath", e, i, n, t), this;
  }
  orWhereJsonPath(e, t, n, i) {
    return this._bool("or").whereJsonPath(e, t, n, i);
  }
  // Json superset wheres
  whereJsonSupersetOf(e, t) {
    return this._whereJsonWrappedValue("whereJsonSupersetOf", e, t), this;
  }
  whereJsonNotSupersetOf(e, t) {
    return this._not(!0).whereJsonSupersetOf(e, t);
  }
  orWhereJsonSupersetOf(e, t) {
    return this._bool("or").whereJsonSupersetOf(e, t);
  }
  orWhereJsonNotSupersetOf(e, t) {
    return this._bool("or").whereJsonNotSupersetOf(e, t);
  }
  // Json subset wheres
  whereJsonSubsetOf(e, t) {
    return this._whereJsonWrappedValue("whereJsonSubsetOf", e, t), this;
  }
  whereJsonNotSubsetOf(e, t) {
    return this._not(!0).whereJsonSubsetOf(e, t);
  }
  orWhereJsonSubsetOf(e, t) {
    return this._bool("or").whereJsonSubsetOf(e, t);
  }
  orWhereJsonNotSubsetOf(e, t) {
    return this._bool("or").whereJsonNotSubsetOf(e, t);
  }
  whereJsonHasNone(e, t) {
    return this._not(!0).whereJsonHasAll(e, t), this;
  }
  // end of wheres for JSON
  _analytic(e, t, n) {
    let i;
    const { schema: s } = this._single, o = this._analyticMethod();
    if (e = typeof e == "string" ? e : null, oe(
      typeof t == "function" || t.isRawInstance || Array.isArray(t) || typeof t == "string" || typeof t == "object",
      `The second argument to an analytic function must be either a function, a raw,
       an array of string or object, an object or a single string.`
    ), n && oe(
      Array.isArray(n) || typeof n == "string" || typeof n == "object",
      "The third argument to an analytic function must be either a string, an array of string or object or an object."
    ), RC(t))
      i = new BC(o, s, e), t.call(i, i);
    else if (t.isRawInstance)
      i = {
        grouping: "columns",
        type: "analytic",
        method: o,
        raw: t,
        alias: e
      };
    else {
      const a = Array.isArray(t) ? t : [t];
      let u = n || [];
      u = Array.isArray(u) ? u : [u], i = {
        grouping: "columns",
        type: "analytic",
        method: o,
        order: a,
        alias: e,
        partitions: u
      };
    }
    return this._statements.push(i), this;
  }
  rank(...e) {
    return this._analyticMethod("rank")._analytic(...e);
  }
  denseRank(...e) {
    return this._analyticMethod("dense_rank")._analytic(...e);
  }
  rowNumber(...e) {
    return this._analyticMethod("row_number")._analytic(...e);
  }
  // ----------------------------------------------------------------------
  // Helper for the incrementing/decrementing queries.
  _counter(e, t) {
    return t = parseFloat(t), this._method = "update", this._single.counter = this._single.counter || {}, this._single.counter[e] = t, this;
  }
  // Helper to get or set the "boolFlag" value.
  _bool(e) {
    if (arguments.length === 1)
      return this._boolFlag = e, this;
    const t = this._boolFlag;
    return this._boolFlag = "and", t;
  }
  // Helper to get or set the "notFlag" value.
  _not(e) {
    if (arguments.length === 1)
      return this._notFlag = e, this;
    const t = this._notFlag;
    return this._notFlag = !1, t;
  }
  // Helper to get or set the "joinFlag" value.
  _joinType(e) {
    if (arguments.length === 1)
      return this._joinFlag = e, this;
    const t = this._joinFlag || "inner";
    return this._joinFlag = "inner", t;
  }
  _analyticMethod(e) {
    return arguments.length === 1 ? (this._analyticFlag = e, this) : this._analyticFlag || "row_number";
  }
  // Helper for compiling any aggregate queries.
  _aggregate(e, t, n = {}) {
    return this._statements.push({
      grouping: "columns",
      type: t.isRawInstance ? "aggregateRaw" : "aggregate",
      method: e,
      value: t,
      aggregateDistinct: n.distinct || !1,
      alias: n.as
    }), this;
  }
  // Helper function for clearing or reseting a grouping type from the builder
  _clearGrouping(e) {
    e in this._single ? this._single[e] = void 0 : this._statements = PC(this._statements, { grouping: e });
  }
  // Helper function that checks if the builder will emit a select query
  _isSelectQuery() {
    return LC.has(this._method);
  }
  // Helper function that checks if the query has a lock mode set
  _hasLockMode() {
    return HC.has(this._single.lock);
  }
}
f.prototype.select = f.prototype.columns;
f.prototype.column = f.prototype.columns;
f.prototype.andWhereNot = f.prototype.whereNot;
f.prototype.andWhereNotColumn = f.prototype.whereNotColumn;
f.prototype.andWhere = f.prototype.where;
f.prototype.andWhereColumn = f.prototype.whereColumn;
f.prototype.andWhereRaw = f.prototype.whereRaw;
f.prototype.andWhereBetween = f.prototype.whereBetween;
f.prototype.andWhereNotBetween = f.prototype.whereNotBetween;
f.prototype.andWhereJsonObject = f.prototype.whereJsonObject;
f.prototype.andWhereNotJsonObject = f.prototype.whereJsonObject;
f.prototype.andWhereJsonPath = f.prototype.whereJsonPath;
f.prototype.andWhereLike = f.prototype.whereLike;
f.prototype.andWhereILike = f.prototype.whereILike;
f.prototype.andHaving = f.prototype.having;
f.prototype.andHavingIn = f.prototype.havingIn;
f.prototype.andHavingNotIn = f.prototype.havingNotIn;
f.prototype.andHavingNull = f.prototype.havingNull;
f.prototype.andHavingNotNull = f.prototype.havingNotNull;
f.prototype.andHavingExists = f.prototype.havingExists;
f.prototype.andHavingNotExists = f.prototype.havingNotExists;
f.prototype.andHavingBetween = f.prototype.havingBetween;
f.prototype.andHavingNotBetween = f.prototype.havingNotBetween;
f.prototype.from = f.prototype.table;
f.prototype.into = f.prototype.table;
f.prototype.del = f.prototype.delete;
MC(f);
jC(f);
f.extend = (r, e) => {
  if (Object.prototype.hasOwnProperty.call(f.prototype, r))
    throw new Error(
      `Can't extend QueryBuilder with existing method ('${r}').`
    );
  SC(f.prototype, { [r]: e });
};
class QC {
  constructor(e, t) {
    this.builder = e, this._columns = t;
  }
  // Sets insert query to ignore conflicts
  ignore() {
    return this.builder._single.onConflict = this._columns, this.builder._single.ignore = !0, this.builder;
  }
  // Sets insert query to update on conflict
  merge(e) {
    return this.builder._single.onConflict = this._columns, this.builder._single.merge = { updates: e }, this.builder;
  }
  // Prevent
  then() {
    throw new Error(
      "Incomplete onConflict clause. .onConflict() must be directly followed by either .merge() or .ignore()"
    );
  }
}
var Sr = f;
function WC(r, e, t, n) {
  var i = -1, s = r == null ? 0 : r.length;
  for (n && s && (t = r[++i]); ++i < s; )
    t = e(t, r[i], i, r);
  return t;
}
var DC = WC;
function UC(r, e, t, n, i) {
  return i(r, function(s, o, a) {
    t = n ? (n = !1, s) : e(t, s, o, a);
  }), t;
}
var JC = UC, VC = DC, GC = ke, KC = ne, zC = JC, YC = A;
function XC(r, e, t) {
  var n = YC(r) ? VC : zC, i = arguments.length < 3;
  return n(r, KC(e), t, i, GC);
}
var Es = XC, ZC = vr, e1 = bi, t1 = ss, r1 = ne, n1 = ft, i1 = A, s1 = me, o1 = ut, a1 = P, u1 = be;
function l1(r, e, t) {
  var n = i1(r), i = n || s1(r) || u1(r);
  if (e = r1(e), t == null) {
    var s = r && r.constructor;
    i ? t = n ? new s() : [] : a1(r) ? t = o1(s) ? e1(n1(r)) : {} : t = {};
  }
  return (i ? ZC : t1)(r, function(o, a, u) {
    return e(t, o, a, u);
  }), t;
}
var c1 = l1;
const { isObject: h1 } = j;
function d1(r, e, t, n) {
  const i = t.queryBuilder();
  return r.call(i, i), t.queryCompiler(i, n.bindings).toSQL(e || i._method || "select");
}
function f1(r, e, t) {
  const n = e.queryContext();
  return t.wrapIdentifier((r || "").trim(), n);
}
function p1(r, e, t) {
  return r === void 0 ? "" : r === null ? "null" : r && r.isRawInstance ? r.toQuery() : e === "bool" ? (r === "false" && (r = 0), `'${r ? 1 : 0}'`) : (e === "json" || e === "jsonb") && h1(r) ? `'${JSON.stringify(r)}'` : t._escapeBinding(r.toString());
}
var Ir = {
  compileCallback: d1,
  wrapAsIdentifier: f1,
  formatDefault: p1
};
const g1 = c1, Ss = Sr, { compileCallback: xr, wrapAsIdentifier: rt } = Ir, y1 = ["asc", "desc"], m1 = g1(
  [
    "=",
    "<",
    ">",
    "<=",
    ">=",
    "<>",
    "!=",
    "like",
    "not like",
    "between",
    "not between",
    "ilike",
    "not ilike",
    "exists",
    "not exist",
    "rlike",
    "not rlike",
    "regexp",
    "not regexp",
    "match",
    "&",
    "|",
    "^",
    "<<",
    ">>",
    "~",
    "~=",
    "~*",
    "!~",
    "!~*",
    "#",
    "&&",
    "@>",
    "<@",
    "||",
    "&<",
    "&>",
    "-|-",
    "@@",
    "!!",
    ["?", "\\?"],
    ["?|", "\\?|"],
    ["?&", "\\?&"]
  ],
  (r, e) => {
    Array.isArray(e) ? r[e[0]] = e[1] : r[e] = e;
  },
  {}
);
function b1(r, e, t, n) {
  const i = Array.isArray(r) ? r : [r];
  let s = "", o = -1;
  for (; ++o < i.length; )
    o > 0 && (s += ", "), s += nt(i[o], void 0, e, t, n);
  return s;
}
function nt(r, e, t, n, i) {
  const s = Me(r, e, t, n, i);
  if (s)
    return s;
  switch (typeof r) {
    case "function":
      return Le(
        xr(r, void 0, n, i),
        !0,
        t,
        n
      );
    case "object":
      return w1(r, t, n, i);
    case "number":
      return r;
    default:
      return Ne(r + "", t, n);
  }
}
function Me(r, e, t, n, i) {
  let s;
  if (r instanceof Ss)
    return s = n.queryCompiler(r).toSQL(), s.bindings && i.bindings.push(...s.bindings), Le(s, e, t, n);
  if (r && r.isRawInstance)
    return r.client = n, t._queryContext && (r.queryContext = () => t._queryContext), s = r.toSQL(), s.bindings && i.bindings.push(...s.bindings), s.sql;
  e && i.bindings.push(r);
}
function _1(r, e, t, n) {
  const i = Me(r, void 0, e, t, n);
  if (i)
    return i;
  const s = m1[(r || "").toLowerCase()];
  if (!s)
    throw new TypeError(`The operator "${r}" is not permitted`);
  return s;
}
function Ne(r, e, t) {
  const n = r.toLowerCase().indexOf(" as ");
  if (n !== -1) {
    const a = r.slice(0, n), u = r.slice(n + 4);
    return t.alias(
      Ne(a, e, t),
      rt(u, e, t)
    );
  }
  const i = [];
  let s = -1;
  const o = r.split(".");
  for (; ++s < o.length; )
    r = o[s], s === 0 && o.length > 1 ? i.push(Ne((r || "").trim(), e, t)) : i.push(rt(r, e, t));
  return i.join(".");
}
function w1(r, e, t, n) {
  const i = [];
  for (const s in r) {
    const o = r[s];
    if (typeof o == "function") {
      const a = xr(
        o,
        void 0,
        t,
        n
      );
      a.as = s, i.push(Le(a, !0, e, t));
    } else
      o instanceof Ss ? i.push(
        t.alias(
          `(${nt(o, void 0, e, t, n)})`,
          rt(s, e, t)
        )
      ) : i.push(
        t.alias(
          nt(o, void 0, e, t, n),
          rt(s, e, t)
        )
      );
  }
  return i.join(", ");
}
function Le(r, e, t, n) {
  let i = r.sql || "";
  return i && (r.method === "select" || r.method === "first") && (e || r.as) && (i = `(${i})`, r.as) ? n.alias(i, Ne(r.as, t, n)) : i;
}
function v1(r, e, t, n, i) {
  return typeof r == "function" ? Le(
    xr(r, e, n, i),
    void 0,
    t,
    n
  ) : Me(r, void 0, t, n, i) || "";
}
function $1(r, e, t, n) {
  const i = Me(r, void 0, e, t, n);
  return i || (y1.indexOf((r || "").toLowerCase()) !== -1 ? r : "asc");
}
var $e = {
  columnize: b1,
  direction: $1,
  operator: _1,
  outputQuery: Le,
  rawOrFn: v1,
  unwrapRaw: Me,
  wrap: nt,
  wrapString: Ne
};
const { columnize: Is } = $e;
function C1(r, e) {
  const t = {
    bindings: []
  }, n = r, i = r.bindings.length, s = r.bindings;
  let o = 0;
  const a = r.sql.replace(/\\?\?\??/g, function(u) {
    if (u === "\\?")
      return u;
    const c = s[o++];
    return u === "??" ? Is(c, n, e, t) : e.parameter(c, n, t);
  });
  if (i !== o)
    throw new Error(`Expected ${i} bindings, saw ${o}`);
  return {
    method: "raw",
    sql: a,
    bindings: t.bindings
  };
}
function T1(r, e) {
  const t = {
    bindings: []
  }, n = r, i = r.bindings, s = /\\?(:(\w+):(?=::)|:(\w+):(?!:)|:(\w+))/g;
  return {
    method: "raw",
    sql: r.sql.replace(s, function(a, u, c, l, h) {
      if (a !== u)
        return u;
      const d = c || l || h, _ = a.trim(), m = _[_.length - 1] === ":", g = i[d];
      return g === void 0 ? (Object.prototype.hasOwnProperty.call(i, d) && t.bindings.push(g), a) : m ? a.replace(
        u,
        Is(g, n, e, t)
      ) : a.replace(u, e.parameter(g, n, t));
    }),
    bindings: t.bindings
  };
}
var O1 = {
  replaceKeyBindings: T1,
  replaceRawArrBindings: C1
};
const A1 = "ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW", E1 = "0123456789";
function S1(r = 21) {
  let e = "", t = r;
  for (; t--; )
    e += A1[Math.random() * 64 | 0];
  return e;
}
function I1(r = 21) {
  let e = "", t = r;
  for (; t--; )
    e += E1[Math.random() * 10 | 0];
  return e;
}
var xs = { nanoid: S1, nanonum: I1 };
const { EventEmitter: x1 } = E, P1 = he, N1 = re, j1 = qe, B1 = Es, {
  replaceRawArrBindings: q1,
  replaceKeyBindings: k1
} = O1, er = k, R1 = Ar, { nanoid: M1 } = xs, { isNumber: L1, isObject: F1 } = j, {
  augmentWithBuilderInterface: H1
} = Er, Q1 = P1("knex:bindings");
let $t = class extends x1 {
  constructor(e) {
    super(), this.client = e, this.sql = "", this.bindings = [], this._wrappedBefore = void 0, this._wrappedAfter = void 0, e && e.config && (this._debug = e.config.debug, R1(this, 4));
  }
  set(e, t) {
    return this.sql = e, this.bindings = F1(t) && !t.toSQL || t === void 0 ? t : [t], this;
  }
  timeout(e, { cancel: t } = {}) {
    return L1(e) && e > 0 && (this._timeout = e, t && (this.client.assertCanCancelQuery(), this._cancelOnTimeout = !0)), this;
  }
  // Wraps the current sql with `before` and `after`.
  wrap(e, t) {
    return this._wrappedBefore = e, this._wrappedAfter = t, this;
  }
  // Calls `toString` on the Knex object.
  toString() {
    return this.toQuery();
  }
  // Returns the raw sql for the query.
  toSQL(e, t) {
    let n;
    if (Array.isArray(this.bindings) ? n = q1(this, this.client) : this.bindings && j1(this.bindings) ? n = k1(this, this.client) : n = {
      method: "raw",
      sql: this.sql,
      bindings: this.bindings === void 0 ? [] : [this.bindings]
    }, this._wrappedBefore && (n.sql = this._wrappedBefore + n.sql), this._wrappedAfter && (n.sql = n.sql + this._wrappedAfter), n.options = B1(this._options, N1, {}), this._timeout && (n.timeout = this._timeout, this._cancelOnTimeout && (n.cancelOnTimeout = this._cancelOnTimeout)), n.bindings = n.bindings || [], er.containsUndefined(n.bindings)) {
      const i = er.getUndefinedIndices(
        this.bindings
      );
      throw Q1(n.bindings), new Error(
        `Undefined binding(s) detected for keys [${i}] when compiling RAW query: ${n.sql}`
      );
    }
    return n.__knexQueryUid = M1(), Object.defineProperties(n, {
      toNative: {
        value: () => ({
          sql: this.client.positionBindings(n.sql),
          bindings: this.client.prepBindings(n.bindings)
        }),
        enumerable: !1
      }
    }), n;
  }
};
$t.prototype.isRawInstance = !0;
H1($t);
er.addQueryContext($t);
var Pr = $t;
function W1(r) {
  for (var e = -1, t = r == null ? 0 : r.length, n = 0, i = []; ++e < t; ) {
    var s = r[e];
    s && (i[n++] = s);
  }
  return i;
}
var D1 = W1;
function U1(r, e, t, n) {
  for (var i = -1, s = r == null ? 0 : r.length; ++i < s; ) {
    var o = r[i];
    e(n, o, t(o), r);
  }
  return n;
}
var J1 = U1, V1 = ke;
function G1(r, e, t, n) {
  return V1(r, function(i, s, o) {
    e(n, i, t(i), o);
  }), n;
}
var K1 = G1, z1 = J1, Y1 = K1, X1 = ne, Z1 = A;
function eT(r, e) {
  return function(t, n) {
    var i = Z1(t) ? z1 : Y1, s = e ? e() : {};
    return i(t, r, X1(n), s);
  };
}
var tT = eT, rT = dt, nT = tT, iT = Object.prototype, sT = iT.hasOwnProperty, oT = nT(function(r, e, t) {
  sT.call(r, t) ? r[t].push(e) : rT(r, t, [e]);
}), Ct = oT, aT = Object.prototype, uT = aT.hasOwnProperty;
function lT(r, e) {
  return r != null && uT.call(r, e);
}
var cT = lT, hT = cT, dT = gs;
function fT(r, e) {
  return r != null && dT(r, e, hT);
}
var Ps = fT, pT = ke, gT = Q;
function yT(r, e) {
  var t = -1, n = gT(r) ? Array(r.length) : [];
  return pT(r, function(i, s, o) {
    n[++t] = e(i, s, o);
  }), n;
}
var mT = yT, bT = it, _T = ne, wT = mT, vT = A;
function $T(r, e) {
  var t = vT(r) ? bT : wT;
  return t(r, _T(e));
}
var CT = $T, TT = pt, OT = _t, AT = gt, Gn = P, ET = Re;
function ST(r, e, t, n) {
  if (!Gn(r))
    return r;
  e = OT(e, r);
  for (var i = -1, s = e.length, o = s - 1, a = r; a != null && ++i < s; ) {
    var u = ET(e[i]), c = t;
    if (u === "__proto__" || u === "constructor" || u === "prototype")
      return r;
    if (i != o) {
      var l = a[u];
      c = n ? n(l, u, a) : void 0, c === void 0 && (c = Gn(l) ? l : AT(e[i + 1]) ? [] : {});
    }
    TT(a, u, c), a = a[u];
  }
  return r;
}
var IT = ST, xT = Or, PT = IT, NT = _t;
function jT(r, e, t) {
  for (var n = -1, i = e.length, s = {}; ++n < i; ) {
    var o = e[n], a = xT(r, o);
    t(a, o) && PT(s, NT(o, r), a);
  }
  return s;
}
var BT = jT, qT = it, kT = ne, RT = BT, MT = Gi;
function LT(r, e) {
  if (r == null)
    return {};
  var t = qT(MT(r), function(n) {
    return [n];
  });
  return e = kT(e), RT(r, t, function(n, i) {
    return e(n, i[0]);
  });
}
var FT = LT, HT = ne, QT = ys, WT = FT;
function DT(r, e) {
  return WT(r, QT(HT(e)));
}
var UT = DT;
const JT = k, ue = Pr, Ve = Sr, VT = As, GT = he, Kn = re, Ee = D1, KT = Ct, zT = Ps, zn = bt, Yn = CT, YT = UT, XT = Es, { nanoid: ZT } = xs, { isString: Lt, isUndefined: eO } = j, {
  columnize: F,
  direction: Xn,
  operator: Se,
  wrap: O,
  unwrapRaw: le,
  rawOrFn: W
} = $e, tO = GT("knex:bindings"), rO = [
  "columns",
  "join",
  "where",
  "union",
  "group",
  "having",
  "order",
  "limit",
  "offset",
  "lock",
  "waitMode"
];
let nO = class {
  constructor(e, t, n) {
    this.client = e, this.method = t._method || "select", this.options = t._options, this.single = t._single, this.timeout = t._timeout || !1, this.cancelOnTimeout = t._cancelOnTimeout || !1, this.grouped = KT(t._statements, "grouping"), this.formatter = e.formatter(t), this._emptyInsertValue = "default values", this.first = this.select, this.bindings = n || [], this.formatter.bindings = this.bindings, this.bindingsHolder = this, this.builder = this.formatter.builder;
  }
  // Collapse the builder into a single object
  toSQL(e, t) {
    this._undefinedInWhereClause = !1, this.undefinedBindingsInfo = [], e = e || this.method;
    const n = this[e]() || "", i = {
      method: e,
      options: XT(this.options, Kn, {}),
      timeout: this.timeout,
      cancelOnTimeout: this.cancelOnTimeout,
      bindings: this.bindingsHolder.bindings || [],
      __knexQueryUid: ZT()
    };
    if (Object.defineProperties(i, {
      toNative: {
        value: () => ({
          sql: this.client.positionBindings(i.sql),
          bindings: this.client.prepBindings(i.bindings)
        }),
        enumerable: !1
      }
    }), Lt(n) ? i.sql = n : Kn(i, n), (e === "select" || e === "first") && this.single.as && (i.as = this.single.as), this._undefinedInWhereClause)
      throw tO(i.bindings), new Error(
        `Undefined binding(s) detected when compiling ${e.toUpperCase()}. Undefined column(s): [${this.undefinedBindingsInfo.join(
          ", "
        )}] query: ${i.sql}`
      );
    return i;
  }
  // Compiles the `select` statement, or nested sub-selects by calling each of
  // the component compilers, trimming out the empties, and returning a
  // generated query string.
  select() {
    let e = this.with(), t = "";
    const n = [], i = [];
    rO.forEach((o) => {
      const a = this[o](this);
      switch (o) {
        case "union":
          t = a;
          break;
        case "columns":
        case "join":
        case "where":
          n.push(a);
          break;
        default:
          i.push(a);
          break;
      }
    });
    const s = this.grouped.union && this.grouped.union.map((o) => o.wrap).some((o) => o);
    if (this.onlyUnions()) {
      const o = Ee(n.concat(i)).join(
        " "
      );
      e += t + (o ? " " + o : "");
    } else {
      const o = (s ? "(" : "") + Ee(n).join(" ") + (s ? ")" : ""), a = Ee(i).join(" ");
      e += o + (t ? " " + t : "") + (a && " " + a);
    }
    return e;
  }
  pluck() {
    let e = this.single.pluck;
    return e.indexOf(".") !== -1 && (e = e.split(".").slice(-1)[0]), {
      sql: this.select(),
      pluck: e
    };
  }
  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const e = this.single.insert || [], t = this.with() + `insert into ${this.tableName} `, n = this._insertBody(e);
    return n === "" ? "" : t + n;
  }
  _onConflictClause(e) {
    return e instanceof ue ? this.formatter.wrap(e) : `(${this.formatter.columnize(e)})`;
  }
  _buildInsertValues(e) {
    let t = "", n = -1;
    for (; ++n < e.values.length; )
      n !== 0 && (t += "), ("), t += this.client.parameterize(
        e.values[n],
        this.client.valueForUndefined,
        this.builder,
        this.bindingsHolder
      );
    return t;
  }
  _insertBody(e) {
    let t = "";
    if (Array.isArray(e)) {
      if (e.length === 0)
        return "";
    } else if (typeof e == "object" && zn(e))
      return t + this._emptyInsertValue;
    const n = this._prepInsert(e);
    return typeof n == "string" ? t += n : n.columns.length ? (t += `(${F(
      n.columns,
      this.builder,
      this.client,
      this.bindingsHolder
    )}`, t += ") values (" + this._buildInsertValues(n) + ")") : e.length === 1 && e[0] ? t += this._emptyInsertValue : t = "", t;
  }
  // Compiles the "update" query.
  update() {
    const e = this.with(), { tableName: t } = this, n = this._prepUpdate(this.single.update), i = this.where();
    return e + `update ${this.single.only ? "only " : ""}${t} set ` + n.join(", ") + (i ? ` ${i}` : "");
  }
  _hintComments() {
    let e = this.grouped.hintComments || [];
    return e = e.map((t) => Ee(t.value).join(" ")), e = Ee(e).join(" "), e ? `/*+ ${e} */ ` : "";
  }
  // Compiles the columns in the query, specifying if an item was distinct.
  columns() {
    let e = "";
    if (this.onlyUnions())
      return "";
    const t = this._hintComments(), n = this.grouped.columns || [];
    let i = -1, s = [];
    if (n)
      for (; ++i < n.length; ) {
        const a = n[i];
        if (a.distinct && (e = "distinct "), a.distinctOn) {
          e = this.distinctOn(a.value);
          continue;
        }
        a.type === "aggregate" ? s.push(...this.aggregate(a)) : a.type === "aggregateRaw" ? s.push(this.aggregateRaw(a)) : a.type === "analytic" ? s.push(this.analytic(a)) : a.type === "json" ? s.push(this.json(a)) : a.value && a.value.length > 0 && s.push(
          F(
            a.value,
            this.builder,
            this.client,
            this.bindingsHolder
          )
        );
      }
    return s.length === 0 && (s = ["*"]), `${this.onlyJson() ? "" : "select "}${t}${e}` + s.join(", ") + (this.tableName ? ` from ${this.single.only ? "only " : ""}${this.tableName}` : "");
  }
  _aggregate(e, { aliasSeparator: t = " as ", distinctParentheses: n } = {}) {
    const i = e.value, s = e.method, o = e.aggregateDistinct ? "distinct " : "", a = (m) => O(
      m,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ), u = (m, g) => g ? m + t + a(g) : m, c = (m, g) => {
      let b = m.map(a).join(", ");
      if (o) {
        const x = n ? "(" : " ", ie = n ? ")" : "";
        b = o.trim() + x + b + ie;
      }
      const v = `${s}(${b})`;
      return u(v, g);
    }, l = (m, g) => {
      const b = `${s}(${o + a(m)})`;
      return u(b, g);
    };
    if (Array.isArray(i))
      return [c(i)];
    if (typeof i == "object") {
      if (e.alias)
        throw new Error("When using an object explicit alias can not be used");
      return Object.entries(i).map(([m, g]) => Array.isArray(g) ? c(g, m) : l(g, m));
    }
    const h = i.toLowerCase().indexOf(" as ");
    let d = i, { alias: _ } = e;
    if (h !== -1) {
      if (d = i.slice(0, h), _)
        throw new Error(`Found multiple aliases for same column: ${d}`);
      _ = i.slice(h + 4);
    }
    return [l(d, _)];
  }
  aggregate(e) {
    return this._aggregate(e);
  }
  aggregateRaw(e) {
    const t = e.aggregateDistinct ? "distinct " : "";
    return `${e.method}(${t + le(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    )})`;
  }
  _joinTable(e) {
    return e.schema && !(e.table instanceof ue) ? `${e.schema}.${e.table}` : e.table;
  }
  // Compiles all each of the `join` clauses on the query,
  // including any nested join queries.
  join() {
    let e = "", t = -1;
    const n = this.grouped.join;
    if (!n)
      return "";
    for (; ++t < n.length; ) {
      const i = n[t], s = this._joinTable(i);
      if (t > 0 && (e += " "), i.joinType === "raw")
        e += le(
          i.table,
          void 0,
          this.builder,
          this.client,
          this.bindingsHolder
        );
      else {
        e += i.joinType + " join " + O(
          s,
          void 0,
          this.builder,
          this.client,
          this.bindingsHolder
        );
        let o = -1;
        for (; ++o < i.clauses.length; ) {
          const a = i.clauses[o];
          o > 0 ? e += ` ${a.bool} ` : e += ` ${a.type === "onUsing" ? "using" : "on"} `;
          const u = this[a.type](a);
          u && (e += u);
        }
      }
    }
    return e;
  }
  onBetween(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this._not(e, "between") + " " + e.value.map(
      (t) => this.client.parameter(t, this.builder, this.bindingsHolder)
    ).join(" and ");
  }
  onNull(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " is " + this._not(e, "null");
  }
  onExists(e) {
    return this._not(e, "exists") + " (" + W(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ")";
  }
  onIn(e) {
    if (Array.isArray(e.column))
      return this.multiOnIn(e);
    let t;
    return e.value instanceof ue ? t = this.client.parameter(
      e.value,
      this.builder,
      this.formatter
    ) : t = this.client.parameterize(
      e.value,
      void 0,
      this.builder,
      this.bindingsHolder
    ), O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this._not(e, "in ") + this.wrap(t);
  }
  multiOnIn(e) {
    let t = -1, n = `(${F(
      e.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )}) `;
    for (n += this._not(e, "in ") + "(("; ++t < e.value.length; )
      t !== 0 && (n += "),("), n += this.client.parameterize(
        e.value[t],
        void 0,
        this.builder,
        this.bindingsHolder
      );
    return n + "))";
  }
  // Compiles all `where` statements on the query.
  where() {
    const e = this.grouped.where;
    if (!e)
      return;
    const t = [];
    let n = -1;
    for (; ++n < e.length; ) {
      const i = e[n];
      Object.prototype.hasOwnProperty.call(i, "value") && JT.containsUndefined(i.value) && (this.undefinedBindingsInfo.push(i.column), this._undefinedInWhereClause = !0);
      const s = this[i.type](i);
      s && (t.length === 0 ? t[0] = "where" : t.push(i.bool), t.push(s));
    }
    return t.length > 1 ? t.join(" ") : "";
  }
  group() {
    return this._groupsOrders("group");
  }
  order() {
    return this._groupsOrders("order");
  }
  // Compiles the `having` statements.
  having() {
    const e = this.grouped.having;
    if (!e)
      return "";
    const t = ["having"];
    for (let n = 0, i = e.length; n < i; n++) {
      const s = e[n], o = this[s.type](s);
      o && (t.length === 0 && (t[0] = "where"), (t.length > 1 || t.length === 1 && t[0] !== "having") && t.push(s.bool), t.push(o));
    }
    return t.length > 1 ? t.join(" ") : "";
  }
  havingRaw(e) {
    return this._not(e, "") + le(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    );
  }
  havingWrapped(e) {
    const t = W(
      e.value,
      "where",
      this.builder,
      this.client,
      this.bindingsHolder
    );
    return t && this._not(e, "") + "(" + t.slice(6) + ")" || "";
  }
  havingBasic(e) {
    return this._not(e, "") + O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + Se(
      e.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this.client.parameter(e.value, this.builder, this.bindingsHolder);
  }
  havingNull(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " is " + this._not(e, "null");
  }
  havingExists(e) {
    return this._not(e, "exists") + " (" + W(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ")";
  }
  havingBetween(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this._not(e, "between") + " " + e.value.map(
      (t) => this.client.parameter(t, this.builder, this.bindingsHolder)
    ).join(" and ");
  }
  havingIn(e) {
    return Array.isArray(e.column) ? this.multiHavingIn(e) : O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this._not(e, "in ") + this.wrap(
      this.client.parameterize(
        e.value,
        void 0,
        this.builder,
        this.bindingsHolder
      )
    );
  }
  multiHavingIn(e) {
    return this.multiOnIn(e);
  }
  // Compile the "union" queries attached to the main query.
  union() {
    const e = this.onlyUnions(), t = this.grouped.union;
    if (!t)
      return "";
    let n = "";
    for (let i = 0, s = t.length; i < s; i++) {
      const o = t[i];
      i > 0 && (n += " "), (i > 0 || !e) && (n += o.clause + " ");
      const a = W(
        o.value,
        void 0,
        this.builder,
        this.client,
        this.bindingsHolder
      );
      if (a) {
        const u = o.wrap;
        u && (n += "("), n += a, u && (n += ")");
      }
    }
    return n;
  }
  // If we haven't specified any columns or a `tableName`, we're assuming this
  // is only being used for unions.
  onlyUnions() {
    return (!this.grouped.columns || !!this.grouped.columns[0].value) && this.grouped.union && !this.tableName;
  }
  _getValueOrParameterFromAttribute(e, t) {
    return this.single.skipBinding[e] === !0 ? t ?? this.single[e] : this.client.parameter(
      this.single[e],
      this.builder,
      this.bindingsHolder
    );
  }
  onlyJson() {
    return !this.tableName && this.grouped.columns && this.grouped.columns.length === 1 && this.grouped.columns[0].type === "json";
  }
  limit() {
    return !this.single.limit && this.single.limit !== 0 ? "" : `limit ${this._getValueOrParameterFromAttribute("limit")}`;
  }
  offset() {
    return this.single.offset ? `offset ${this._getValueOrParameterFromAttribute("offset")}` : "";
  }
  // Compiles a `delete` query.
  del() {
    const { tableName: e } = this, t = this.with(), n = this.where(), i = this.join(), s = i ? e + " " : "";
    return t + `delete ${s}from ${this.single.only ? "only " : ""}${e}` + (i ? ` ${i}` : "") + (n ? ` ${n}` : "");
  }
  // Compiles a `truncate` query.
  truncate() {
    return `truncate ${this.tableName}`;
  }
  // Compiles the "locks".
  lock() {
    if (this.single.lock)
      return this[this.single.lock]();
  }
  // Compiles the wait mode on the locks.
  waitMode() {
    if (this.single.waitMode)
      return this[this.single.waitMode]();
  }
  // Fail on unsupported databases
  skipLocked() {
    throw new Error(
      ".skipLocked() is currently only supported on MySQL 8.0+ and PostgreSQL 9.5+"
    );
  }
  // Fail on unsupported databases
  noWait() {
    throw new Error(
      ".noWait() is currently only supported on MySQL 8.0+, MariaDB 10.3.0+ and PostgreSQL 9.5+"
    );
  }
  distinctOn(e) {
    throw new Error(".distinctOn() is currently only supported on PostgreSQL");
  }
  // On Clause
  // ------
  onWrapped(e) {
    const t = this, n = new VT();
    e.value.call(n, n);
    let i = "";
    for (let s = 0; s < n.clauses.length; s++) {
      const o = n.clauses[s];
      s > 0 && (i += ` ${o.bool} `);
      const a = t[o.type](o);
      a && (i += a);
    }
    return i.length ? `(${i})` : "";
  }
  onBasic(e) {
    const t = e.value instanceof Ve;
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + Se(
      e.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + (t ? "(" : "") + O(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + (t ? ")" : "");
  }
  onVal(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + Se(
      e.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this.client.parameter(e.value, this.builder, this.bindingsHolder);
  }
  onRaw(e) {
    return le(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    );
  }
  onUsing(e) {
    return "(" + F(
      e.column,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ")";
  }
  // Where Clause
  // ------
  _valueClause(e) {
    return e.asColumn ? O(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) : this.client.parameter(
      e.value,
      this.builder,
      this.bindingsHolder
    );
  }
  _columnClause(e) {
    let t;
    return Array.isArray(e.column) ? t = `(${F(
      e.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )})` : t = O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ), t;
  }
  whereIn(e) {
    const t = this.client.values(
      e.value,
      this.builder,
      this.bindingsHolder
    );
    return `${this._columnClause(e)} ${this._not(
      e,
      "in "
    )}${t}`;
  }
  whereLike(e) {
    return `${this._columnClause(e)} ${this._not(
      e,
      "like "
    )}${this._valueClause(e)}`;
  }
  whereILike(e) {
    return `${this._columnClause(e)} ${this._not(
      e,
      "ilike "
    )}${this._valueClause(e)}`;
  }
  whereNull(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " is " + this._not(e, "null");
  }
  // Compiles a basic "where" clause.
  whereBasic(e) {
    return this._not(e, "") + O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + Se(
      e.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this._valueClause(e);
  }
  whereExists(e) {
    return this._not(e, "exists") + " (" + W(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ")";
  }
  whereWrapped(e) {
    const t = W(
      e.value,
      "where",
      this.builder,
      this.client,
      this.bindingsHolder
    );
    return t && this._not(e, "") + "(" + t.slice(6) + ")" || "";
  }
  whereBetween(e) {
    return O(
      e.column,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + " " + this._not(e, "between") + " " + e.value.map(
      (t) => this.client.parameter(t, this.builder, this.bindingsHolder)
    ).join(" and ");
  }
  // Compiles a "whereRaw" query.
  whereRaw(e) {
    return this._not(e, "") + le(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    );
  }
  _jsonWrapValue(e) {
    if (!this.builder._isJsonObject(e))
      try {
        return JSON.stringify(JSON.parse(e.replace(/\n|\t/g, "")));
      } catch {
        return e;
      }
    return JSON.stringify(e);
  }
  _jsonValueClause(e) {
    return e.value = this._jsonWrapValue(e.value), this._valueClause(e);
  }
  whereJsonObject(e) {
    return `${this._columnClause(e)} ${e.not ? "!=" : "="} ${this._jsonValueClause(e)}`;
  }
  wrap(e) {
    return e.charAt(0) !== "(" ? `(${e})` : e;
  }
  json(e) {
    return this[e.method](e.params);
  }
  analytic(e) {
    let t = "";
    const n = this;
    return t += e.method + "() over (", e.raw ? t += e.raw : (e.partitions.length && (t += "partition by ", t += Yn(e.partitions, function(i) {
      return Lt(i) ? n.formatter.columnize(i) : n.formatter.columnize(i.column) + (i.order ? " " + i.order : "");
    }).join(", ") + " "), t += "order by ", t += Yn(e.order, function(i) {
      return Lt(i) ? n.formatter.columnize(i) : n.formatter.columnize(i.column) + (i.order ? " " + i.order : "");
    }).join(", ")), t += ")", e.alias && (t += " as " + e.alias), t;
  }
  // Compiles all `with` statements on the query.
  with() {
    if (!this.grouped.with || !this.grouped.with.length)
      return "";
    const e = this.grouped.with;
    if (!e)
      return;
    const t = [];
    let n = -1, i = !1;
    for (; ++n < e.length; ) {
      const s = e[n];
      s.recursive && (i = !0);
      const o = this[s.type](s);
      t.push(o);
    }
    return `with ${i ? "recursive " : ""}${t.join(", ")} `;
  }
  withWrapped(e) {
    const t = W(
      e.value,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ), n = e.columnList ? "(" + F(
      e.columnList,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ")" : "", i = e.materialized === void 0 ? "" : e.materialized ? "materialized " : "not materialized ";
    return t && F(
      e.alias,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + n + " as " + i + "(" + t + ")" || "";
  }
  // Determines whether to add a "not" prefix to the where clause.
  _not(e, t) {
    return e.not ? `not ${t}` : t;
  }
  _prepInsert(e) {
    const t = W(
      e,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    );
    if (t)
      return t;
    let n = [];
    const i = [];
    Array.isArray(e) || (e = e ? [e] : []);
    let s = -1;
    for (; ++s < e.length && e[s] != null; ) {
      s === 0 && (n = Object.keys(e[s]).sort());
      const o = new Array(n.length), a = Object.keys(e[s]);
      let u = -1;
      for (; ++u < a.length; ) {
        const c = a[u];
        let l = n.indexOf(c);
        if (l === -1) {
          n = n.concat(c).sort(), l = n.indexOf(c);
          let h = -1;
          for (; ++h < i.length; )
            i[h].splice(l, 0, void 0);
          o.splice(l, 0, void 0);
        }
        o[l] = e[s][c];
      }
      i.push(o);
    }
    return {
      columns: n,
      values: i
    };
  }
  // "Preps" the update.
  _prepUpdate(e = {}) {
    const { counter: t = {} } = this.single;
    for (const o of Object.keys(t)) {
      if (zT(e, o)) {
        this.client.logger.warn(
          "increment/decrement called for a column that has already been specified in main .update() call. Ignoring increment/decrement and using value from .update() call."
        );
        continue;
      }
      let a = t[o];
      const u = a < 0 ? "-" : "+";
      u === "-" && (a = -a), e[o] = this.client.raw(`?? ${u} ?`, [o, a]);
    }
    e = YT(e, eO);
    const n = [], i = Object.keys(e);
    let s = -1;
    for (; ++s < i.length; )
      n.push(
        O(
          i[s],
          void 0,
          this.builder,
          this.client,
          this.bindingsHolder
        ) + " = " + this.client.parameter(
          e[i[s]],
          this.builder,
          this.bindingsHolder
        )
      );
    if (zn(n))
      throw new Error(
        [
          "Empty .update() call detected!",
          "Update data does not contain any values to update.",
          "This will result in a faulty query.",
          this.single.table ? `Table: ${this.single.table}.` : "",
          this.single.update ? `Columns: ${Object.keys(this.single.update)}.` : ""
        ].join(" ")
      );
    return n;
  }
  _formatGroupsItemValue(e, t) {
    const { formatter: n } = this;
    let i = "";
    t === "last" ? i = " is null" : t === "first" && (i = " is not null");
    let s;
    return e instanceof ue ? s = le(
      e,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) : e instanceof Ve || t ? s = "(" + n.columnize(e) + i + ")" : s = n.columnize(e), s;
  }
  _basicGroupOrder(e, t) {
    const n = this._formatGroupsItemValue(e.value, e.nulls), i = t === "order" && e.type !== "orderByRaw" ? ` ${Xn(
      e.direction,
      this.builder,
      this.client,
      this.bindingsHolder
    )}` : "";
    return n + i;
  }
  _groupOrder(e, t) {
    return this._basicGroupOrder(e, t);
  }
  _groupOrderNulls(e, t) {
    const n = this._formatGroupsItemValue(e.value), i = t === "order" && e.type !== "orderByRaw" ? ` ${Xn(
      e.direction,
      this.builder,
      this.client,
      this.bindingsHolder
    )}` : "";
    return e.nulls && !(e.value instanceof ue) ? `${n}${i || ""} nulls ${e.nulls}` : n + i;
  }
  // Compiles the `order by` statements.
  _groupsOrders(e) {
    const t = this.grouped[e];
    if (!t)
      return "";
    const n = t.map((i) => this._groupOrder(i, e));
    return n.length ? e + " by " + n.join(", ") : "";
  }
  // Get the table name, wrapping it if necessary.
  // Implemented as a property to prevent ordering issues as described in #704.
  get tableName() {
    if (!this._tableName) {
      let e = this.single.table;
      const t = this.single.schema;
      if (e && t) {
        const n = e instanceof Ve, i = e instanceof ue;
        !n && !i && !(typeof e == "function") && (e = `${t}.${e}`);
      }
      this._tableName = e ? (
        // Wrap subQuery with parenthesis, #3485
        O(
          e,
          e instanceof Ve,
          this.builder,
          this.client,
          this.bindingsHolder
        )
      ) : "";
    }
    return this._tableName;
  }
  _jsonPathWrap(e) {
    return this.client.parameter(
      e.path || e[1],
      this.builder,
      this.bindingsHolder
    );
  }
  // Json common functions
  _jsonExtract(e, t) {
    let n;
    return Array.isArray(t.column) ? n = t.column : n = [t], Array.isArray(e) || (e = [e]), n.map((i) => {
      let s = `${F(
        i.column || i[0],
        this.builder,
        this.client,
        this.bindingsHolder
      )}, ${this._jsonPathWrap(i)}`;
      e.forEach((a) => {
        s = a + "(" + s + ")";
      });
      const o = i.alias || i[2];
      return o ? this.client.alias(s, this.formatter.wrap(o)) : s;
    }).join(", ");
  }
  _jsonSet(e, t) {
    const n = `${e}(${F(
      t.column,
      this.builder,
      this.client,
      this.bindingsHolder
    )}, ${this.client.parameter(
      t.path,
      this.builder,
      this.bindingsHolder
    )}, ${this.client.parameter(
      t.value,
      this.builder,
      this.bindingsHolder
    )})`;
    return t.alias ? this.client.alias(n, this.formatter.wrap(t.alias)) : n;
  }
  _whereJsonPath(e, t) {
    return `${e}(${this._columnClause(
      t
    )}, ${this._jsonPathWrap({ path: t.jsonPath })}) ${Se(
      t.operator,
      this.builder,
      this.client,
      this.bindingsHolder
    )} ${this._jsonValueClause(t)}`;
  }
  _onJsonPathEquals(e, t) {
    return e + "(" + O(
      t.columnFirst,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ", " + this.client.parameter(
      t.jsonPathFirst,
      this.builder,
      this.bindingsHolder
    ) + ") = " + e + "(" + O(
      t.columnSecond,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    ) + ", " + this.client.parameter(
      t.jsonPathSecond,
      this.builder,
      this.bindingsHolder
    ) + ")";
  }
};
var iO = nO;
const { EventEmitter: sO } = E, oO = vt, aO = re, { addQueryContext: uO } = k, lO = Ar, {
  augmentWithBuilderInterface: cO
} = Er;
let K = class extends sO {
  constructor(e) {
    super(), this.client = e, this._sequence = [], e.config && (this._debug = e.config.debug, lO(this, 4));
  }
  withSchema(e) {
    return this._schema = e, this;
  }
  toString() {
    return this.toQuery();
  }
  toSQL() {
    return this.client.schemaCompiler(this).toSQL();
  }
  async generateDdlCommands() {
    return await this.client.schemaCompiler(this).generateDdlCommands();
  }
};
[
  "createTable",
  "createTableIfNotExists",
  "createTableLike",
  "createView",
  "createViewOrReplace",
  "createMaterializedView",
  "refreshMaterializedView",
  "dropView",
  "dropViewIfExists",
  "dropMaterializedView",
  "dropMaterializedViewIfExists",
  "createSchema",
  "createSchemaIfNotExists",
  "dropSchema",
  "dropSchemaIfExists",
  "createExtension",
  "createExtensionIfNotExists",
  "dropExtension",
  "dropExtensionIfExists",
  "table",
  "alterTable",
  "view",
  "alterView",
  "hasTable",
  "hasColumn",
  "dropTable",
  "renameTable",
  "renameView",
  "dropTableIfExists",
  "raw"
].forEach(function(r) {
  K.prototype[r] = function() {
    return r === "createTableIfNotExists" && this.client.logger.warn(
      [
        "Use async .hasTable to check if table exists and then use plain .createTable. Since ",
        '.createTableIfNotExists actually just generates plain "CREATE TABLE IF NOT EXIST..." ',
        "query it will not work correctly if there are any alter table queries generated for ",
        "columns afterwards. To not break old migrations this function is left untouched for now",
        ", but it should not be used when writing new code and it is removed from documentation."
      ].join("")
    ), r === "table" && (r = "alterTable"), r === "view" && (r = "alterView"), this._sequence.push({
      method: r,
      args: oO(arguments)
    }), this;
  };
});
K.extend = (r, e) => {
  if (Object.prototype.hasOwnProperty.call(K.prototype, r))
    throw new Error(
      `Can't extend SchemaBuilder with existing method ('${r}').`
    );
  aO(K.prototype, { [r]: e });
};
cO(K);
uO(K);
var hO = K;
const dO = wt, { isString: Ns } = j;
function fO(r) {
  r && (Ns(r) && (r = { sql: r }), r.bindings || (r.bindings = this.bindingsHolder.bindings), this.sequence.push(r), this.formatter = this.client.formatter(this._commonBuilder), this.bindings = [], this.formatter.bindings = this.bindings);
}
function pO(r) {
  const e = new this.constructor(
    this.client,
    this.tableCompiler,
    this.columnBuilder
  );
  r.call(e, dO(arguments)), this.sequence.additional = (this.sequence.additional || []).concat(
    e.sequence
  );
}
function gO(r) {
  r && (Ns(r) && (r = { sql: r }), r.bindings || (r.bindings = this.bindingsHolder.bindings), this.sequence.unshift(r), this.formatter = this.client.formatter(this._commonBuilder), this.bindings = [], this.formatter.bindings = this.bindings);
}
var Tt = {
  pushAdditional: pO,
  pushQuery: fO,
  unshiftQuery: gO
};
const {
  pushQuery: yO,
  pushAdditional: mO,
  unshiftQuery: bO
} = Tt;
let S = class {
  constructor(e, t) {
    this.builder = t, this._commonBuilder = this.builder, this.client = e, this.schema = t._schema, this.bindings = [], this.bindingsHolder = this, this.formatter = e.formatter(t), this.formatter.bindings = this.bindings, this.sequence = [];
  }
  createSchema() {
    Ge("createSchema");
  }
  createSchemaIfNotExists() {
    Ge("createSchemaIfNotExists");
  }
  dropSchema() {
    Ge("dropSchema");
  }
  dropSchemaIfExists() {
    Ge("dropSchemaIfExists");
  }
  dropTable(e) {
    this.pushQuery(
      this.dropTablePrefix + this.formatter.wrap(Ft(this.schema, e))
    );
  }
  dropTableIfExists(e) {
    this.pushQuery(
      this.dropTablePrefix + "if exists " + this.formatter.wrap(Ft(this.schema, e))
    );
  }
  dropView(e) {
    this._dropView(e, !1, !1);
  }
  dropViewIfExists(e) {
    this._dropView(e, !0, !1);
  }
  dropMaterializedView(e) {
    throw new Error("materialized views are not supported by this dialect.");
  }
  dropMaterializedViewIfExists(e) {
    throw new Error("materialized views are not supported by this dialect.");
  }
  renameView(e, t) {
    throw new Error(
      "rename view is not supported by this dialect (instead drop then create another view)."
    );
  }
  refreshMaterializedView() {
    throw new Error("materialized views are not supported by this dialect.");
  }
  _dropView(e, t, n) {
    this.pushQuery(
      (n ? this.dropMaterializedViewPrefix : this.dropViewPrefix) + (t ? "if exists " : "") + this.formatter.wrap(Ft(this.schema, e))
    );
  }
  raw(e, t) {
    this.sequence.push(this.client.raw(e, t).toSQL());
  }
  toSQL() {
    const e = this.builder._sequence;
    for (let t = 0, n = e.length; t < n; t++) {
      const i = e[t];
      this[i.method].apply(this, i.args);
    }
    return this.sequence;
  }
  async generateDdlCommands() {
    const e = this.toSQL();
    return {
      pre: [],
      sql: Array.isArray(e) ? e : [e],
      check: null,
      post: []
    };
  }
};
S.prototype.dropTablePrefix = "drop table ";
S.prototype.dropViewPrefix = "drop view ";
S.prototype.dropMaterializedViewPrefix = "drop materialized view ";
S.prototype.alterViewPrefix = "alter view ";
S.prototype.alterTable = Ot("alter");
S.prototype.createTable = Ot("create");
S.prototype.createTableIfNotExists = Ot("createIfNot");
S.prototype.createTableLike = Ot("createLike");
S.prototype.createView = At("create");
S.prototype.createViewOrReplace = At("createOrReplace");
S.prototype.createMaterializedView = At(
  "createMaterializedView"
);
S.prototype.alterView = At("alter");
S.prototype.pushQuery = yO;
S.prototype.pushAdditional = mO;
S.prototype.unshiftQuery = bO;
function tr(r) {
  const e = this.builder.queryContext();
  e !== void 0 && r.queryContext() === void 0 && r.queryContext(e), r.setSchema(this.schema);
  const t = r.toSQL();
  for (let n = 0, i = t.length; n < i; n++)
    this.sequence.push(t[n]);
}
function Ot(r) {
  return r === "createLike" ? function(e, t, n) {
    const i = this.client.tableBuilder(
      r,
      e,
      t,
      n
    );
    tr.call(this, i);
  } : function(e, t) {
    const n = this.client.tableBuilder(r, e, null, t);
    tr.call(this, n);
  };
}
function At(r) {
  return function(e, t) {
    const n = this.client.viewBuilder(r, e, t);
    tr.call(this, n);
  };
}
function Ft(r, e) {
  return r ? `${r}.${e}` : e;
}
function Ge(r) {
  throw new Error(
    `${r} is not supported for this dialect (only PostgreSQL supports it currently).`
  );
}
var _O = S, wO = Z, vO = dr, $O = ee, CO = vO(function(r, e) {
  wO(e, $O(e), r);
}), TO = CO, Nr = TO;
const OO = os, Zn = Nr, AO = re, Et = vt, EO = k, { isString: SO, isFunction: IO, isObject: xO } = j;
let J = class {
  constructor(e, t, n, i, s) {
    if (this.client = e, this._fn = s, this._method = t, this._schemaName = void 0, this._tableName = n, this._tableNameLike = i, this._statements = [], this._single = {}, !i && !IO(this._fn))
      throw new TypeError(
        "A callback function must be supplied to calls against `.createTable` and `.table`"
      );
  }
  setSchema(e) {
    this._schemaName = e;
  }
  // Convert the current tableBuilder object "toSQL"
  // giving us additional methods if we're altering
  // rather than creating the table.
  toSQL() {
    return this._method === "alter" && Zn(this, rr), this._fn && this._fn.call(this, this), this.client.tableCompiler(this).toSQL();
  }
  // The "timestamps" call is really just sets the `created_at` and `updated_at` columns.
  timestamps(e, t, n) {
    xO(e) && ({ useTimestamps: e, defaultToNow: t, useCamelCase: n } = e);
    const i = e === !0 ? "timestamp" : "datetime", s = this[i](n ? "createdAt" : "created_at"), o = this[i](n ? "updatedAt" : "updated_at");
    if (t === !0) {
      const a = this.client.raw("CURRENT_TIMESTAMP");
      s.notNullable().defaultTo(a), o.notNullable().defaultTo(a);
    }
  }
  // Set the comment value for a table, they're only allowed to be called
  // once per table.
  comment(e) {
    if (typeof e != "string")
      throw new TypeError("Table comment must be string");
    this._single.comment = e;
  }
  // Set a foreign key on the table, calling
  // `table.foreign('column_name').references('column').on('table').onDelete()...
  // Also called from the ColumnBuilder context when chaining.
  foreign(e, t) {
    const n = { column: e, keyName: t };
    this._statements.push({
      grouping: "alterTable",
      method: "foreign",
      args: [n]
    });
    let i = {
      references(s) {
        let o;
        return SO(s) && (o = s.split(".")), !o || o.length === 1 ? (n.references = o ? o[0] : s, {
          on(a) {
            if (typeof a != "string")
              throw new TypeError(
                `Expected tableName to be a string, got: ${typeof a}`
              );
            return n.inTable = a, i;
          },
          inTable() {
            return this.on.apply(this, arguments);
          }
        }) : (n.inTable = o[0], n.references = o[1], i);
      },
      withKeyName(s) {
        return n.keyName = s, i;
      },
      onUpdate(s) {
        return n.onUpdate = s, i;
      },
      onDelete(s) {
        return n.onDelete = s, i;
      },
      deferrable: (s) => {
        if ([
          "mysql",
          "mssql",
          "redshift",
          "mysql2",
          "oracledb"
        ].indexOf(this.client.dialect) !== -1)
          throw new Error(`${this.client.dialect} does not support deferrable`);
        return n.deferrable = s, i;
      },
      _columnBuilder(s) {
        return Zn(s, i), i = s, s;
      }
    };
    return i;
  }
  check(e, t, n) {
    return this._statements.push({
      grouping: "checks",
      args: [e, t, n]
    }), this;
  }
};
[
  // Each of the index methods can be called individually, with the
  // column name to be used, e.g. table.unique('column').
  "index",
  "primary",
  "unique",
  // Key specific
  "dropPrimary",
  "dropUnique",
  "dropIndex",
  "dropForeign"
].forEach((r) => {
  J.prototype[r] = function() {
    return this._statements.push({
      grouping: "alterTable",
      method: r,
      args: Et(arguments)
    }), this;
  };
});
const PO = {
  mysql: ["engine", "charset", "collate"],
  postgresql: ["inherits"]
};
OO(PO, function(r, e) {
  r.forEach(function(t) {
    J.prototype[t] = function(n) {
      if (this.client.dialect !== e)
        throw new Error(
          `Knex only supports ${t} statement with ${e}.`
        );
      if (this._method === "alter")
        throw new Error(
          `Knex does not support altering the ${t} outside of create table, please use knex.raw statement.`
        );
      this._single[t] = n;
    };
  });
});
EO.addQueryContext(J);
const NO = [
  // Numeric
  "tinyint",
  "smallint",
  "mediumint",
  "int",
  "bigint",
  "decimal",
  "float",
  "double",
  "real",
  "bit",
  "boolean",
  "serial",
  // Date / Time
  "date",
  "datetime",
  "timestamp",
  "time",
  "year",
  // Geometry
  "geometry",
  "geography",
  "point",
  // String
  "char",
  "varchar",
  "tinytext",
  "tinyText",
  "text",
  "mediumtext",
  "mediumText",
  "longtext",
  "longText",
  "binary",
  "varbinary",
  "tinyblob",
  "tinyBlob",
  "mediumblob",
  "mediumBlob",
  "blob",
  "longblob",
  "longBlob",
  "enum",
  "set",
  // Increments, Aliases, and Additional
  "bool",
  "dateTime",
  "increments",
  "bigincrements",
  "bigIncrements",
  "integer",
  "biginteger",
  "bigInteger",
  "string",
  "json",
  "jsonb",
  "uuid",
  "enu",
  "specificType"
];
NO.forEach((r) => {
  J.prototype[r] = function() {
    const e = Et(arguments), t = this.client.columnBuilder(this, r, e);
    return this._statements.push({
      grouping: "columns",
      builder: t
    }), t;
  };
});
const rr = {
  // Renames the current column `from` the current
  // TODO: this.column(from).rename(to)
  renameColumn(r, e) {
    return this._statements.push({
      grouping: "alterTable",
      method: "renameColumn",
      args: [r, e]
    }), this;
  },
  dropTimestamps() {
    return this.dropColumns(
      arguments[0] === !0 ? ["createdAt", "updatedAt"] : ["created_at", "updated_at"]
    );
  },
  setNullable(r) {
    return this._statements.push({
      grouping: "alterTable",
      method: "setNullable",
      args: [r]
    }), this;
  },
  check(r, e, t) {
    this._statements.push({
      grouping: "alterTable",
      method: "check",
      args: [r, e, t]
    });
  },
  dropChecks() {
    this._statements.push({
      grouping: "alterTable",
      method: "dropChecks",
      args: Et(arguments)
    });
  },
  dropNullable(r) {
    return this._statements.push({
      grouping: "alterTable",
      method: "dropNullable",
      args: [r]
    }), this;
  }
  // TODO: changeType
};
rr.dropColumn = rr.dropColumns = function() {
  return this._statements.push({
    grouping: "alterTable",
    method: "dropColumn",
    args: Et(arguments)
  }), this;
};
J.extend = (r, e) => {
  if (Object.prototype.hasOwnProperty.call(J.prototype, r))
    throw new Error(
      `Can't extend TableBuilder with existing method ('${r}').`
    );
  AO(J.prototype, { [r]: e });
};
var jO = J;
function BO(r, e, t, n) {
  for (var i = r.length, s = t + (n ? 1 : -1); n ? s-- : ++s < i; )
    if (e(r[s], s, r))
      return s;
  return -1;
}
var qO = BO;
function kO(r) {
  return r !== r;
}
var RO = kO;
function MO(r, e, t) {
  for (var n = t - 1, i = r.length; ++n < i; )
    if (r[n] === e)
      return n;
  return -1;
}
var LO = MO, FO = qO, HO = RO, QO = LO;
function WO(r, e, t) {
  return e === e ? QO(r, e, t) : FO(r, HO, t);
}
var DO = WO, UO = DO, JO = Si, VO = Math.max;
function GO(r, e, t) {
  var n = r == null ? 0 : r.length;
  if (!n)
    return -1;
  var i = t == null ? 0 : JO(t);
  return i < 0 && (i = VO(n + i, 0)), UO(r, e, i);
}
var KO = GO;
const {
  pushAdditional: zO,
  pushQuery: YO,
  unshiftQuery: XO
} = Tt, ZO = k, eA = Ct, tA = KO, ei = bt, rA = wt, { normalizeArr: nA } = k;
let R = class {
  constructor(e, t) {
    this.client = e, this.tableBuilder = t, this._commonBuilder = this.tableBuilder, this.method = t._method, this.schemaNameRaw = t._schemaName, this.tableNameRaw = t._tableName, this.tableNameLikeRaw = t._tableNameLike, this.single = t._single, this.grouped = eA(t._statements, "grouping"), this.formatter = e.formatter(t), this.bindings = [], this.formatter.bindings = this.bindings, this.bindingsHolder = this, this.sequence = [], this._formatting = e.config && e.config.formatting, this.checksCount = 0;
  }
  // Convert the tableCompiler toSQL
  toSQL() {
    return this[this.method](), this.sequence;
  }
  // Column Compilation
  // -------
  // If this is a table "creation", we need to first run through all
  // of the columns to build them into a single string,
  // and then run through anything else and push it to the query sequence.
  create(e, t) {
    const i = this.getColumns().map((o) => o.toSQL()), s = this.getColumnTypes(i);
    this.createAlterTableMethods && this.alterTableForCreate(s), this.createQuery(s, e, t), this.columnQueries(i), delete this.single.comment, this.alterTable();
  }
  // Only create the table if it doesn't exist.
  createIfNot() {
    this.create(!0);
  }
  createLike() {
    this.create(!1, !0);
  }
  createLikeIfNot() {
    this.create(!0, !0);
  }
  // If we're altering the table, we need to one-by-one
  // go through and handle each of the queries associated
  // with altering the table's schema.
  alter() {
    const t = this.getColumns().map((a) => a.toSQL()), n = this.getColumns("alter"), i = n.map((a) => a.toSQL()), s = this.getColumnTypes(t), o = this.getColumnTypes(i);
    this.addColumns(s), this.alterColumns(o, n), this.columnQueries(t), this.columnQueries(i), this.alterTable();
  }
  foreign(e) {
    if (e.inTable && e.references) {
      const t = e.keyName ? this.formatter.wrap(e.keyName) : this._indexCommand("foreign", this.tableNameRaw, e.column), n = this.formatter.columnize(e.column), i = this.formatter.columnize(e.references), s = this.formatter.wrap(e.inTable), o = e.onUpdate ? (this.lowerCase ? " on update " : " ON UPDATE ") + e.onUpdate : "", a = e.onDelete ? (this.lowerCase ? " on delete " : " ON DELETE ") + e.onDelete : "", u = e.deferrable ? this.lowerCase ? ` deferrable initially ${e.deferrable.toLowerCase()} ` : ` DEFERRABLE INITIALLY ${e.deferrable.toUpperCase()} ` : "";
      this.lowerCase ? this.pushQuery(
        (this.forCreate ? "" : `alter table ${this.tableName()} add `) + "constraint " + t + " foreign key (" + n + ") references " + s + " (" + i + ")" + o + a + u
      ) : this.pushQuery(
        (this.forCreate ? "" : `ALTER TABLE ${this.tableName()} ADD `) + "CONSTRAINT " + t + " FOREIGN KEY (" + n + ") REFERENCES " + s + " (" + i + ")" + o + a + u
      );
    }
  }
  // Get all of the column sql & bindings individually for building the table queries.
  getColumnTypes(e) {
    return e.reduce(
      function(t, n) {
        const i = n[0];
        return t.sql.push(i.sql), t.bindings.concat(i.bindings), t;
      },
      { sql: [], bindings: [] }
    );
  }
  // Adds all of the additional queries from the "column"
  columnQueries(e) {
    const t = e.reduce(function(n, i) {
      const s = rA(i);
      return ei(s) ? n : n.concat(s);
    }, []);
    for (const n of t)
      this.pushQuery(n);
  }
  // All of the columns to "add" for the query
  addColumns(e, t) {
    if (t = t || this.addColumnsPrefix, e.sql.length > 0) {
      const n = e.sql.map((i) => t + i);
      this.pushQuery({
        sql: (this.lowerCase ? "alter table " : "ALTER TABLE ") + this.tableName() + " " + n.join(", "),
        bindings: e.bindings
      });
    }
  }
  alterColumns(e, t) {
    e.sql.length > 0 && this.addColumns(e, this.alterColumnsPrefix, t);
  }
  // Compile the columns as needed for the current create or alter table
  getColumns(e) {
    const t = this.grouped.columns || [];
    e = e || "add";
    const n = this.tableBuilder.queryContext();
    return t.filter((i) => i.builder._method === e).map((i) => (n !== void 0 && i.builder.queryContext() === void 0 && i.builder.queryContext(n), this.client.columnCompiler(this, i.builder)));
  }
  tableName() {
    const e = this.schemaNameRaw ? `${this.schemaNameRaw}.${this.tableNameRaw}` : this.tableNameRaw;
    return this.formatter.wrap(e);
  }
  tableNameLike() {
    const e = this.schemaNameRaw ? `${this.schemaNameRaw}.${this.tableNameLikeRaw}` : this.tableNameLikeRaw;
    return this.formatter.wrap(e);
  }
  // Generate all of the alter column statements necessary for the query.
  alterTable() {
    const e = this.grouped.alterTable || [];
    for (let t = 0, n = e.length; t < n; t++) {
      const i = e[t];
      this[i.method] ? this[i.method].apply(this, i.args) : this.client.logger.error(`Debug: ${i.method} does not exist`);
    }
    for (const t in this.single)
      typeof this[t] == "function" && this[t](this.single[t]);
  }
  alterTableForCreate(e) {
    this.forCreate = !0;
    const t = this.sequence, n = this.grouped.alterTable || [];
    this.grouped.alterTable = [];
    for (let i = 0, s = n.length; i < s; i++) {
      const o = n[i];
      if (tA(this.createAlterTableMethods, o.method) < 0) {
        this.grouped.alterTable.push(o);
        continue;
      }
      this[o.method] ? (this.sequence = [], this[o.method].apply(this, o.args), e.sql.push(this.sequence[0].sql)) : this.client.logger.error(`Debug: ${o.method} does not exist`);
    }
    this.sequence = t, this.forCreate = !1;
  }
  // Drop the index on the current table.
  dropIndex(e) {
    this.pushQuery(`drop index${e}`);
  }
  dropUnique() {
    throw new Error("Method implemented in the dialect driver");
  }
  dropForeign() {
    throw new Error("Method implemented in the dialect driver");
  }
  dropColumn() {
    const e = ZO.normalizeArr.apply(null, arguments), t = (Array.isArray(e) ? e : [e]).map(
      (n) => this.dropColumnPrefix + this.formatter.wrap(n)
    );
    this.pushQuery(
      (this.lowerCase ? "alter table " : "ALTER TABLE ") + this.tableName() + " " + t.join(", ")
    );
  }
  //Default implementation of setNullable. Overwrite on dialect-specific tablecompiler when needed
  //(See postgres/mssql for reference)
  _setNullableState(e, t) {
    const n = this.tableName(), i = this.formatter.columnize(e), s = this.alterColumnsPrefix;
    return this.pushQuery({
      sql: "SELECT 1",
      output: () => this.client.queryBuilder().from(this.tableNameRaw).columnInfo(e).then((o) => {
        if (ei(o))
          throw new Error(
            `.setNullable: Column ${i} does not exist in table ${n}.`
          );
        const a = t ? "null" : "not null", u = o.type + (o.maxLength ? `(${o.maxLength})` : ""), c = o.defaultValue !== null && o.defaultValue !== void 0 ? `default '${o.defaultValue}'` : "", l = `alter table ${n} ${s} ${i} ${u} ${a} ${c}`;
        return this.client.raw(l);
      })
    });
  }
  setNullable(e) {
    return this._setNullableState(e, !0);
  }
  dropNullable(e) {
    return this._setNullableState(e, !1);
  }
  dropChecks(e) {
    if (e === void 0)
      return "";
    e = nA(e);
    const n = `alter table ${this.tableName()} ${e.map((i) => `drop constraint ${i}`).join(", ")}`;
    this.pushQuery(n);
  }
  check(e, t, n) {
    const i = this.tableName();
    let s = n;
    s || (this.checksCount++, s = i + "_" + this.checksCount);
    const o = `alter table ${i} add constraint ${s} check(${e})`;
    this.pushQuery(o);
  }
  _addChecks() {
    return this.grouped.checks ? ", " + this.grouped.checks.map((e) => `${e.args[2] ? "constraint " + e.args[2] + " " : ""}check (${this.client.raw(e.args[0], e.args[1])})`).join(", ") : "";
  }
  // If no name was specified for this index, we will create one using a basic
  // convention of the table name, followed by the columns, followed by an
  // index type, such as primary or index, which makes the index unique.
  _indexCommand(e, t, n) {
    Array.isArray(n) || (n = n ? [n] : []);
    const s = (t.replace(/\.|-/g, "_") + "_" + n.join("_") + "_" + e).toLowerCase();
    return this.formatter.wrap(s);
  }
  _getPrimaryKeys() {
    return (this.grouped.alterTable || []).filter((e) => e.method === "primary").flatMap((e) => e.args).flat();
  }
  _canBeAddPrimaryKey(e) {
    return e.primaryKey && this._getPrimaryKeys().length === 0;
  }
  _getIncrementsColumnNames() {
    return this.grouped.columns.filter((e) => e.builder._type === "increments").map((e) => e.builder._args[0]);
  }
};
R.prototype.pushQuery = YO;
R.prototype.pushAdditional = zO;
R.prototype.unshiftQuery = XO;
R.prototype.lowerCase = !0;
R.prototype.createAlterTableMethods = null;
R.prototype.addColumnsPrefix = "add column ";
R.prototype.alterColumnsPrefix = "alter column ";
R.prototype.modifyColumnPrefix = "modify column ";
R.prototype.dropColumnPrefix = "drop column ";
var iA = R;
const sA = Nr, oA = re, js = vt, { addQueryContext: aA } = k;
let H = class {
  constructor(e, t, n, i) {
    this.client = e, this._method = "add", this._single = {}, this._modifiers = {}, this._statements = [], this._type = cA[n] || n, this._args = i, this._tableBuilder = t, t._method === "alter" && sA(this, St);
  }
  // Specify that the current column "references" a column,
  // which may be tableName.column or just "column"
  references(e) {
    return this._tableBuilder.foreign.call(this._tableBuilder, this._args[0], void 0, this)._columnBuilder(this).references(e);
  }
};
const uA = [
  "default",
  "defaultsTo",
  "defaultTo",
  "unsigned",
  "nullable",
  "first",
  "after",
  "comment",
  "collate",
  "check",
  "checkPositive",
  "checkNegative",
  "checkIn",
  "checkNotIn",
  "checkBetween",
  "checkLength",
  "checkRegex"
], lA = {
  default: "defaultTo",
  defaultsTo: "defaultTo"
};
uA.forEach(function(r) {
  const e = lA[r] || r;
  H.prototype[r] = function() {
    return this._modifiers[e] = js(arguments), this;
  };
});
aA(H);
H.prototype.notNull = H.prototype.notNullable = function() {
  return this.nullable(!1);
};
["index", "primary", "unique"].forEach(function(r) {
  H.prototype[r] = function() {
    return this._type.toLowerCase().indexOf("increments") === -1 && this._tableBuilder[r].apply(
      this._tableBuilder,
      [this._args[0]].concat(js(arguments))
    ), this;
  };
});
H.extend = (r, e) => {
  if (Object.prototype.hasOwnProperty.call(H.prototype, r))
    throw new Error(
      `Can't extend ColumnBuilder with existing method ('${r}').`
    );
  oA(H.prototype, { [r]: e });
};
const St = {};
St.drop = function() {
  return this._single.drop = !0, this;
};
St.alterType = function(r) {
  return this._statements.push({
    grouping: "alterType",
    value: r
  }), this;
};
St.alter = function({
  alterNullable: r = !0,
  alterType: e = !0
} = {}) {
  return this._method = "alter", this.alterNullable = r, this.alterType = e, this;
};
const cA = {
  float: "floating",
  enum: "enu",
  boolean: "bool",
  string: "varchar",
  bigint: "bigInteger"
};
var hA = H;
function dA(r) {
  return r && r.length ? r[0] : void 0;
}
var fA = dA, pA = fA;
const jr = Tt, gA = Ct, yA = pA, mA = Ps, bA = wt, { toNumber: ce } = k, { formatDefault: _A } = Ir, { operator: Ht } = $e;
let C = class {
  constructor(e, t, n) {
    this.client = e, this.tableCompiler = t, this.columnBuilder = n, this._commonBuilder = this.columnBuilder, this.args = n._args, this.type = n._type.toLowerCase(), this.grouped = gA(n._statements, "grouping"), this.modified = n._modifiers, this.isIncrements = this.type.indexOf("increments") !== -1, this.formatter = e.formatter(n), this.bindings = [], this.formatter.bindings = this.bindings, this.bindingsHolder = this, this.sequence = [], this.modifiers = [], this.checksCount = 0;
  }
  _addCheckModifiers() {
    this.modifiers.push(
      "check",
      "checkPositive",
      "checkNegative",
      "checkIn",
      "checkNotIn",
      "checkBetween",
      "checkLength",
      "checkRegex"
    );
  }
  defaults(e) {
    if (Object.prototype.hasOwnProperty.call(this._defaultMap, e))
      return this._defaultMap[e].bind(this)();
    throw new Error(
      `There is no default for the specified identifier ${e}`
    );
  }
  // To convert to sql, we first go through and build the
  // column as it would be in the insert statement
  toSQL() {
    return this.pushQuery(this.compileColumn()), this.sequence.additional && (this.sequence = this.sequence.concat(this.sequence.additional)), this.sequence;
  }
  // Compiles a column.
  compileColumn() {
    return this.formatter.wrap(this.getColumnName()) + " " + this.getColumnType() + this.getModifiers();
  }
  // Assumes the autoincrementing key is named `id` if not otherwise specified.
  getColumnName() {
    return yA(this.args) || this.defaults("columnName");
  }
  getColumnType() {
    if (!this._columnType) {
      const e = this[this.type];
      this._columnType = typeof e == "function" ? e.apply(this, bA(this.args)) : e;
    }
    return this._columnType;
  }
  getModifiers() {
    const e = [];
    for (let t = 0, n = this.modifiers.length; t < n; t++) {
      const i = this.modifiers[t];
      if ((!this.isIncrements || this.isIncrements && i === "comment") && mA(this.modified, i)) {
        const s = this[i].apply(this, this.modified[i]);
        s && e.push(s);
      }
    }
    return e.length > 0 ? ` ${e.join(" ")}` : "";
  }
  // Types
  // ------
  varchar(e) {
    return `varchar(${ce(e, 255)})`;
  }
  floating(e, t) {
    return `float(${ce(e, 8)}, ${ce(t, 2)})`;
  }
  decimal(e, t) {
    if (e === null)
      throw new Error(
        "Specifying no precision on decimal columns is not supported for that SQL dialect."
      );
    return `decimal(${ce(e, 8)}, ${ce(t, 2)})`;
  }
  // Used to support custom types
  specifictype(e) {
    return e;
  }
  // Modifiers
  // -------
  nullable(e) {
    return e === !1 ? "not null" : "null";
  }
  notNullable() {
    return this.nullable(!1);
  }
  defaultTo(e) {
    return `default ${_A(e, this.type, this.client)}`;
  }
  increments(e = { primaryKey: !0 }) {
    return "integer not null" + (this.tableCompiler._canBeAddPrimaryKey(e) ? " primary key" : "") + " autoincrement";
  }
  bigincrements(e = { primaryKey: !0 }) {
    return this.increments(e);
  }
  _pushAlterCheckQuery(e, t) {
    let n = t;
    n || (this.checksCount++, n = this.tableCompiler.tableNameRaw + "_" + this.getColumnName() + "_" + this.checksCount), this.pushAdditional(function() {
      this.pushQuery(
        `alter table ${this.tableCompiler.tableName()} add constraint ${n} check(${e})`
      );
    });
  }
  _checkConstraintName(e) {
    return e ? `constraint ${e} ` : "";
  }
  _check(e, t) {
    return this.columnBuilder._method === "alter" ? (this._pushAlterCheckQuery(e, t), "") : `${this._checkConstraintName(
      t
    )}check (${e})`;
  }
  checkPositive(e) {
    return this._check(
      `${this.formatter.wrap(this.getColumnName())} ${Ht(
        ">",
        this.columnBuilder,
        this.bindingsHolder
      )} 0`,
      e
    );
  }
  checkNegative(e) {
    return this._check(
      `${this.formatter.wrap(this.getColumnName())} ${Ht(
        "<",
        this.columnBuilder,
        this.bindingsHolder
      )} 0`,
      e
    );
  }
  _checkIn(e, t, n) {
    return this._check(
      `${this.formatter.wrap(this.getColumnName())} ${n ? "not " : ""}in (${e.map((i) => this.client._escapeBinding(i)).join(",")})`,
      t
    );
  }
  checkIn(e, t) {
    return this._checkIn(e, t);
  }
  checkNotIn(e, t) {
    return this._checkIn(e, t, !0);
  }
  checkBetween(e, t) {
    e.length === 2 && !Array.isArray(e[0]) && !Array.isArray(e[1]) && (e = [e]);
    const n = e.map((i) => `${this.formatter.wrap(
      this.getColumnName()
    )} between ${this.client._escapeBinding(
      i[0]
    )} and ${this.client._escapeBinding(i[1])}`).join(" or ");
    return this._check(n, t);
  }
  checkLength(e, t, n) {
    return this._check(
      `length(${this.formatter.wrap(this.getColumnName())}) ${Ht(
        e,
        this.columnBuilder,
        this.bindingsHolder
      )} ${ce(t)}`,
      n
    );
  }
};
C.prototype.binary = "blob";
C.prototype.bool = "boolean";
C.prototype.date = "date";
C.prototype.datetime = "datetime";
C.prototype.time = "time";
C.prototype.timestamp = "timestamp";
C.prototype.geometry = "geometry";
C.prototype.geography = "geography";
C.prototype.point = "point";
C.prototype.enu = "varchar";
C.prototype.bit = C.prototype.json = "text";
C.prototype.uuid = ({
  useBinaryUuid: r = !1,
  primaryKey: e = !1
} = {}) => r ? "binary(16)" : "char(36)";
C.prototype.integer = C.prototype.smallint = C.prototype.mediumint = "integer";
C.prototype.biginteger = "bigint";
C.prototype.text = "text";
C.prototype.tinyint = "tinyint";
C.prototype.pushQuery = jr.pushQuery;
C.prototype.pushAdditional = jr.pushAdditional;
C.prototype.unshiftQuery = jr.unshiftQuery;
C.prototype._defaultMap = {
  columnName: function() {
    if (!this.isIncrements)
      throw new Error(
        `You did not specify a column name for the ${this.type} column.`
      );
    return "id";
  }
};
var wA = C;
const vA = Pr;
let $A = class extends vA {
  constructor(e, t) {
    super(e), this.ref = t, this._schema = null, this._alias = null;
  }
  withSchema(e) {
    return this._schema = e, this;
  }
  as(e) {
    return this._alias = e, this;
  }
  toSQL() {
    const e = this._schema ? `${this._schema}.${this.ref}` : this.ref, t = this.client.formatter(this), n = t.columnize(e), i = this._alias ? `${n} as ${t.wrap(this._alias)}` : n;
    return this.set(i, []), super.toSQL(...arguments);
  }
};
var CA = $A;
const {
  columnize: TA,
  wrap: OA
} = $e;
let AA = class {
  constructor(e, t) {
    this.client = e, this.builder = t, this.bindings = [];
  }
  // Accepts a string or array of columns to wrap as appropriate.
  columnize(e) {
    return TA(e, this.builder, this.client, this);
  }
  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.
  wrap(e, t) {
    return OA(e, t, this.builder, this.client, this);
  }
};
var EA = AA, p = {};
Object.defineProperty(p, "__esModule", { value: !0 });
var SA = E;
function IA(r) {
  if (r && r.__esModule)
    return r;
  var e = /* @__PURE__ */ Object.create(null);
  return r && Object.keys(r).forEach(function(t) {
    if (t !== "default") {
      var n = Object.getOwnPropertyDescriptor(r, t);
      Object.defineProperty(e, t, n.get ? n : {
        enumerable: !0,
        get: function() {
          return r[t];
        }
      });
    }
  }), e.default = r, Object.freeze(e);
}
var Qt = /* @__PURE__ */ IA(SA);
const {
  env: U = {},
  argv: Bs = [],
  platform: xA = ""
} = typeof process > "u" ? {} : process, PA = "NO_COLOR" in U || Bs.includes("--no-color"), NA = "FORCE_COLOR" in U || Bs.includes("--color"), jA = xA === "win32", qs = U.TERM === "dumb", BA = Qt && Qt.isatty && Qt.isatty(1) && U.TERM && !qs, qA = "CI" in U && ("GITHUB_ACTIONS" in U || "GITLAB_CI" in U || "CIRCLECI" in U), ks = !PA && (NA || jA && !qs || BA || qA), Rs = (r, e, t, n, i = e.substring(0, r) + n, s = e.substring(r + t.length), o = s.indexOf(t)) => i + (o < 0 ? s : Rs(o, s, t, n)), kA = (r, e, t, n, i) => r < 0 ? t + e + n : t + Rs(r, e, n, i) + n, RA = (r, e, t = r, n = r.length + 1) => (i) => i || !(i === "" || i === void 0) ? kA(
  ("" + i).indexOf(e, n),
  i,
  r,
  e,
  t
) : "", y = (r, e, t) => RA(`\x1B[${r}m`, `\x1B[${e}m`, t), ti = {
  reset: y(0, 0),
  bold: y(1, 22, "\x1B[22m\x1B[1m"),
  dim: y(2, 22, "\x1B[22m\x1B[2m"),
  italic: y(3, 23),
  underline: y(4, 24),
  inverse: y(7, 27),
  hidden: y(8, 28),
  strikethrough: y(9, 29),
  black: y(30, 39),
  red: y(31, 39),
  green: y(32, 39),
  yellow: y(33, 39),
  blue: y(34, 39),
  magenta: y(35, 39),
  cyan: y(36, 39),
  white: y(37, 39),
  gray: y(90, 39),
  bgBlack: y(40, 49),
  bgRed: y(41, 49),
  bgGreen: y(42, 49),
  bgYellow: y(43, 49),
  bgBlue: y(44, 49),
  bgMagenta: y(45, 49),
  bgCyan: y(46, 49),
  bgWhite: y(47, 49),
  blackBright: y(90, 39),
  redBright: y(91, 39),
  greenBright: y(92, 39),
  yellowBright: y(93, 39),
  blueBright: y(94, 39),
  magentaBright: y(95, 39),
  cyanBright: y(96, 39),
  whiteBright: y(97, 39),
  bgBlackBright: y(100, 49),
  bgRedBright: y(101, 49),
  bgGreenBright: y(102, 49),
  bgYellowBright: y(103, 49),
  bgBlueBright: y(104, 49),
  bgMagentaBright: y(105, 49),
  bgCyanBright: y(106, 49),
  bgWhiteBright: y(107, 49)
}, Ms = ({ useColor: r = ks } = {}) => r ? ti : Object.keys(ti).reduce(
  (e, t) => ({ ...e, [t]: String }),
  {}
), {
  reset: MA,
  bold: LA,
  dim: FA,
  italic: HA,
  underline: QA,
  inverse: WA,
  hidden: DA,
  strikethrough: UA,
  black: JA,
  red: VA,
  green: GA,
  yellow: KA,
  blue: zA,
  magenta: YA,
  cyan: XA,
  white: ZA,
  gray: eE,
  bgBlack: tE,
  bgRed: rE,
  bgGreen: nE,
  bgYellow: iE,
  bgBlue: sE,
  bgMagenta: oE,
  bgCyan: aE,
  bgWhite: uE,
  blackBright: lE,
  redBright: cE,
  greenBright: hE,
  yellowBright: dE,
  blueBright: fE,
  magentaBright: pE,
  cyanBright: gE,
  whiteBright: yE,
  bgBlackBright: mE,
  bgRedBright: bE,
  bgGreenBright: _E,
  bgYellowBright: wE,
  bgBlueBright: vE,
  bgMagentaBright: $E,
  bgCyanBright: CE,
  bgWhiteBright: TE
} = Ms();
p.bgBlack = tE;
p.bgBlackBright = mE;
p.bgBlue = sE;
p.bgBlueBright = vE;
p.bgCyan = aE;
p.bgCyanBright = CE;
p.bgGreen = nE;
p.bgGreenBright = _E;
p.bgMagenta = oE;
p.bgMagentaBright = $E;
p.bgRed = rE;
p.bgRedBright = bE;
p.bgWhite = uE;
p.bgWhiteBright = TE;
p.bgYellow = iE;
p.bgYellowBright = wE;
p.black = JA;
p.blackBright = lE;
p.blue = zA;
p.blueBright = fE;
p.bold = LA;
p.createColors = Ms;
p.cyan = XA;
p.cyanBright = gE;
p.dim = FA;
p.gray = eE;
p.green = GA;
p.greenBright = hE;
p.hidden = DA;
p.inverse = WA;
p.isColorSupported = ks;
p.italic = HA;
p.magenta = YA;
p.magentaBright = pE;
p.red = VA;
p.redBright = cE;
p.reset = MA;
p.strikethrough = UA;
p.underline = QA;
p.white = ZA;
p.whiteBright = yE;
p.yellow = KA;
p.yellowBright = dE;
const Wt = p, { inspect: OE } = E, { isString: AE, isFunction: ri } = j;
let EE = class {
  constructor(e = {}) {
    const {
      log: {
        debug: t,
        warn: n,
        error: i,
        deprecate: s,
        inspectionDepth: o,
        enableColors: a
      } = {}
    } = e;
    this._inspectionDepth = o || 5, this._enableColors = SE(a), this._debug = t, this._warn = n, this._error = i, this._deprecate = s;
  }
  _log(e, t, n) {
    if (t != null && !ri(t))
      throw new TypeError("Extensions to knex logger must be functions!");
    if (ri(t)) {
      t(e);
      return;
    }
    AE(e) || (e = OE(e, {
      depth: this._inspectionDepth,
      colors: this._enableColors
    })), console.log(n ? n(e) : e);
  }
  debug(e) {
    this._log(e, this._debug);
  }
  warn(e) {
    this._log(e, this._warn, Wt.yellow);
  }
  error(e) {
    this._log(e, this._error, Wt.red);
  }
  deprecate(e, t) {
    const n = `${e} is deprecated, please use ${t}`;
    this._log(n, this._deprecate, Wt.yellow);
  }
};
function SE(r) {
  return r ?? (process && process.stdout ? process.stdout.isTTY : !1);
}
var IE = EE;
const xE = k, PE = Nr, NE = re;
let xe = class {
  constructor(e, t, n, i) {
    this.client = e, this._method = t, this._schemaName = void 0, this._columns = void 0, this._fn = i, this._viewName = n, this._statements = [], this._single = {};
  }
  setSchema(e) {
    this._schemaName = e;
  }
  columns(e) {
    this._columns = e;
  }
  as(e) {
    this._selectQuery = e;
  }
  checkOption() {
    throw new Error(
      "check option definition is not supported by this dialect."
    );
  }
  localCheckOption() {
    throw new Error(
      "check option definition is not supported by this dialect."
    );
  }
  cascadedCheckOption() {
    throw new Error(
      "check option definition is not supported by this dialect."
    );
  }
  toSQL() {
    return this._method === "alter" && PE(this, jE), this._fn.call(this, this), this.client.viewCompiler(this).toSQL();
  }
};
const jE = {
  column(r) {
    const e = this;
    return {
      rename: function(t) {
        return e._statements.push({
          grouping: "alterView",
          method: "renameColumn",
          args: [r, t]
        }), this;
      },
      defaultTo: function(t) {
        return e._statements.push({
          grouping: "alterView",
          method: "defaultTo",
          args: [r, t]
        }), this;
      }
    };
  }
};
xE.addQueryContext(xe);
xe.extend = (r, e) => {
  if (Object.prototype.hasOwnProperty.call(xe.prototype, r))
    throw new Error(
      `Can't extend ViewBuilder with existing method ('${r}').`
    );
  NE(xe.prototype, { [r]: e });
};
var BE = xe;
const { pushQuery: qE } = Tt, kE = Ct, { columnize: RE } = $e;
let Ls = class {
  constructor(e, t) {
    this.client = e, this.viewBuilder = t, this._commonBuilder = this.viewBuilder, this.method = t._method, this.schemaNameRaw = t._schemaName, this.viewNameRaw = t._viewName, this.single = t._single, this.selectQuery = t._selectQuery, this.columns = t._columns, this.grouped = kE(t._statements, "grouping"), this.formatter = e.formatter(t), this.bindings = [], this.formatter.bindings = this.bindings, this.bindingsHolder = this, this.sequence = [];
  }
  // Convert the tableCompiler toSQL
  toSQL() {
    return this[this.method](), this.sequence;
  }
  // Column Compilation
  // -------
  create() {
    this.createQuery(this.columns, this.selectQuery);
  }
  createOrReplace() {
    throw new Error("replace views is not supported by this dialect.");
  }
  createMaterializedView() {
    throw new Error("materialized views are not supported by this dialect.");
  }
  createQuery(e, t, n, i) {
    const s = "create " + (n ? "materialized " : "") + (i ? "or replace " : "") + "view ", o = e ? " (" + RE(
      e,
      this.viewBuilder,
      this.client,
      this.bindingsHolder
    ) + ")" : "";
    let a = s + this.viewName() + o;
    switch (a += " as ", a += t.toString(), this.single.checkOption) {
      case "default_option":
        a += " with check option";
        break;
      case "local":
        a += " with local check option";
        break;
      case "cascaded":
        a += " with cascaded check option";
        break;
    }
    this.pushQuery({
      sql: a
    });
  }
  renameView(e, t) {
    throw new Error(
      "rename view is not supported by this dialect (instead drop, then create another view)."
    );
  }
  refreshMaterializedView() {
    throw new Error("materialized views are not supported by this dialect.");
  }
  alter() {
    this.alterView();
  }
  alterView() {
    const e = this.grouped.alterView || [];
    for (let t = 0, n = e.length; t < n; t++) {
      const i = e[t];
      this[i.method] ? this[i.method].apply(this, i.args) : this.client.logger.error(`Debug: ${i.method} does not exist`);
    }
    for (const t in this.single)
      typeof this[t] == "function" && this[t](this.single[t]);
  }
  renameColumn(e, t) {
    throw new Error("rename column of views is not supported by this dialect.");
  }
  defaultTo(e, t) {
    throw new Error(
      "change default values of views is not supported by this dialect."
    );
  }
  viewName() {
    const e = this.schemaNameRaw ? `${this.schemaNameRaw}.${this.viewNameRaw}` : this.viewNameRaw;
    return this.formatter.wrap(e);
  }
};
Ls.prototype.pushQuery = qE;
var ME = Ls;
const { Pool: LE, TimeoutError: FE } = $p, { EventEmitter: HE } = E, { promisify: QE } = E, { makeEscape: WE } = Ap, DE = Gm, UE = tb, JE = ci, VE = lb, GE = ki, {
  executeQuery: KE,
  enrichQueryObject: ni
} = ns, zE = Sr, YE = iO, XE = hO, ZE = _O, e0 = jO, t0 = iA, r0 = hA, n0 = wA, { KnexTimeoutError: i0 } = _e, { outputQuery: s0, unwrapRaw: o0 } = $e, { compileCallback: a0 } = Ir, u0 = Pr, l0 = CA, c0 = EA, h0 = IE, { POOL_CONFIG_OPTIONS: d0 } = Ts, f0 = BE, p0 = ME, g0 = qe, Dt = he("knex:client");
class Fs extends HE {
  constructor(e = {}) {
    if (super(), this.config = e, this.logger = new h0(e), this.dialect && !this.config.client && this.logger.warn(
      "Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the future. Please use configuration option 'client' instead."
    ), !(this.config.client || this.dialect))
      throw new Error(
        "knex: Required configuration option 'client' is missing."
      );
    e.version && (this.version = e.version), e.connection && e.connection instanceof Function ? (this.connectionConfigProvider = e.connection, this.connectionConfigExpirationChecker = () => !0) : (this.connectionSettings = DE(e.connection || {}), this.connectionConfigExpirationChecker = null), this.driverName && e.connection && (this.initializeDriver(), (!e.pool || e.pool && e.pool.max !== 0) && this.initializePool(e)), this.valueForUndefined = this.raw("DEFAULT"), e.useNullAsDefault && (this.valueForUndefined = null);
  }
  formatter(e) {
    return new c0(this, e);
  }
  queryBuilder() {
    return new zE(this);
  }
  queryCompiler(e, t) {
    return new YE(this, e, t);
  }
  schemaBuilder() {
    return new XE(this);
  }
  schemaCompiler(e) {
    return new ZE(this, e);
  }
  tableBuilder(e, t, n, i) {
    return new e0(this, e, t, n, i);
  }
  viewBuilder(e, t, n) {
    return new f0(this, e, t, n);
  }
  tableCompiler(e) {
    return new t0(this, e);
  }
  viewCompiler(e) {
    return new p0(this, e);
  }
  columnBuilder(e, t, n) {
    return new r0(this, e, t, n);
  }
  columnCompiler(e, t) {
    return new n0(this, e, t);
  }
  runner(e) {
    return new VE(this, e);
  }
  transaction(e, t, n) {
    return new GE(this, e, t, n);
  }
  raw() {
    return new u0(this).set(...arguments);
  }
  ref() {
    return new l0(this, ...arguments);
  }
  query(e, t) {
    const n = ni(e, t, this);
    return KE(e, n, this);
  }
  stream(e, t, n, i) {
    const s = ni(e, t, this);
    return this._stream(e, s, n, i);
  }
  prepBindings(e) {
    return e;
  }
  positionBindings(e) {
    return e;
  }
  postProcessResponse(e, t) {
    return this.config.postProcessResponse ? this.config.postProcessResponse(e, t) : e;
  }
  wrapIdentifier(e, t) {
    return this.customWrapIdentifier(
      e,
      this.wrapIdentifierImpl,
      t
    );
  }
  customWrapIdentifier(e, t, n) {
    return this.config.wrapIdentifier ? this.config.wrapIdentifier(e, t, n) : t(e);
  }
  wrapIdentifierImpl(e) {
    return e !== "*" ? `"${e.replace(/"/g, '""')}"` : "*";
  }
  initializeDriver() {
    try {
      this.driver = this._driver();
    } catch (e) {
      const t = `Knex: run
$ npm install ${this.driverName} --save`;
      throw this.logger.error(`${t}
${e.message}
${e.stack}`), new Error(`${t}
${e.message}`);
    }
  }
  poolDefaults() {
    return { min: 2, max: 10, propagateCreateError: !0 };
  }
  getPoolSettings(e) {
    e = UE({}, e, this.poolDefaults()), d0.forEach((s) => {
      s in e && this.logger.warn(
        [
          `Pool config option "${s}" is no longer supported.`,
          "See https://github.com/Vincit/tarn.js for possible pool config options."
        ].join(" ")
      );
    });
    const t = 6e4, n = [
      this.config.acquireConnectionTimeout,
      e.acquireTimeoutMillis
    ].filter((s) => s !== void 0);
    n.length || n.push(t), e.acquireTimeoutMillis = Math.min(...n);
    const i = async () => {
      if (!this.connectionConfigProvider || !this.connectionConfigExpirationChecker || !this.connectionConfigExpirationChecker())
        return;
      const s = await this.connectionConfigProvider();
      s.expirationChecker ? (this.connectionConfigExpirationChecker = s.expirationChecker, delete s.expirationChecker) : this.connectionConfigExpirationChecker = null, this.connectionSettings = s;
    };
    return Object.assign(e, {
      create: async () => {
        await i();
        const s = await this.acquireRawConnection();
        return s.__knexUid = JE("__knexUid"), e.afterCreate && await QE(e.afterCreate)(s), s;
      },
      destroy: (s) => {
        if (s !== void 0)
          return this.destroyRawConnection(s);
      },
      validate: (s) => s.__knex__disposed ? (this.logger.warn(`Connection Error: ${s.__knex__disposed}`), !1) : this.validateConnection(s)
    });
  }
  initializePool(e = this.config) {
    if (this.pool) {
      this.logger.warn("The pool has already been initialized");
      return;
    }
    const t = {
      ...this.getPoolSettings(e.pool)
    };
    t.afterCreate && delete t.afterCreate, this.pool = new LE(t);
  }
  validateConnection(e) {
    return !0;
  }
  // Acquire a connection from the pool.
  async acquireConnection() {
    if (!this.pool)
      throw new Error("Unable to acquire a connection");
    try {
      const e = await this.pool.acquire().promise;
      return Dt("acquired connection from pool: %s", e.__knexUid), e;
    } catch (e) {
      let t = e;
      throw e instanceof FE && (t = new i0(
        "Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?"
      )), t;
    }
  }
  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection(e) {
    return Dt("releasing connection to pool: %s", e.__knexUid), this.pool.release(e) || Dt("pool refused connection: %s", e.__knexUid), Promise.resolve();
  }
  // Destroy the current connection pool for the client.
  async destroy(e) {
    try {
      this.pool && this.pool.destroy && await this.pool.destroy(), this.pool = void 0, typeof e == "function" && e();
    } catch (t) {
      if (typeof e == "function")
        return e(t);
      throw t;
    }
  }
  // Return the database being used by this client.
  database() {
    return this.connectionSettings.database;
  }
  toString() {
    return "[object KnexClient]";
  }
  assertCanCancelQuery() {
    if (!this.canCancelQuery)
      throw new Error("Query cancelling not supported for this dialect");
  }
  cancelQuery() {
    throw new Error("Query cancelling not supported for this dialect");
  }
  // Formatter part
  alias(e, t) {
    return e + " as " + t;
  }
  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(e, t, n) {
    return typeof e == "function" ? s0(
      a0(e, void 0, this, n),
      !0,
      t,
      this
    ) : o0(e, !0, t, this, n) || "?";
  }
  // Turns a list of values into a list of ?'s, joining them with commas unless
  // a "joining" value is specified (e.g. ' and ')
  parameterize(e, t, n, i) {
    if (typeof e == "function")
      return this.parameter(e, n, i);
    e = Array.isArray(e) ? e : [e];
    let s = "", o = -1;
    for (; ++o < e.length; ) {
      o > 0 && (s += ", ");
      let a = e[o];
      g0(a) && (a = JSON.stringify(a)), s += this.parameter(
        a === void 0 ? t : a,
        n,
        i
      );
    }
    return s;
  }
  // Formats `values` into a parenthesized list of parameters for a `VALUES`
  // clause.
  //
  // [1, 2]                  -> '(?, ?)'
  // [[1, 2], [3, 4]]        -> '((?, ?), (?, ?))'
  // knex('table')           -> '(select * from "table")'
  // knex.raw('select ?', 1) -> '(select ?)'
  //
  values(e, t, n) {
    return Array.isArray(e) ? Array.isArray(e[0]) ? `(${e.map(
      (i) => `(${this.parameterize(
        i,
        void 0,
        t,
        n
      )})`
    ).join(", ")})` : `(${this.parameterize(
      e,
      void 0,
      t,
      n
    )})` : e && e.isRawInstance ? `(${this.parameter(e, t, n)})` : this.parameter(e, t, n);
  }
  processPassedConnection(e) {
  }
  toPathForJson(e) {
    return e;
  }
}
Object.assign(Fs.prototype, {
  _escapeBinding: WE({
    escapeString(r) {
      return `'${r.replace(/'/g, "''")}'`;
    }
  }),
  canCancelQuery: !1
});
var y0 = Fs;
const ii = /* @__PURE__ */ si(y0);
class M0 extends ii {
  constructor(t = {}) {
    super(t);
    xt(this, "dialect");
    xt(this, "driverName");
    this.dialect = "db2", this.driverName = "odbc", ii.call(this, t);
    const { driver: n } = t.connection || {};
    n || this.logger.warn(
      "Warn: config.connection.driver is needed for connecting to the database"
    );
  }
  async _driver() {
    return await import(this.driverName);
  }
  transaction() {
    return new sp(this, ...arguments);
  }
  wrapIdentifierImpl(t) {
    return t;
  }
  printDebug(t) {
    (void 0).DEBUG;
  }
  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const t = this.config.connection;
    return new Promise((n, i) => {
      this.driver.open(
        // @ts-ignore
        this._getConnectionString(t),
        (s, o) => s ? i(s) : n(o)
      );
    });
  }
  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(t) {
    return await t.close();
  }
  async validateConnection(t) {
    return await t.tables();
  }
  _stream(t, n, i, s) {
    throw this._stream(t, n, i, s), new Error("Not yet implemented");
  }
  _getConnectionString(t = {}) {
    const n = t.connectionStringParams || {}, i = Object.keys(
      n
    ).reduce((s, o) => {
      const a = n[o];
      return `${s}${o}=${a}`;
    }, "");
    return `${`DRIVER=${t.driver};SYSTEM=${t.host};HOSTNAME=${t.host};PORT=${t.port};DATABASE=${t.database};UID=${t.user};PWD=${t.password};`}${i}`;
  }
  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  async _query(t, n) {
    (!n || typeof n == "string") && (n = { sql: n });
    const i = (n.method !== "raw" ? n.method : n.sql.split(" ")[0]).toLowerCase();
    if (n.sqlMethod = i, i === "select" || i === "first" || i === "pluck") {
      const o = await t.query(n.sql, n.bindings);
      return o && (n.response = { rows: o, rowCount: o.length }), n;
    }
    const s = await t.createStatement();
    return await s.prepare(n.sql), await s.bind(n.bindings), n.response = await s.execute(), n;
  }
  processResponse(t, n) {
    if (t === null)
      return null;
    const i = t.response, s = t.sqlMethod, { rows: o } = i;
    if (t.output)
      return t.output.call(n, i);
    switch (s) {
      case "select":
      case "pluck":
      case "first":
        return s === "pluck" ? o.map(t.pluck) : s === "first" ? o[0] : o;
      case "insert":
      case "del":
      case "delete":
      case "update":
      case "counter":
        return i.rowCount;
      default:
        return i;
    }
  }
}
export {
  M0 as default
};
//# sourceMappingURL=index.es.js.map
