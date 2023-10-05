!(function (t, e) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = e())
    : "function" == typeof define && define.amd
    ? define("FontsLoader", [], e)
    : "object" == typeof exports
    ? (exports.FontsLoader = e())
    : (t.FontsLoader = e());
})(this, () =>
  (() => {
    "use strict";
    var t,
      e = {
        d: (t, s) => {
          for (var n in s) e.o(s, n) && !e.o(t, n) && Object.defineProperty(t, n, { enumerable: !0, get: s[n] });
        },
        o: (t, e) => Object.prototype.hasOwnProperty.call(t, e),
        r: (t) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(t, "__esModule", { value: !0 });
        },
      },
      s = {};
    e.r(s),
      e.d(s, { load: () => _ }),
      (function (t) {
        (t.LOADING = "loading"),
          (t.ACTIVE = "active"),
          (t.INACTIVE = "inactive"),
          (t.FONT_LOADING = "fontloading"),
          (t.FONT_ACTIVE = "fontactive"),
          (t.FONT_INACTIVE = "fontinactive");
      })(t || (t = {}));
    class n {
      constructor(e) {
        (this.namespace_ = "wf"),
          (this.classSeparator_ = "-"),
          (this.config_ = e),
          (this.event_ = document.createEvent("CustomEvent")),
          (this.htmlElement_ = document.documentElement),
          document.addEventListener(
            t.LOADING,
            () => {
              this.handleLoading_();
            },
            !1
          ),
          document.addEventListener(
            t.ACTIVE,
            () => {
              this.handleActive_();
            },
            !1
          ),
          document.addEventListener(
            t.INACTIVE,
            () => {
              this.handleInactive_();
            },
            !1
          ),
          document.addEventListener(
            t.FONT_LOADING,
            (t) => {
              const { detail: e } = t;
              this.handleFontLoading_(e);
            },
            !1
          ),
          document.addEventListener(
            t.FONT_ACTIVE,
            (t) => {
              const { detail: e } = t;
              this.handleFontActive_(e);
            },
            !1
          ),
          document.addEventListener(
            t.FONT_INACTIVE,
            (t) => {
              const { detail: e } = t;
              this.handleFontInactive_(e);
            },
            !1
          );
      }
      handleLoading_() {
        this.config_.events &&
          this.config_.loading &&
          (this.config_.loading.call(null),
          this.addClassToHtml_(t.LOADING),
          this.removeClassFromHtml_(t.ACTIVE),
          this.removeClassFromHtml_(t.INACTIVE));
      }
      handleActive_() {
        this.config_.events &&
          this.config_.active &&
          (this.config_.active.call(null),
          this.removeClassFromHtml_(t.LOADING),
          this.addClassToHtml_(t.ACTIVE),
          this.removeClassFromHtml_(t.INACTIVE));
      }
      handleInactive_() {
        this.config_.events &&
          this.config_.inactive &&
          (this.config_.inactive.call(null),
          this.removeClassFromHtml_(t.LOADING),
          this.removeClassFromHtml_(t.ACTIVE),
          this.addClassToHtml_(t.INACTIVE));
      }
      handleFontLoading_(e) {
        if (this.config_.events && this.config_.fontloading) {
          const s = e.split(":");
          this.config_.fontloading.call(null, s[0], s[1]),
            this.addClassToHtml_(t.LOADING, [s[0], s[1]]),
            this.removeClassFromHtml_(t.ACTIVE, [s[0], s[1]]),
            this.removeClassFromHtml_(t.INACTIVE, [s[0], s[1]]);
        }
      }
      handleFontActive_(e) {
        if (this.config_.events && this.config_.fontactive) {
          const s = e.split(":");
          this.config_.fontactive.call(null, s[0], s[1]),
            this.removeClassFromHtml_(t.LOADING, [s[0], s[1]]),
            this.addClassToHtml_(t.ACTIVE, [s[0], s[1]]),
            this.removeClassFromHtml_(t.INACTIVE, [s[0], s[1]]);
        }
      }
      handleFontInactive_(e) {
        if (this.config_.events && this.config_.fontinactive) {
          const s = e.split(":");
          this.config_.fontinactive.call(null, s[0], s[1]),
            this.removeClassFromHtml_(t.LOADING, [s[0], s[1]]),
            this.removeClassFromHtml_(t.ACTIVE, [s[0], s[1]]),
            this.addClassToHtml_(t.INACTIVE, [s[0], s[1]]);
        }
      }
      addClassToHtml_(t, e = []) {
        this.htmlElement_.classList.add(
          [this.namespace_].concat(e.map(this.sanitizeClassName_), t).join(this.classSeparator_)
        );
      }
      removeClassFromHtml_(t, e = []) {
        this.htmlElement_.classList.remove(
          [this.namespace_].concat(e.map(this.sanitizeClassName_), t).join(this.classSeparator_)
        );
      }
      sanitizeClassName_(t) {
        return t.replace(/[\W_]+/g, "").toLowerCase();
      }
    }
    class i {
      constructor(t) {
        (this.rules_ = []), (this.css_ = t);
      }
      getParsedFonts() {
        return this.rules_;
      }
      parseCSS() {
        this.css_ = this.removeNewLines_(this.css_);
        const t = this.css_.split("}");
        t.pop(),
          t.forEach((t) => {
            const e = t.split("{"),
              s = this.parseCSSBlock_(e[1]);
            this.rules_.push({
              fontFamily: s["font-family"],
              fontStyle: s["font-style"],
              fontWeight: s["font-weight"],
              src: s.src,
              unicodeRange: s["unicode-range"],
            });
          });
      }
      parseCSSBlock_(t) {
        const e = {},
          s = t.split(";");
        return (
          s.pop(),
          s.forEach((t) => {
            const s = t.indexOf(":"),
              n = t.substring(0, s).trim();
            let i = t.substring(s + 1).trim();
            "'" === i[0] && "'" === i[i.length - 1] && (i = i.replace(/'/g, "")), "" != n && "" != i && (e[n] = i);
          }),
          e
        );
      }
      removeNewLines_(t) {
        return t.replace(/\n/g, "");
      }
    }
    class o {
      constructor(t) {
        (this.INT_FONTS = {
          latin: "BESbswy",
          "latin-ext": "çöüğş",
          cyrillic: "йяЖ",
          greek: "αβΣ",
          khmer: "កខគ",
          Hanuman: "កខគ",
        }),
          (this.WEIGHTS = {
            thin: "1",
            extralight: "2",
            "extra-light": "2",
            ultralight: "2",
            "ultra-light": "2",
            light: "3",
            regular: "4",
            book: "4",
            medium: "5",
            "semi-bold": "6",
            semibold: "6",
            "demi-bold": "6",
            demibold: "6",
            bold: "7",
            "extra-bold": "8",
            extrabold: "8",
            "ultra-bold": "8",
            ultrabold: "8",
            black: "9",
            heavy: "9",
            l: "3",
            r: "4",
            b: "7",
          }),
          (this.STYLES = { i: "i", italic: "i", n: "n", normal: "n" }),
          (this.VARIATION_MATCH = new RegExp(
            "^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$"
          )),
          (this.fontFamilies_ = t),
          (this.parsedFonts_ = []),
          (this.fontTestStrings_ = {});
      }
      parse() {
        const t = this.fontFamilies_.length;
        for (let e = 0; e < t; e++) {
          const t = this.fontFamilies_[e].split(":"),
            s = t[0].replace(/\+/g, " ");
          let n = ["n4"];
          if (t.length >= 2) {
            const e = this.parseVariations_(t[1]);
            if ((e.length > 0 && (n = e), 3 == t.length)) {
              const e = this.parseSubsets_(t[2]);
              if (e.length > 0) {
                const t = this.INT_FONTS[e[0]];
                t && (this.fontTestStrings_[s] = t);
              }
            }
          }
          if (!this.fontTestStrings_[s]) {
            const t = this.INT_FONTS[s];
            t && (this.fontTestStrings_[s] = t);
          }
          for (let t = 0; t < n.length; t += 1) this.parsedFonts_.push({ family: s, variation: n[t] });
        }
      }
      generateFontVariationDescription_(t) {
        if (!t.match(/^[\w-]+$/)) return "";
        const e = t.toLowerCase(),
          s = this.VARIATION_MATCH.exec(e);
        return null == s ? "" : [this.normalizeStyle_(s[2]), this.normalizeWeight_(s[1])].join("");
      }
      normalizeStyle_(t) {
        return null == t || "" == t ? "n" : this.STYLES[t];
      }
      normalizeWeight_(t) {
        if (null == t || "" == t) return "4";
        return this.WEIGHTS[t] || (isNaN(t) ? "4" : t.substr(0, 1));
      }
      parseVariations_(t) {
        const e = [];
        if (!t) return e;
        const s = t.split(","),
          n = s.length;
        for (let t = 0; t < n; t++) {
          const n = s[t],
            i = this.generateFontVariationDescription_(n);
          i && e.push(i);
        }
        return e;
      }
      parseSubsets_(t) {
        return t ? t.split(",") : [];
      }
      getFonts() {
        return this.parsedFonts_;
      }
      getFontTestStrings() {
        return this.fontTestStrings_;
      }
    }
    class a {
      constructor(t, e) {
        (this.font_ = t), (this.load_ = e), this.loading_();
      }
      loading_() {
        document.dispatchEvent(
          new CustomEvent(t.FONT_LOADING, { detail: `${this.font_.family}:${this.font_.variation}` })
        );
      }
      getFont() {
        return this.font_;
      }
      watch() {
        return document.fonts.check(`16px ${this.font_.family}`, "BESbswy");
      }
    }
    class r {
      constructor() {
        (this.fontWatchers_ = []), (this.loadedFonts_ = []), (this.watched_ = !1);
      }
      add(t, e) {
        this.fontWatchers_.push(new a(t, e));
      }
      fontLoaded(t) {
        this.loadedFonts_.push(t);
      }
      watchFonts() {
        if (!this.watched_) {
          this.watched_ = !0;
          let e = !1;
          this.fontWatchers_.forEach((s) => {
            const n = s.getFont(),
              i = this.loadedFonts_.includes(n.family) || s.watch();
            i && (e = !0),
              document.dispatchEvent(
                new CustomEvent(i ? t.FONT_ACTIVE : t.FONT_INACTIVE, { detail: `${n.family}:${n.variation}` })
              );
          }),
            document.dispatchEvent(new CustomEvent(e ? t.ACTIVE : t.INACTIVE, {}));
        }
      }
    }
    class l {
      constructor(t, e = 1) {
        (this.apiUrl_ = "https://fonts.googleapis.com/css"), (this.fonts_ = t), (this.version_ = e);
      }
      buildUri() {
        const t = new o(this.fonts_);
        t.parse();
        const e = t
          .getFonts()
          .map((t) => `${t.family}:${t.variation}`.replace(/\s/g, "+"))
          .join("|");
        return `${this.apiUrl_}?family=${e}`;
      }
    }
    class c {
      constructor(t) {
        (this.fonts_ = t), this.generateUri_();
      }
      getUris() {
        return this.uri_ ? [this.uri_] : [];
      }
      getFonts() {
        const t = new o(this.fonts_.families);
        return t.parse(), t.getFonts();
      }
      getParsedFonts() {
        return (
          (t = this),
          (e = void 0),
          (n = function* () {
            if (!this.uri_) throw new Error("No uri provided. Nothing to parse.");
            const t = yield fetch(this.uri_).then((t) => t.text()),
              e = new i(t);
            return e.parseCSS(), e.getParsedFonts();
          }),
          new ((s = void 0) || (s = Promise))(function (i, o) {
            function a(t) {
              try {
                l(n.next(t));
              } catch (t) {
                o(t);
              }
            }
            function r(t) {
              try {
                l(n.throw(t));
              } catch (t) {
                o(t);
              }
            }
            function l(t) {
              var e;
              t.done
                ? i(t.value)
                : ((e = t.value),
                  e instanceof s
                    ? e
                    : new s(function (t) {
                        t(e);
                      })).then(a, r);
            }
            l((n = n.apply(t, e || [])).next());
          })
        );
        var t, e, s, n;
      }
      generateUri_() {
        const t = new l(this.fonts_.families);
        this.uri_ = t.buildUri();
      }
    }
    class h {
      constructor(t) {
        (this.fonts_ = []), (this.uris_ = t.urls || []), this.parseFamilyConfig_(t.families);
      }
      getUris() {
        return this.uris_ || [];
      }
      getFonts() {
        return this.fonts_;
      }
      getParsedFonts() {
        return [];
      }
      parseFamilyConfig_(t) {
        t.forEach((t) => {
          var e, s;
          if ("string" != typeof t)
            this.fonts_.push({ family: t.name, variation: "n4" }),
              null === (e = this.uris_) || void 0 === e || e.push(t.url);
          else {
            const e = t.split(":"),
              n = e[0];
            let i = null === (s = e[1]) || void 0 === s ? void 0 : s.split(",");
            (!i || i.length < 1) && (i = ["n4"]),
              i.forEach((t) => {
                this.fonts_.push({ family: n, variation: t });
              });
          }
        });
      }
    }
    var d = function (t, e, s, n) {
      return new (s || (s = Promise))(function (i, o) {
        function a(t) {
          try {
            l(n.next(t));
          } catch (t) {
            o(t);
          }
        }
        function r(t) {
          try {
            l(n.throw(t));
          } catch (t) {
            o(t);
          }
        }
        function l(t) {
          var e;
          t.done
            ? i(t.value)
            : ((e = t.value),
              e instanceof s
                ? e
                : new s(function (t) {
                    t(e);
                  })).then(a, r);
        }
        l((n = n.apply(t, e || [])).next());
      });
    };
    const f = { events: !1, classes: !1, timeout: 3e3 },
      _ = (e) =>
        d(void 0, void 0, void 0, function* () {
          const s = Object.assign(Object.assign({}, f), e),
            i = new r();
          if (((s.classes || s.events) && new n(s), s.google)) {
            const t = new c(s.google);
            "native" === s.google.load ? yield u(yield t.getParsedFonts()) : t.getUris().forEach(m),
              t.getFonts().forEach((t) => {
                var e;
                i.add(t, (null === (e = s.google) || void 0 === e ? void 0 : e.load) || "link");
              });
          }
          if (s.custom) {
            if ("native" === s.custom.load) throw new Error("Native load is not implemented for custom fonts.");
            const t = new h(s.custom);
            t.getUris().forEach(m),
              t.getFonts().forEach((t) => {
                i.add(t, "link");
              });
          }
          (s.classes || s.events) &&
            (document.dispatchEvent(new CustomEvent(t.LOADING, {})),
            (document.fonts.onloadingdone = (t) => {
              t.fontfaces.forEach((t) =>
                d(void 0, void 0, void 0, function* () {
                  "loaded" === t.status && i.fontLoaded(t.family);
                })
              ),
                i.watchFonts();
            }),
            setTimeout(() => {
              i.watchFonts();
            }, s.timeout));
        }),
      u = (t) =>
        d(void 0, void 0, void 0, function* () {
          for (const e of t) {
            const t = new FontFace(e.fontFamily, e.src, {
              style: e.fontStyle,
              unicodeRange: e.unicodeRange,
              weight: e.fontWeight,
            });
            yield t.load(), document.fonts.add(t);
          }
        }),
      m = (t) => {
        const e = document.createElement("link");
        (e.rel = "stylesheet"), (e.href = t), (e.media = "all"), document.head.appendChild(e);
      };
    return s;
  })()
);
