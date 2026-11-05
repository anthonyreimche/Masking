//#region src/rt.ts
var e, t;
function n(n) {
	t = n, e = n.react;
}
//#endregion
//#region src/masks.ts
var r = [
	"red",
	"orange",
	"yellow",
	"green",
	"aqua",
	"blue",
	"purple",
	"magenta"
], i = ["core.basic"];
function a() {
	return {
		exposure: 0,
		contrast: 0,
		highlights: 0,
		shadows: 0,
		whites: 0,
		blacks: 0,
		saturation: 0,
		vibrance: 0,
		temperature: 0,
		tint: 0,
		texture: 0,
		clarity: 0,
		dehaze: 0,
		sharpness: 0
	};
}
function o() {
	return {
		lo: 0,
		hi: 1,
		loFeather: .1,
		hiFeather: .1
	};
}
function s() {
	return {
		r: .18,
		g: .18,
		b: .18,
		hueRange: .15,
		satRange: .3,
		smoothness: .25
	};
}
function c(e) {
	return [
		"hue",
		"saturation",
		"luminance"
	].every((t) => r.every((n) => e[t][n] === 0));
}
function l(e) {
	return e.contrast !== 0 || e.saturation !== 0 || e.vibrance !== 0 || e.whites !== 0 || e.blacks !== 0 || e.clarity !== 0 || e.sharpness !== 0 || e.texture !== 0 || e.dehaze !== 0;
}
//#endregion
//#region src/transform.ts
function u(e, t) {
	let n = Array(9);
	for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) n[r * 3 + i] = e[r * 3 + 0] * t[0 + i] + e[r * 3 + 1] * t[3 + i] + e[r * 3 + 2] * t[6 + i];
	return n;
}
function d(e, t, n) {
	let r = e[0] * t + e[1] * n + e[2], i = e[3] * t + e[4] * n + e[5], a = e[6] * t + e[7] * n + e[8], o = a === 0 ? 1e-6 : a;
	return {
		x: r / o,
		y: i / o
	};
}
function f(e) {
	let t = Math.cos(e), n = Math.sin(e);
	return [
		t,
		-n,
		0,
		n,
		t,
		0,
		0,
		0,
		1
	];
}
function p(e, t) {
	return [
		e,
		0,
		0,
		0,
		t,
		0,
		0,
		0,
		1
	];
}
function m(e, t) {
	return [
		1,
		0,
		e,
		0,
		1,
		t,
		0,
		0,
		1
	];
}
function h(e) {
	return [[
		e,
		0,
		-.5 * e,
		0,
		1,
		-.5,
		0,
		0,
		1
	], [
		1 / e,
		0,
		.5,
		0,
		1,
		.5,
		0,
		0,
		1
	]];
}
function g(e, t, n) {
	return {
		theta: e * Math.PI / 180,
		gh: t.perspectiveH / 100 * .6,
		gv: t.perspectiveV / 100 * .6,
		as: 1.5 ** (t.aspect / 100),
		s: 2 ** ((t.scale - 100) / 200),
		tx: t.offsetX / 100 * .5 * n,
		ty: t.offsetY / 100 * .5,
		fh: t.flipH ? -1 : 1,
		fv: t.flipV ? -1 : 1
	};
}
function _(e, t, n) {
	let { theta: r, gh: i, gv: a, as: o, s, tx: c, ty: l, fh: d, fv: _ } = g(e, t, n), [v, y] = h(n), b = p(d, _), x = [
		1,
		0,
		0,
		0,
		1,
		0,
		-i,
		-a,
		1
	], S = p(1 / o, o), C = p(1 / s, 1 / s), w = m(-c, -l), T = u(f(r), b);
	return T = u(T, x), T = u(T, S), T = u(T, C), T = u(T, w), u(y, u(T, v));
}
function v(e, t, n) {
	let { theta: r, gh: i, gv: a, as: o, s, tx: c, ty: l, fh: d, fv: _ } = g(e, t, n), [v, y] = h(n), b = [
		1,
		0,
		0,
		0,
		1,
		0,
		i,
		a,
		1
	], x = p(d, _), S = u(m(c, l), p(s, s));
	return S = u(S, p(o, 1 / o)), S = u(S, b), S = u(S, x), S = u(S, f(-r)), u(y, u(S, v));
}
//#endregion
//#region src/state.ts
var y = {
	activeTool: "none",
	maskToolType: "radial",
	maskCompMode: "add",
	maskAddTarget: "new",
	selectedMaskId: null,
	selectedComponentId: null,
	hoveredMaskId: null,
	maskTab: "coverage",
	brushPreview: !1,
	brushSize: .08,
	brushFeather: .5,
	brushOpacity: 1,
	brushFlow: 1,
	brushErase: !1,
	maskColorPicking: !1
}, b = y, x = /* @__PURE__ */ new Set(), S = () => b;
function C(e) {
	b = {
		...b,
		...e
	};
	for (let e of x) e();
}
var w = () => C(y), T = (e) => (x.add(e), () => void x.delete(e)), ee = () => e.useSyncExternalStore(T, S), E = () => C({
	activeTool: "none",
	selectedMaskId: null,
	selectedComponentId: null,
	hoveredMaskId: null
}), D = 0, O = (e) => `${e}-${Date.now().toString(36)}-${D++}`, k = () => t.stores.useDevelopStore.getState().params.masks, A = (e) => t.stores.useDevelopStore.getState().setParam("masks", e), j = (e, t) => A(k().map((n) => n.id === e ? {
	...n,
	components: t(n.components)
} : n));
function M(e, t) {
	return k().find((t) => t.id === e)?.components.find((e) => e.id === t);
}
function N(e) {
	k().length >= 16 || (A([...k(), e]), C({
		selectedMaskId: e.id,
		selectedComponentId: e.components[e.components.length - 1]?.id ?? null,
		maskTab: "coverage"
	}));
}
function P(e, t) {
	j(e, (e) => [...e, t]), C({
		selectedMaskId: e,
		selectedComponentId: t.id
	});
}
function F(e, t, n) {
	j(e, (e) => e.map((e) => e.id === t ? {
		...e,
		...n
	} : e));
}
function te(e, t) {
	let n = [];
	for (let r of k()) {
		if (r.id !== e) {
			n.push(r);
			continue;
		}
		let i = r.components.filter((e) => e.id !== t);
		i.length > 0 && n.push({
			...r,
			components: i
		});
	}
	A(n);
	let r = !n.some((t) => t.id === e);
	C({
		selectedMaskId: r ? null : b.selectedMaskId,
		selectedComponentId: b.selectedComponentId === t ? null : b.selectedComponentId,
		hoveredMaskId: r && b.hoveredMaskId === e ? null : b.hoveredMaskId
	});
}
function ne(e, t) {
	j(e, (e) => e.map((e) => {
		if (e.id !== t) return e;
		let n = e.mode === "add" ? "subtract" : e.mode === "subtract" ? "intersect" : "add";
		return {
			...e,
			mode: n
		};
	}));
}
function I(e) {
	let t = e === "lumRange" ? { lumRange: o() } : { colorRange: s() }, n = k().find((e) => e.id === b.selectedMaskId) ?? null;
	if (n) {
		let r = n.components.length > 0 ? "intersect" : "add";
		P(n.id, {
			id: O("comp"),
			kind: e,
			mode: r,
			invert: !1,
			...t
		});
	} else N({
		id: O("mask"),
		name: e === "lumRange" ? "Luminance" : "Colour",
		visible: !0,
		invert: !1,
		opacity: 100,
		adj: a(),
		panels: [...i],
		components: [{
			id: O("comp"),
			kind: e,
			mode: "add",
			invert: !1,
			...t
		}]
	});
}
function re(e, t, n) {
	j(e, (e) => e.map((e) => e.id === t && e.brush ? {
		...e,
		brush: {
			...e.brush,
			dabs: [...e.brush.dabs, n]
		}
	} : e));
}
var ie = (e, n) => t.stores.useDevelopStore.getState().updateMask(e, { name: n });
function ae(e) {
	A(k().filter((t) => t.id !== e)), C({
		selectedMaskId: b.selectedMaskId === e ? null : b.selectedMaskId,
		selectedComponentId: b.selectedMaskId === e ? null : b.selectedComponentId,
		hoveredMaskId: b.hoveredMaskId === e ? null : b.hoveredMaskId
	});
}
//#endregion
//#region src/MaskCanvas.tsx
function oe(e, n, r) {
	let i = t.stores.useSettings.getState().uiScale || 1;
	return {
		x: (n - e.left) / i,
		y: (r - e.top) / i
	};
}
function se(e, t, n, r, i) {
	let a = d(n, r, i), o = (a.x - t.x) / t.width, s = (a.y - t.y) / t.height;
	return {
		x: e.x + o * e.w,
		y: e.y + s * e.h
	};
}
function ce(e, t, n, r, i) {
	let a = e(t, n), o = e(t + r / i, n), s = e(t, n + r), c = o.x - a.x, l = s.x - a.x, u = o.y - a.y, d = s.y - a.y, f = (c + d) / 2, p = (c - d) / 2, m = (u + l) / 2, h = (u - l) / 2, g = Math.hypot(f, h), _ = Math.hypot(p, m), v = (Math.atan2(m, p) + Math.atan2(h, f)) / 2 * (180 / Math.PI);
	return {
		rx: g + _,
		ry: Math.abs(g - _),
		angle: v
	};
}
var L = .01, R = 13, z = .06, le = Math.PI / 12, B = {
	add: "#4aa3ff",
	addDim: "rgba(255,255,255,0.5)",
	sub: "#ff7a4a",
	subDim: "rgba(255,150,90,0.5)"
};
function V(e, t, n, r) {
	let i = (r, i) => se(e, t, n, r, i), a = (e, t, n, i) => ({
		x: n + e / r,
		y: i + t
	});
	return {
		toScreen: i,
		radialHandle: (e, t) => {
			if (t === "center") return i(e.cx, e.cy);
			let n = Math.cos(e.angle), o = Math.sin(e.angle), s = 0, c = 0;
			t === "e" ? s = e.rx * r : t === "w" ? s = -e.rx * r : c = t === "n" ? -e.ry : t === "s" ? e.ry : -(e.ry + z);
			let l = a(n * s - o * c, o * s + n * c, e.cx, e.cy);
			return i(l.x, l.y);
		},
		rotatedEllipsePath: (e) => {
			let t = Math.cos(e.angle), n = Math.sin(e.angle), o = [];
			for (let s = 0; s <= 48; s++) {
				let c = s / 48 * Math.PI * 2, l = e.rx * r * Math.cos(c), u = e.ry * Math.sin(c), d = a(t * l - n * u, n * l + t * u, e.cx, e.cy), f = i(d.x, d.y);
				o.push(`${f.x.toFixed(1)},${f.y.toFixed(1)}`);
			}
			return "M" + o.join("L") + "Z";
		}
	};
}
function ue() {
	let e = { at: null }, t = /* @__PURE__ */ new Set();
	return {
		get: () => e,
		set(n) {
			e = n;
			for (let e of t) e();
		},
		subscribe(e) {
			return t.add(e), () => void t.delete(e);
		}
	};
}
function de(e, t, n) {
	let r = (t.x - e.x) * n, i = t.y - e.y, a = Math.hypot(r, i);
	if (a < 1e-6) return t;
	let o = Math.round(Math.atan2(i, r) / (Math.PI / 4)) * (Math.PI / 4);
	return {
		x: e.x + Math.cos(o) * a / n,
		y: e.y + Math.sin(o) * a
	};
}
function H({ rect: n }) {
	let r = t.stores.useDevelopStore, o = r((e) => e.params.masks), c = r((e) => e.params.straighten), l = r((e) => e.params.transform), u = r((e) => e.params.crop), { region: f, imageAspect: p, rect: m } = t.develop.useDevelopOverlay(), { activeTool: h, maskToolType: g, selectedMaskId: y, selectedComponentId: b } = ee(), [x] = e.useState(ue), [w, T] = e.useState(null), E = e.useRef(null), D = e.useRef(null), k = e.useMemo(() => n, [
		n.x,
		n.y,
		n.w,
		n.h
	]), A = f ?? u, j = e.useMemo(() => v(c, l, p), [
		c,
		l,
		p
	]), ne = e.useMemo(() => _(c, l, p), [
		c,
		l,
		p
	]), { toScreen: I, radialHandle: ie } = V(k, A, j, p), ae = (e, t) => {
		let n = (e - k.x) / k.w, r = (t - k.y) / k.h;
		return d(ne, A.x + n * A.width, A.y + r * A.height);
	}, se = (e) => oe(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY), z = r.getState, B = o.find((e) => e.id === y) ?? null, H = B?.components.find((e) => e.id === b) ?? null;
	function U(e, t) {
		let n = H;
		if (!n) return null;
		if (n.kind === "radial" && n.radial) {
			let r = ie(n.radial, "rotate");
			if (Math.hypot(e - r.x, t - r.y) <= R) return "radial-rotate";
			for (let [r, i] of [
				["e", "radial-e"],
				["w", "radial-w"],
				["n", "radial-n"],
				["s", "radial-s"]
			]) {
				let a = ie(n.radial, r);
				if (Math.hypot(e - a.x, t - a.y) <= R) return i;
			}
			let i = ie(n.radial, "center");
			if (Math.hypot(e - i.x, t - i.y) <= R) return "radial-move";
		} else if (n.kind === "linear" && n.linear) {
			let r = I(n.linear.x0, n.linear.y0), i = I(n.linear.x1, n.linear.y1);
			if (Math.hypot(e - r.x, t - r.y) <= R) return "linear-p0";
			if (Math.hypot(e - i.x, t - i.y) <= R) return "linear-p1";
		}
		return null;
	}
	function W(e) {
		let t = O("mask");
		return N({
			id: t,
			name: e.kind[0].toUpperCase() + e.kind.slice(1),
			visible: !0,
			invert: !1,
			opacity: 100,
			adj: a(),
			panels: [...i],
			components: [e]
		}), t;
	}
	function me(e) {
		return e.maskAddTarget === "new" ? "new" : e.selectedMaskId && o.some((t) => t.id === e.selectedMaskId) ? e.selectedMaskId : "new";
	}
	async function he(e, n, r, i) {
		if (!m) return;
		let a = (r - m.x) / m.w, o = (i - m.y) / m.h;
		if (a < 0 || a > 1 || o < 0 || o > 1) return;
		let c = z().photoId, l = await t.develop.probeMaskColour(a, o), u = z().photoId === c ? M(e, n) : void 0;
		l && u && (F(e, n, { colorRange: {
			...u.colorRange ?? s(),
			r: l[0],
			g: l[1],
			b: l[2]
		} }), z().commitEdit("Colour Range Pick"));
	}
	let ge = (e) => {
		if (e.button !== 0) return;
		let { x: t, y: n } = se(e);
		e.currentTarget.setPointerCapture(e.pointerId);
		let r = ae(t, n), i = S();
		if (i.maskColorPicking && B && H?.kind === "colorRange") {
			C({ maskColorPicking: !1 }), he(B.id, H.id, t, n);
			return;
		}
		if (h !== "mask") return;
		let a = U(t, n);
		if (a && B && H) {
			E.current = {
				kind: a,
				maskId: B.id,
				compId: H.id,
				downSrc: r
			};
			return;
		}
		let s = i.maskCompMode;
		if (g === "brush") {
			let t = me(i), n, a, c = t === "new" ? null : o.find((e) => e.id === t), l = c?.components.find((e) => e.id === i.selectedComponentId) ?? null, u = l && l.kind === "brush" && l.mode === s ? l : null;
			if (u && c) n = c.id, a = u.id, C({
				selectedMaskId: n,
				selectedComponentId: a
			});
			else {
				a = O("comp");
				let e = {
					id: a,
					kind: "brush",
					mode: s,
					invert: !1,
					brush: {
						dabs: [],
						feather: i.brushFeather
					}
				};
				t === "new" ? n = W(e) : (n = t, P(n, e)), C({ maskAddTarget: "current" });
			}
			let d = {
				radius: i.brushSize,
				erase: e.altKey || i.brushErase,
				feather: i.brushFeather,
				opacity: i.brushOpacity,
				flow: i.brushFlow
			};
			if (e.shiftKey && D.current) {
				let e = D.current, t = Math.hypot((r.x - e.x) * p, r.y - e.y), o = Math.max(1, Math.ceil(t / (i.brushSize * .25)));
				for (let t = 1; t <= o; t++) {
					let i = t / o;
					re(n, a, {
						x: e.x + (r.x - e.x) * i,
						y: e.y + (r.y - e.y) * i,
						...d,
						strokeStart: t === 1 || void 0
					});
				}
			} else re(n, a, {
				x: r.x,
				y: r.y,
				...d,
				strokeStart: !0
			});
			D.current = r, E.current = {
				kind: "brush",
				maskId: n,
				compId: a,
				downSrc: r,
				lastDab: r
			};
			return;
		}
		let c = me(i), l = O("comp"), u = g === "radial" ? {
			id: l,
			kind: "radial",
			mode: s,
			invert: !1,
			radial: {
				cx: r.x,
				cy: r.y,
				rx: .001,
				ry: .001,
				feather: .5,
				angle: 0
			}
		} : {
			id: l,
			kind: "linear",
			mode: s,
			invert: !1,
			linear: {
				x0: r.x,
				y0: r.y,
				x1: r.x,
				y1: r.y
			}
		}, d;
		c === "new" ? d = W(u) : (d = c, P(d, u)), C({ maskAddTarget: "current" }), E.current = {
			kind: g === "radial" ? "create-radial" : "create-linear",
			maskId: d,
			compId: l,
			downSrc: r,
			fromCenter: e.altKey
		};
	}, G = (e) => {
		let { x: t, y: n } = se(e);
		x.set({ at: {
			x: t,
			y: n,
			alt: e.altKey
		} });
		let r = E.current;
		if (!r) {
			h === "mask" && T(U(t, n));
			return;
		}
		let i = ae(t, n), a = e.shiftKey, o = M(r.maskId, r.compId);
		switch (r.kind) {
			case "create-radial": {
				let e, t, n, o;
				if (r.fromCenter ? (e = r.downSrc.x, t = r.downSrc.y, n = Math.max(.001, Math.abs(i.x - r.downSrc.x)), o = Math.max(.001, Math.abs(i.y - r.downSrc.y))) : (e = (r.downSrc.x + i.x) / 2, t = (r.downSrc.y + i.y) / 2, n = Math.max(.001, Math.abs(i.x - r.downSrc.x) / 2), o = Math.max(.001, Math.abs(i.y - r.downSrc.y) / 2)), a) {
					let e = Math.max(n * p, o);
					n = e / p, o = e;
				}
				F(r.maskId, r.compId, { radial: {
					cx: e,
					cy: t,
					rx: n,
					ry: o,
					feather: .5,
					angle: 0
				} });
				break;
			}
			case "create-linear": {
				let e = a ? de(r.downSrc, i, p) : i;
				F(r.maskId, r.compId, { linear: {
					x0: r.downSrc.x,
					y0: r.downSrc.y,
					x1: e.x,
					y1: e.y
				} });
				break;
			}
			case "radial-move":
				o?.radial && F(r.maskId, r.compId, { radial: {
					...o.radial,
					cx: i.x,
					cy: i.y
				} });
				break;
			case "radial-e":
			case "radial-w":
			case "radial-n":
			case "radial-s": {
				if (!o?.radial) break;
				let t = o.radial, n = (i.x - t.cx) * p, s = i.y - t.cy, c = Math.cos(-t.angle), l = Math.sin(-t.angle), u = c * n - l * s, d = l * n + c * s, f = t.angle, m = r.kind === "radial-e" || r.kind === "radial-w", h = m ? u : d, g = m ? t.rx * p : t.ry, _ = r.kind === "radial-e" || r.kind === "radial-s" ? 1 : -1, v, y = t.cx, b = t.cy;
				if (e.altKey) v = Math.abs(h);
				else {
					let e = -_ * g;
					v = Math.abs(h - e) / 2;
					let n = (h + e) / 2, r = m ? Math.cos(f) * n : -Math.sin(f) * n, i = m ? Math.sin(f) * n : Math.cos(f) * n;
					y = t.cx + r / p, b = t.cy + i;
				}
				let x = t.rx, S = t.ry;
				m ? x = Math.max(.002, v / p) : S = Math.max(.002, v), a && (m && t.rx > 1e-4 ? S = Math.max(.002, t.ry * (x / t.rx)) : !m && t.ry > 1e-4 && (x = Math.max(.002, t.rx * (S / t.ry)))), F(r.maskId, r.compId, { radial: {
					...t,
					rx: x,
					ry: S,
					cx: y,
					cy: b
				} });
				break;
			}
			case "radial-rotate": {
				if (!o?.radial) break;
				let e = (i.x - o.radial.cx) * p, t = i.y - o.radial.cy, n = Math.atan2(t, e) + Math.PI / 2;
				a && (n = Math.round(n / le) * le), F(r.maskId, r.compId, { radial: {
					...o.radial,
					angle: n
				} });
				break;
			}
			case "linear-p0": {
				if (!o?.linear) break;
				let e = a ? de({
					x: o.linear.x1,
					y: o.linear.y1
				}, i, p) : i;
				F(r.maskId, r.compId, { linear: {
					...o.linear,
					x0: e.x,
					y0: e.y
				} });
				break;
			}
			case "linear-p1": {
				if (!o?.linear) break;
				let e = a ? de({
					x: o.linear.x0,
					y: o.linear.y0
				}, i, p) : i;
				F(r.maskId, r.compId, { linear: {
					...o.linear,
					x1: e.x,
					y1: e.y
				} });
				break;
			}
			case "brush": {
				let t = S(), n = r.lastDab ?? r.downSrc;
				Math.hypot((i.x - n.x) * p, i.y - n.y) >= t.brushSize * .25 && (re(r.maskId, r.compId, {
					x: i.x,
					y: i.y,
					radius: t.brushSize,
					erase: e.altKey || t.brushErase,
					feather: t.brushFeather,
					opacity: t.brushOpacity,
					flow: t.brushFlow
				}), r.lastDab = i, D.current = i);
				break;
			}
		}
	}, K = () => {
		let e = E.current;
		if (E.current = null, !e) return;
		let t = M(e.maskId, e.compId);
		e.kind === "create-radial" && t?.radial && (t.radial.rx < .01 || t.radial.ry < .01) || e.kind === "create-linear" && t?.linear && Math.hypot(t.linear.x1 - t.linear.x0, t.linear.y1 - t.linear.y0) < .01 ? (te(e.maskId, e.compId), C({
			selectedMaskId: null,
			selectedComponentId: null
		})) : z().commitEdit("Mask");
	}, q = fe(), _e = e.useMemo(() => {
		let e = ae(k.x + k.w / 2, k.y + k.h / 2), t = ce(I, e.x, e.y, L, p);
		return {
			rx: t.rx / L,
			ry: t.ry / L,
			angle: t.angle
		};
	}, [
		k,
		A,
		j,
		ne,
		p
	]);
	return /* @__PURE__ */ e.createElement("div", {
		"data-mask-canvas": "",
		style: {
			position: "absolute",
			inset: 0,
			cursor: t.cursors.resolve("crosshair"),
			touchAction: "none"
		},
		onPointerDown: ge,
		onPointerMove: G,
		onPointerUp: K,
		onPointerLeave: () => x.set({ at: null })
	}, /* @__PURE__ */ e.createElement("svg", { style: {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		pointerEvents: "none"
	} }, h === "mask" && /* @__PURE__ */ e.createElement(q, {
		masks: o,
		selectedMaskId: y,
		selectedComponentId: b,
		hovered: w,
		rect: k,
		crop: A,
		forward: j,
		imageAspect: p
	}), /* @__PURE__ */ e.createElement(pe, {
		pointer: x,
		rect: k,
		ringScale: _e
	})));
}
function U({ masks: t, selectedMaskId: n, selectedComponentId: r, hovered: i, rect: a, crop: o, forward: s, imageAspect: c }) {
	let { toScreen: l, radialHandle: u, rotatedEllipsePath: d } = V(a, o, s, c);
	return /* @__PURE__ */ e.createElement(e.Fragment, null, t.flatMap((t) => t.components.map((a) => {
		let o = a.id === r && t.id === n, s = a.mode === "subtract", c = o ? s ? B.sub : B.add : s ? B.subDim : B.addDim, f = s ? B.sub : B.add, p = t.id + ":" + a.id;
		if (a.kind === "radial" && a.radial) {
			let t = a.radial, n = u(t, "center"), r = u(t, "rotate"), l = (e) => i === e && o ? 6 : 5;
			return /* @__PURE__ */ e.createElement("g", { key: p }, /* @__PURE__ */ e.createElement("path", {
				d: d(t),
				fill: "none",
				stroke: c,
				strokeWidth: o ? 1.8 : 1.4,
				strokeDasharray: s ? "5 4" : void 0
			}), o && /* @__PURE__ */ e.createElement("line", {
				x1: n.x,
				y1: n.y,
				x2: r.x,
				y2: r.y,
				stroke: f,
				strokeWidth: 1,
				opacity: .6
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: n.x,
				cy: n.y,
				r: l("radial-move"),
				fill: f
			}), o && [
				["radial-e", "e"],
				["radial-w", "w"],
				["radial-n", "n"],
				["radial-s", "s"]
			].map(([n, r]) => {
				let i = u(t, r);
				return /* @__PURE__ */ e.createElement("circle", {
					key: n,
					cx: i.x,
					cy: i.y,
					r: l(n),
					fill: "#fff",
					stroke: f,
					strokeWidth: 1.5
				});
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: r.x,
				cy: r.y,
				r: l("radial-rotate") + 1,
				fill: f,
				stroke: "#fff",
				strokeWidth: 1.5
			}));
		}
		if (a.kind === "linear" && a.linear) {
			let t = l(a.linear.x0, a.linear.y0), n = l(a.linear.x1, a.linear.y1), r = n.x - t.x, s = n.y - t.y, u = Math.hypot(r, s) || 1, d = -s / u * 400, m = r / u * 400;
			return /* @__PURE__ */ e.createElement("g", { key: p }, /* @__PURE__ */ e.createElement("line", {
				x1: t.x,
				y1: t.y,
				x2: n.x,
				y2: n.y,
				stroke: c,
				strokeWidth: 1.2
			}), /* @__PURE__ */ e.createElement("line", {
				x1: t.x - d,
				y1: t.y - m,
				x2: t.x + d,
				y2: t.y + m,
				stroke: c,
				strokeWidth: 1.2,
				strokeDasharray: "4 4"
			}), /* @__PURE__ */ e.createElement("line", {
				x1: n.x - d,
				y1: n.y - m,
				x2: n.x + d,
				y2: n.y + m,
				stroke: c,
				strokeWidth: 1.2
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: t.x,
				cy: t.y,
				r: i === "linear-p0" ? 6 : 5,
				fill: "#fff",
				stroke: f,
				strokeWidth: 1.5
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: n.x,
				cy: n.y,
				r: i === "linear-p1" ? 6 : 5,
				fill: f,
				stroke: "#fff",
				strokeWidth: 1.5
			}));
		}
		return null;
	})));
}
var W = null, fe = () => W ??= e.memo(U);
function pe({ pointer: t, rect: n, ringScale: r }) {
	let { at: i } = e.useSyncExternalStore(t.subscribe, t.get), { activeTool: a, maskToolType: o, brushErase: s, maskCompMode: c, brushSize: l, brushFeather: u, brushPreview: d } = ee(), f = a === "mask" && o === "brush", p = f ? i : null, m = (e, t, n, i) => ({
		cx: e,
		cy: t,
		rx: Math.max(i, r.rx * l * n),
		ry: Math.max(i, r.ry * l * n),
		transform: `rotate(${r.angle} ${e} ${t})`
	}), h = i?.alt || s || c === "subtract", g = d && f, _ = n.x + n.w / 2, v = n.y + n.h / 2, y = h ? "#ff6b6b" : "#fff";
	return /* @__PURE__ */ e.createElement(e.Fragment, null, p && /* @__PURE__ */ e.createElement("g", null, /* @__PURE__ */ e.createElement("ellipse", {
		...m(p.x, p.y, 1, 3),
		fill: "none",
		stroke: y,
		strokeWidth: 1.2,
		strokeDasharray: h ? "4 3" : void 0,
		opacity: .9
	}), /* @__PURE__ */ e.createElement("ellipse", {
		...m(p.x, p.y, 1 - u, 1),
		fill: "none",
		stroke: y,
		strokeWidth: .6,
		opacity: .4
	})), g && /* @__PURE__ */ e.createElement("g", { opacity: .8 }, /* @__PURE__ */ e.createElement("ellipse", {
		...m(_, v, 1, 3),
		fill: "none",
		stroke: "#fff",
		strokeWidth: 1.2
	}), /* @__PURE__ */ e.createElement("ellipse", {
		...m(_, v, 1 - u, 1),
		fill: "none",
		stroke: "#fff",
		strokeWidth: .6,
		opacity: .5
	})));
}
var me = {
	"brush.smaller": {
		key: "brushSize",
		step: -.01,
		min: .01,
		max: .5,
		digits: 3
	},
	"brush.larger": {
		key: "brushSize",
		step: .01,
		min: .01,
		max: .5,
		digits: 3
	},
	"brush.featherDown": {
		key: "brushFeather",
		step: -.05,
		min: 0,
		max: 1,
		digits: 2
	},
	"brush.featherUp": {
		key: "brushFeather",
		step: .05,
		min: 0,
		max: 1,
		digits: 2
	},
	"brush.opacityDown": {
		key: "brushOpacity",
		step: -.1,
		min: .01,
		max: 1,
		digits: 2
	},
	"brush.opacityUp": {
		key: "brushOpacity",
		step: .1,
		min: .01,
		max: 1,
		digits: 2
	},
	"brush.flowDown": {
		key: "brushFlow",
		step: -.1,
		min: .01,
		max: 1,
		digits: 2
	},
	"brush.flowUp": {
		key: "brushFlow",
		step: .1,
		min: .01,
		max: 1,
		digits: 2
	}
};
function he(e, n) {
	let r = S();
	if (e === "mask.delete") return !r.selectedMaskId || !r.selectedComponentId ? !1 : (n && (te(r.selectedMaskId, r.selectedComponentId), t.stores.useDevelopStore.getState().commitEdit("Delete Component")), !0);
	let i = me[e];
	if (!i || i.key === "brushSize" && (r.activeTool !== "mask" || r.maskToolType !== "brush")) return !1;
	if (n) {
		let e = {};
		e[i.key] = Math.max(i.min, Math.min(i.max, Number((r[i.key] + i.step).toFixed(i.digits)))), C(e);
	}
	return !0;
}
var ge = {
	overlay: H,
	zoomable: !0,
	onEscape: E,
	onAction: (e) => he(e, !0),
	wants: (e) => he(e, !1)
}, G = "safelight-masks", K = {
	panel: `${G}-panel`,
	menuAnchor: `${G}-menu-anchor`,
	create: `${G}-create`,
	head: `${G}-head`,
	hint: `${G}-hint`,
	done: `${G}-done`,
	brush: `${G}-brush`,
	erase: `${G}-erase`,
	muted: `${G}-muted`,
	list: `${G}-list`,
	row: `${G}-row`,
	on: `${G}-on`,
	off: `${G}-off`,
	eye: `${G}-eye`,
	hidden: `${G}-hidden`,
	kinds: `${G}-kinds`,
	rename: `${G}-rename`,
	name: `${G}-name`,
	invert: `${G}-invert`,
	reveal: `${G}-reveal`,
	remove: `${G}-remove`,
	editor: `${G}-editor`,
	tabs: `${G}-tabs`,
	tab: `${G}-tab`,
	section: `${G}-section`,
	mode: `${G}-mode`,
	add: `${G}-add`,
	subtract: `${G}-subtract`,
	intersect: `${G}-intersect`,
	icon: `${G}-icon`,
	addComponent: `${G}-add-component`,
	caption: `${G}-caption`,
	reset: `${G}-reset`,
	card: `${G}-card`,
	cardHead: `${G}-card-head`,
	note: `${G}-note`,
	noteText: `${G}-note-text`,
	dim: `${G}-dim`,
	panels: `${G}-panels`,
	addPanel: `${G}-add-panel`,
	catcher: `${G}-catcher`,
	menu: `${G}-menu`,
	item: `${G}-item`,
	itemIcon: `${G}-item-icon`,
	divider: `${G}-divider`,
	controls: `${G}-controls`,
	ranges: `${G}-ranges`,
	fields: `${G}-fields`,
	field: `${G}-field`,
	fieldLabel: `${G}-field-label`,
	fieldInput: `${G}-field-input`,
	pick: `${G}-pick`,
	swatch: `${G}-swatch`
}, q = (e, t) => `color-mix(in srgb, ${e} ${t}%, transparent)`;
function _e(e) {
	return `
:where(.${K.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${K.menuAnchor}) { position: relative; }
:where(.${K.create}) { display: flex; width: 100%; align-items: center; justify-content: center; gap: 0.25rem; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.375rem 0.5rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${K.create}:hover) { color: ${e.textPrimary}; }
:where(.${K.create}:disabled) { cursor: default; opacity: 0.4; }
:where(.${K.head}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${K.hint}) { font-size: 10px; color: ${e.textMuted}; }
:where(.${K.done}) { border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.125rem 0.375rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${K.done}:hover) { color: ${e.textPrimary}; }
:where(.${K.brush}) { border-radius: 0.25rem; background-color: ${q(e.surface2, 50)}; padding: 0.375rem; }
:where(.${K.brush} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${K.erase}) { display: flex; align-items: center; gap: 0.375rem; padding: 0 0.125rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${K.muted}) { color: ${e.textMuted}; }
:where(.${K.list} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${K.row}) { display: flex; cursor: pointer; align-items: center; gap: 0.375rem; border-radius: 0.25rem; padding: 0.25rem 0.375rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${K.row}:hover) { background-color: ${e.surface2}; }
:where(.${K.row}.${K.on}) { background-color: ${q(e.accent, 20)}; color: ${e.textPrimary}; }
:where(.${K.row}.${K.off}) { opacity: 0.5; }
:where(.${K.eye}) { flex-shrink: 0; border-radius: 0.25rem; padding: 0 0.125rem; color: ${e.textMuted}; }
:where(.${K.eye}.${K.hidden}) { color: ${q(e.textMuted, 40)}; }
:where(.${K.eye}:hover) { color: ${e.textPrimary}; }
:where(.${K.kinds}) { flex-shrink: 0; color: ${e.textMuted}; }
:where(.${K.rename}) { min-width: 0; flex: 1 1 0%; border-radius: 0.25rem; background-color: ${e.surface3}; padding: 0 0.25rem; font-size: 11px; color: ${e.textPrimary}; outline: none; }
:where(.${K.name}) { flex: 1 1 0%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where(.${K.invert}) { border-radius: 0.25rem; padding: 0 0.25rem; color: ${e.textMuted}; }
:where(.${K.invert}:hover) { color: ${e.textPrimary}; }
:where(.${K.invert}.${K.on}) { color: ${e.accent}; }
:where(.${K.remove}) { border-radius: 0.25rem; padding: 0 0.25rem; color: ${e.textMuted}; }
:where(.${K.remove}:hover) { color: ${e.labelRed}; }
:where(.${K.reveal}:not(.${K.on})) { opacity: 0; }
:where(.${K.row}:hover .${K.reveal}) { opacity: 1; }
:where(.${K.editor}) { border-top: 1px solid ${e.borderSubtle}; padding-top: 0.5rem; }
:where(.${K.editor} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${K.tabs}) { display: flex; gap: 0.25rem; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.125rem; }
:where(.${K.tab}) { flex: 1 1 0%; border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 11px; text-transform: capitalize; color: ${e.textSecondary}; }
:where(.${K.tab}:hover) { color: ${e.textPrimary}; }
:where(.${K.tab}.${K.on}) { background-color: ${q(e.accent, 30)}; color: ${e.textPrimary}; }
:where(.${K.section} > :not(:last-child)) { margin-block: 0 0.375rem; }
:where(.${K.mode}) { width: 1rem; flex-shrink: 0; border-radius: 0.25rem; text-align: center; font-weight: 700; }
:where(.${K.mode}.${K.add}) { color: ${e.accent}; }
:where(.${K.mode}.${K.subtract}) { color: ${e.labelYellow}; }
:where(.${K.mode}.${K.intersect}) { color: ${e.labelBlue}; }
:where(.${K.icon}) { width: 0.75rem; flex-shrink: 0; text-align: center; color: ${e.textMuted}; }
:where(.${K.addComponent}) { display: flex; width: 100%; align-items: center; justify-content: center; gap: 0.25rem; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.25rem 0.5rem; font-size: 10px; color: ${e.textSecondary}; }
:where(.${K.addComponent}:hover) { color: ${e.textPrimary}; }
:where(.${K.caption}) { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${e.textMuted}; }
:where(.${K.reset}) { border-radius: 0.25rem; padding: 0 0.25rem; font-size: 10px; color: ${e.textMuted}; }
:where(.${K.reset}:hover) { color: ${e.textPrimary}; }
:where(.${K.card}) { border-radius: 0.25rem; background-color: ${q(e.surface2, 40)}; padding: 0.375rem; }
:where(.${K.cardHead}) { margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; }
:where(.${K.note}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${K.noteText}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: ${e.textMuted}; }
:where(.${K.dim}) { opacity: 0.7; }
:where(.${K.panels}) { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
:where(.${K.addPanel}) { border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.125rem 0.375rem; font-size: 10px; color: ${e.textSecondary}; }
:where(.${K.addPanel}:hover) { color: ${e.textPrimary}; }
:where(.${K.addPanel}:disabled) { cursor: default; opacity: 0.4; }
:where(.${K.catcher}) { position: fixed; inset: 0; z-index: 10; }
:where(.${K.menu}) { position: absolute; left: 0; right: 0; top: 100%; z-index: 20; margin-top: 0.125rem; border-radius: 0.25rem; border: 1px solid ${e.borderSubtle}; background-color: ${e.surface3}; padding: 0.25rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
:where(.${K.menu} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${K.item}) { display: flex; width: 100%; align-items: center; gap: 0.375rem; border-radius: 0.25rem; padding: 0.25rem 0.375rem; text-align: left; font-size: 11px; color: ${e.textSecondary}; }
:where(.${K.item}:hover) { background-color: ${e.surface2}; color: ${e.textPrimary}; }
:where(.${K.itemIcon}) { width: 0.75rem; text-align: center; color: ${e.textMuted}; }
:where(.${K.divider}) { margin-block: 0.125rem; border-top: 1px solid ${e.borderSubtle}; }
:where(.${K.controls}) { border-radius: 0.25rem; background-color: ${q(e.surface2, 40)}; padding: 0.375rem; }
:where(.${K.controls} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${K.ranges}) { border-radius: 0.25rem; background-color: ${q(e.surface2, 40)}; padding: 0.375rem; }
:where(.${K.ranges} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${K.fields}) { display: flex; flex-wrap: wrap; column-gap: 0.5rem; row-gap: 0.25rem; }
:where(.${K.field}) { display: flex; align-items: center; gap: 0.25rem; font-size: 10px; color: ${e.textMuted}; }
:where(.${K.fieldLabel}) { user-select: none; }
:where(.${K.fieldInput}) { width: 2.75rem; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0 0.25rem; text-align: right; font-variant-numeric: tabular-nums; color: ${e.textPrimary}; outline: none; }
:where(.${K.fieldInput}:focus) { background-color: ${e.surface3}; }
:where(.${K.pick}) { display: flex; align-items: center; gap: 0.25rem; border-radius: 0.25rem; border: 1px solid ${e.borderSubtle}; padding: 0.125rem 0.375rem; font-size: 10px; color: ${e.textSecondary}; }
:where(.${K.pick}:hover) { color: ${e.textPrimary}; }
:where(.${K.pick}.${K.on}) { border-color: ${e.accent}; color: ${e.accent}; }
:where(.${K.swatch}) { height: 0.625rem; width: 0.625rem; border-radius: 0.125rem; }
html.sl-larger-text .${K.hint}, html.sl-larger-text .${K.addComponent}, html.sl-larger-text .${K.caption}, html.sl-larger-text .${K.reset}, html.sl-larger-text .${K.noteText}, html.sl-larger-text .${K.addPanel}, html.sl-larger-text .${K.field}, html.sl-larger-text .${K.pick} { font-size: 12px !important; }
html.sl-larger-text .${K.create}, html.sl-larger-text .${K.done}, html.sl-larger-text .${K.erase}, html.sl-larger-text .${K.row}, html.sl-larger-text .${K.rename}, html.sl-larger-text .${K.tab}, html.sl-larger-text .${K.item} { font-size: 13px !important; line-height: 1.45 !important; }
html.sl-larger-text .${K.caption} { text-transform: none !important; letter-spacing: normal !important; }
`;
}
//#endregion
//#region src/MasksPanel.tsx
var ve = "Update processing", ye = [
	{
		type: "radial",
		label: "Radial"
	},
	{
		type: "linear",
		label: "Linear"
	},
	{
		type: "brush",
		label: "Brush"
	}
], be = [{
	kind: "lumRange",
	label: "Luminance Range"
}, {
	kind: "colorRange",
	label: "Colour Range"
}], xe = {
	radial: "◯",
	linear: "▤",
	brush: "✎",
	lumRange: "◐",
	colorRange: "⬤"
}, Se = {
	radial: "Radial",
	linear: "Linear",
	brush: "Brush",
	lumRange: "Luminance",
	colorRange: "Colour"
}, Ce = {
	add: "+",
	subtract: "−",
	intersect: "∩"
}, we = {
	add: K.add,
	subtract: K.subtract,
	intersect: K.intersect
}, Te = {
	add: "Add (union) — click to cycle",
	subtract: "Subtract (carve) — click to cycle",
	intersect: "Intersect (confine) — click to cycle"
}, J = (e) => e ? ` ${K.on}` : "";
function Ee({ def: t, onRemove: n }) {
	let r = t.component;
	return /* @__PURE__ */ e.createElement("div", { className: K.card }, /* @__PURE__ */ e.createElement("div", { className: K.cardHead }, /* @__PURE__ */ e.createElement("span", { className: K.caption }, t.title), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: n,
		title: `Remove ${t.title} (resets its values)`,
		className: K.remove
	}, "×")), /* @__PURE__ */ e.createElement(r, null));
}
function De() {
	let { Panel: n, Slider: r, MaskScope: i } = t.components, o = t.stores.useDevelopStore, s = o((e) => e.params.masks), c = o((e) => e.commitEdit), l = o((e) => e.updateMask), u = o((e) => e.updateMaskAdj), d = o((e) => e.seedMaskPanelValues), f = o((e) => e.clearMaskPanelValues), p = t.develop.useOlderProcessing(), m = t.develop.useMaskPanels(), h = t.develop.useCanvasToolHeld(), g = ee(), { activeTool: _, maskToolType: v, maskCompMode: y, selectedMaskId: b, selectedComponentId: x, maskTab: S } = g, w = _ === "mask";
	e.useEffect(() => {
		w && !h && C({ activeTool: "none" });
	}, [w, h]);
	let T = s.length >= 16, D = s.find((e) => e.id === b) ?? null, O = D?.components.find((e) => e.id === x) ?? null, [k, A] = e.useState(!1), [j, M] = e.useState(!1), [N, P] = e.useState(null), re = (e, t) => C({
		maskToolType: e,
		maskCompMode: t,
		maskAddTarget: D ? "current" : "new",
		activeTool: "mask"
	}), oe = (e) => C({
		selectedMaskId: null,
		maskToolType: e,
		maskCompMode: "add",
		maskAddTarget: "new",
		activeTool: "mask"
	}), se = (e) => {
		M(!1), C({ maskTab: "coverage" }), e === "lumRange" || e === "colorRange" ? (C({ selectedMaskId: null }), I(e), c("New Mask")) : oe(e);
	}, ce = (e) => {
		A(!1), e === "lumRange" || e === "colorRange" ? (I(e), c("Add Component")) : (C({ selectedComponentId: null }), re(e, "add"));
	}, L = (e) => p && e.extensionParams, R = D ? m.filter((e) => D.panels.includes(e.id)) : [], z = D ? D.panels.filter((e) => !m.some((t) => t.id === e)) : [], le = () => {
		if (D) {
			u(D.id, a());
			for (let e of R) d(D.id, e.owns);
			c("Mask Reset");
		}
	}, B = (e) => {
		D && (d(D.id, e.owns), l(D.id, { panels: [...D.panels, e.id] }), c("Add Mask Panel"));
	}, V = (e) => {
		if (!D) return;
		let t = m.find((t) => t.id === e);
		t && f(D.id, t.owns), l(D.id, { panels: D.panels.filter((t) => t !== e) }), c("Remove Mask Panel");
	}, ue = D ? m.filter((e) => !D.panels.includes(e.id)) : [], de = (e, t) => {
		C({
			selectedMaskId: e.id,
			selectedComponentId: t.id
		}), (t.kind === "radial" || t.kind === "linear" || t.kind === "brush") && C({
			maskToolType: t.kind,
			maskCompMode: t.mode === "subtract" ? "subtract" : "add",
			maskAddTarget: "current",
			activeTool: "mask"
		});
	}, H = (e) => {
		let t = [];
		for (let n of e.components) t.includes(n.kind) || t.push(n.kind);
		return t;
	}, U = (e) => {
		e.target === e.currentTarget && C({
			selectedMaskId: null,
			selectedComponentId: null,
			hoveredMaskId: null
		});
	}, W = (t, n, i, a) => /* @__PURE__ */ e.createElement(r, {
		label: t,
		value: Math.round(g[n] * 100),
		min: i,
		max: n === "brushSize" ? 50 : 100,
		step: 1,
		defaultValue: a,
		onChange: (e) => {
			let t = { brushPreview: !0 };
			t[n] = e / 100, C(t);
		},
		onCommit: () => C({ brushPreview: !1 })
	});
	return /* @__PURE__ */ e.createElement(n, {
		title: "Masking",
		defaultOpen: !0
	}, /* @__PURE__ */ e.createElement("div", {
		className: K.panel,
		onClick: U
	}, /* @__PURE__ */ e.createElement("div", { className: K.menuAnchor }, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => {
			M((e) => !e), A(!1);
		},
		disabled: T,
		title: T ? "Mask limit reached (16)" : void 0,
		className: K.create
	}, "+ Create Mask ▾"), j && /* @__PURE__ */ e.createElement(Oe, {
		onPick: (e) => se(e),
		onClose: () => M(!1)
	})), /* @__PURE__ */ e.createElement("div", { className: K.head }, /* @__PURE__ */ e.createElement("span", { className: K.hint }, w ? v === "brush" ? `Paint to ${y === "subtract" ? "subtract" : "add"}` : `Drag to ${y === "subtract" ? "subtract" : "add"} a ${v}` : `${s.length}/16 masks`), w && /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: E,
		className: K.done
	}, "Done")), w && v === "brush" && /* @__PURE__ */ e.createElement("div", { className: K.brush }, W("Size", "brushSize", 1, 8), W("Feather", "brushFeather", 0, 50), W("Opacity", "brushOpacity", 1, 100), W("Flow", "brushFlow", 1, 100), /* @__PURE__ */ e.createElement("label", { className: K.erase }, /* @__PURE__ */ e.createElement("input", {
		type: "checkbox",
		checked: g.brushErase,
		onChange: (e) => C({ brushErase: e.target.checked }),
		style: { accentColor: t.ui.tokens.sliderFill }
	}), "Erase", /* @__PURE__ */ e.createElement("span", { className: K.muted }, "· Alt erase · [ ] size · ⇧ feather · , . opacity · ⇧, ⇧. flow"))), s.length > 0 && /* @__PURE__ */ e.createElement("div", {
		className: K.list,
		onClick: U
	}, s.map((t) => {
		let n = t.visible !== !1;
		return /* @__PURE__ */ e.createElement("div", {
			key: t.id,
			onClick: () => C({
				selectedMaskId: t.id,
				selectedComponentId: t.components[0]?.id ?? null,
				maskTab: "coverage"
			}),
			onMouseEnter: () => C({ hoveredMaskId: t.id }),
			onMouseLeave: () => C({ hoveredMaskId: null }),
			className: K.row + J(t.id === b) + (n ? "" : ` ${K.off}`)
		}, /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation(), l(t.id, { visible: !n }), c("Mask Visibility");
			},
			onMouseEnter: () => C({ hoveredMaskId: null }),
			onMouseLeave: () => C({ hoveredMaskId: t.id }),
			title: n ? "Hide" : "Show",
			className: K.eye + (n ? "" : ` ${K.hidden}`)
		}, n ? "◉" : "○"), /* @__PURE__ */ e.createElement("span", { className: K.kinds }, H(t).map((e) => xe[e]).join(" ")), N?.id === t.id ? /* @__PURE__ */ e.createElement("input", {
			autoFocus: !0,
			value: N.value,
			onClick: (e) => e.stopPropagation(),
			onChange: (e) => P({
				id: t.id,
				value: e.target.value
			}),
			onBlur: () => {
				let e = N.value.trim();
				e && ie(t.id, e), P(null), c("Rename Mask");
			},
			onKeyDown: (e) => {
				e.key === "Enter" && e.currentTarget.blur(), e.key === "Escape" && P(null);
			},
			className: K.rename
		}) : /* @__PURE__ */ e.createElement("span", {
			className: K.name,
			onDoubleClick: (e) => {
				e.stopPropagation(), P({
					id: t.id,
					value: t.name
				});
			}
		}, t.name, /* @__PURE__ */ e.createElement("span", { className: K.muted }, " (", t.components.length, ")")), /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation(), l(t.id, { invert: !t.invert }), c("Mask Invert");
			},
			title: "Invert whole mask",
			className: `${K.invert} ${K.reveal}${J(t.invert)}`
		}, "⊘"), /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation(), ae(t.id), c("Delete Mask");
			},
			title: "Delete mask",
			"aria-label": "Delete mask",
			className: `${K.remove} ${K.reveal}`
		}, "×"));
	})), D && /* @__PURE__ */ e.createElement("div", { className: K.editor }, /* @__PURE__ */ e.createElement("div", { className: K.tabs }, ["coverage", "adjust"].map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t,
		type: "button",
		onClick: () => C({ maskTab: t }),
		className: K.tab + J(S === t)
	}, t))), S === "coverage" ? /* @__PURE__ */ e.createElement("div", { className: K.section }, /* @__PURE__ */ e.createElement("div", { className: K.list }, D.components.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		onClick: () => de(D, t),
		className: K.row + J(t.id === x)
	}, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: (e) => {
			e.stopPropagation(), ne(D.id, t.id), c("Component Mode");
		},
		title: Te[t.mode],
		className: `${K.mode} ${we[t.mode]}`
	}, Ce[t.mode]), /* @__PURE__ */ e.createElement("span", { className: K.icon }, xe[t.kind]), /* @__PURE__ */ e.createElement("span", { className: K.name }, Se[t.kind]), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: (e) => {
			e.stopPropagation(), F(D.id, t.id, { invert: !t.invert }), c("Component Invert");
		},
		title: "Invert this component",
		className: K.invert + J(t.invert)
	}, "⊘"), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: (e) => {
			e.stopPropagation(), te(D.id, t.id), c("Delete Component");
		},
		title: "Delete component",
		"aria-label": "Delete component",
		className: K.remove
	}, "×")))), /* @__PURE__ */ e.createElement("div", { className: K.menuAnchor }, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => {
			A((e) => !e), M(!1);
		},
		className: K.addComponent
	}, "+ Add Component ▾"), k && /* @__PURE__ */ e.createElement(Oe, {
		onPick: (e) => ce(e),
		onClose: () => A(!1)
	})), O && /* @__PURE__ */ e.createElement(ke, {
		key: O.id,
		maskId: D.id,
		comp: O
	})) : /* @__PURE__ */ e.createElement("div", { className: K.section }, /* @__PURE__ */ e.createElement("div", { className: K.head }, /* @__PURE__ */ e.createElement("span", { className: K.caption }, "Amount"), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: le,
		title: "Reset this mask's adjustments",
		className: K.reset
	}, "Reset")), /* @__PURE__ */ e.createElement(r, {
		label: "Opacity",
		value: D.opacity,
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 100,
		onChange: (e) => l(D.id, { opacity: e }),
		onCommit: () => void c("Mask Amount")
	}), /* @__PURE__ */ e.createElement(i, {
		key: D.id,
		maskId: D.id
	}, R.filter((e) => !L(e)).map((t) => /* @__PURE__ */ e.createElement(Ee, {
		key: t.id,
		def: t,
		onRemove: () => V(t.id)
	}))), R.filter(L).map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		className: `${K.card} ${K.note}`
	}, /* @__PURE__ */ e.createElement("span", { className: K.noteText }, t.title, " ", /* @__PURE__ */ e.createElement("span", { className: K.dim }, "(needs ", ve, ")")), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => V(t.id),
		title: `Remove ${t.title} (resets its values)`,
		className: K.remove
	}, "×"))), z.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t,
		className: `${K.card} ${K.note}`
	}, /* @__PURE__ */ e.createElement("span", { className: K.noteText }, t, " ", /* @__PURE__ */ e.createElement("span", { className: K.dim }, "(not installed)")), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => V(t),
		title: `Remove ${t}`,
		className: K.remove
	}, "×"))), ue.length > 0 && /* @__PURE__ */ e.createElement("div", { className: K.panels }, /* @__PURE__ */ e.createElement("span", { className: K.hint }, "Adjust:"), ue.map((t) => /* @__PURE__ */ e.createElement("button", {
		key: t.id,
		type: "button",
		onClick: () => B(t),
		disabled: L(t),
		title: L(t) ? `${t.title} in a mask needs the current processing: use ${ve} on this photo first` : void 0,
		className: K.addPanel
	}, "+ ", t.title)))))));
}
function Oe({ onPick: t, onClose: n }) {
	return /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("div", {
		className: K.catcher,
		onClick: n
	}), /* @__PURE__ */ e.createElement("div", { className: K.menu }, ye.map((n) => /* @__PURE__ */ e.createElement("button", {
		key: n.type,
		type: "button",
		onClick: () => t(n.type),
		className: K.item
	}, /* @__PURE__ */ e.createElement("span", { className: K.itemIcon }, xe[n.type]), n.label)), /* @__PURE__ */ e.createElement("div", { className: K.divider }), be.map((n) => /* @__PURE__ */ e.createElement("button", {
		key: n.kind,
		type: "button",
		onClick: () => t(n.kind),
		className: K.item
	}, /* @__PURE__ */ e.createElement("span", { className: K.itemIcon }, xe[n.kind]), n.label))));
}
var Y = (e) => Math.round(e * 100);
function X({ label: t, title: n, value: r, onChange: i, onCommit: a }) {
	return /* @__PURE__ */ e.createElement("label", {
		className: K.field,
		title: n
	}, /* @__PURE__ */ e.createElement("span", { className: K.fieldLabel }, t), /* @__PURE__ */ e.createElement("input", {
		type: "number",
		value: r,
		"aria-label": n,
		onChange: (e) => {
			e.target.value !== "" && i(Number(e.target.value));
		},
		onBlur: a,
		className: K.fieldInput
	}));
}
function ke({ maskId: n, comp: r }) {
	let { Slider: i } = t.components, a = t.stores.useDevelopStore((e) => e.commitEdit), { maskColorPicking: o } = ee(), s = t.accessibility.useKeyboardCanvasEditing(), c = () => void a("Mask Geometry");
	if (r.kind === "radial" && r.radial) {
		let t = r.radial, o = (e) => F(n, r.id, { radial: {
			...t,
			...e
		} });
		return /* @__PURE__ */ e.createElement("div", { className: K.controls }, s && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("span", { className: K.caption }, "Geometry"), /* @__PURE__ */ e.createElement("div", { className: K.fields }, /* @__PURE__ */ e.createElement(X, {
			label: "X",
			title: "Centre X (%)",
			value: Y(t.cx),
			onChange: (e) => o({ cx: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "Y",
			title: "Centre Y (%)",
			value: Y(t.cy),
			onChange: (e) => o({ cy: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "W",
			title: "Radius X (%)",
			value: Y(t.rx),
			onChange: (e) => o({ rx: Math.max(0, e / 100) }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "H",
			title: "Radius Y (%)",
			value: Y(t.ry),
			onChange: (e) => o({ ry: Math.max(0, e / 100) }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "∠",
			title: "Angle (degrees)",
			value: Math.round(t.angle * 180 / Math.PI),
			onChange: (e) => o({ angle: e * Math.PI / 180 }),
			onCommit: c
		}))), /* @__PURE__ */ e.createElement(i, {
			label: "Feather",
			value: Math.round(t.feather * 100),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 50,
			onChange: (e) => o({ feather: e / 100 }),
			onCommit: () => void a("Mask Feather")
		}));
	}
	if (r.kind === "linear" && r.linear) {
		if (!s) return null;
		let t = r.linear, i = (e) => F(n, r.id, { linear: {
			...t,
			...e
		} });
		return /* @__PURE__ */ e.createElement("div", { className: K.controls }, /* @__PURE__ */ e.createElement("span", { className: K.caption }, "Geometry"), /* @__PURE__ */ e.createElement("div", { className: K.fields }, /* @__PURE__ */ e.createElement(X, {
			label: "X1",
			title: "Start X (%)",
			value: Y(t.x0),
			onChange: (e) => i({ x0: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "Y1",
			title: "Start Y (%)",
			value: Y(t.y0),
			onChange: (e) => i({ y0: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "X2",
			title: "End X (%)",
			value: Y(t.x1),
			onChange: (e) => i({ x1: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(X, {
			label: "Y2",
			title: "End Y (%)",
			value: Y(t.y1),
			onChange: (e) => i({ y1: e / 100 }),
			onCommit: c
		})));
	}
	if (r.kind === "lumRange" && r.lumRange) {
		let t = r.lumRange, o = (e) => F(n, r.id, { lumRange: {
			...t,
			...e
		} }), s = () => void a("Lum Range");
		return /* @__PURE__ */ e.createElement("div", { className: K.ranges }, /* @__PURE__ */ e.createElement("span", { className: K.caption }, "Luminance range"), /* @__PURE__ */ e.createElement(i, {
			label: "Low",
			value: Y(t.lo),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 0,
			onChange: (e) => o({ lo: Math.min(e / 100, t.hi) }),
			onCommit: s
		}), /* @__PURE__ */ e.createElement(i, {
			label: "High",
			value: Y(t.hi),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 100,
			onChange: (e) => o({ hi: Math.max(e / 100, t.lo) }),
			onCommit: s
		}), /* @__PURE__ */ e.createElement(i, {
			label: "Low Falloff",
			value: Y(t.loFeather),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 10,
			onChange: (e) => o({ loFeather: e / 100 }),
			onCommit: s
		}), /* @__PURE__ */ e.createElement(i, {
			label: "High Falloff",
			value: Y(t.hiFeather),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 10,
			onChange: (e) => o({ hiFeather: e / 100 }),
			onCommit: s
		}));
	}
	if (r.kind === "colorRange" && r.colorRange) {
		let t = r.colorRange, s = (e) => F(n, r.id, { colorRange: {
			...t,
			...e
		} }), c = () => void a("Colour Range"), l = (e) => Math.round((e <= .0031308 ? e * 12.92 : 1.055 * e ** (1 / 2.4) - .055) * 255), u = `rgb(${l(t.r)}, ${l(t.g)}, ${l(t.b)})`;
		return /* @__PURE__ */ e.createElement("div", { className: K.ranges }, /* @__PURE__ */ e.createElement("div", { className: K.head }, /* @__PURE__ */ e.createElement("span", { className: K.caption }, "Colour range"), /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: () => C({
				activeTool: "mask",
				maskColorPicking: !o
			}),
			title: "Pick a target colour from the image",
			className: K.pick + J(o)
		}, /* @__PURE__ */ e.createElement("span", {
			className: K.swatch,
			style: { backgroundColor: u }
		}), "Pick")), /* @__PURE__ */ e.createElement(i, {
			label: "Hue Range",
			value: Y(t.hueRange),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 15,
			onChange: (e) => s({ hueRange: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(i, {
			label: "Sat Range",
			value: Y(t.satRange),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 30,
			onChange: (e) => s({ satRange: e / 100 }),
			onCommit: c
		}), /* @__PURE__ */ e.createElement(i, {
			label: "Smoothness",
			value: Y(t.smoothness),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 25,
			onChange: (e) => s({ smoothness: e / 100 }),
			onCommit: c
		}));
	}
	return null;
}
//#endregion
//#region src/curve.ts
function Ae(e) {
	let t = [...e].sort((e, t) => e.x - t.x), n = t.length;
	if (n === 0) return (e) => e;
	if (n === 1) return () => Ne(t[0].y);
	let r = t.map((e) => e.x), i = t.map((e) => e.y), a = [];
	for (let e = 0; e < n - 1; e++) {
		let t = r[e + 1] - r[e];
		a.push(t === 0 ? 0 : (i[e + 1] - i[e]) / t);
	}
	let o = Array(n);
	o[0] = a[0], o[n - 1] = a[n - 2];
	for (let e = 1; e < n - 1; e++) o[e] = a[e - 1] * a[e] <= 0 ? 0 : (a[e - 1] + a[e]) / 2;
	for (let e = 0; e < n - 1; e++) {
		if (a[e] === 0) {
			o[e] = 0, o[e + 1] = 0;
			continue;
		}
		let t = o[e] / a[e], n = o[e + 1] / a[e], r = t * t + n * n;
		if (r > 9) {
			let i = 3 / Math.sqrt(r);
			o[e] = i * t * a[e], o[e + 1] = i * n * a[e];
		}
	}
	return (e) => {
		if (e <= r[0]) return Ne(i[0]);
		if (e >= r[n - 1]) return Ne(i[n - 1]);
		let t = 0;
		for (; t < n - 1 && e > r[t + 1];) t++;
		let a = r[t + 1] - r[t], s = (e - r[t]) / a, c = s * s, l = c * s, u = 2 * l - 3 * c + 1, d = l - 2 * c + s, f = -2 * l + 3 * c, p = l - c;
		return Ne(u * i[t] + d * a * o[t] + f * i[t + 1] + p * a * o[t + 1]);
	};
}
function je(e, t, n = 0) {
	let r = Ae(e.rgb), i = Ae(e.red), a = Ae(e.green), o = Ae(e.blue);
	for (let e = 0; e < 256; e++) {
		let s = r(e / 255), c = n + e * 4;
		t[c] = Math.round(i(s) * 255), t[c + 1] = Math.round(a(s) * 255), t[c + 2] = Math.round(o(s) * 255), t[c + 3] = 255;
	}
	return t;
}
function Me(e) {
	return [
		"rgb",
		"red",
		"green",
		"blue"
	].every((t) => {
		let n = e[t];
		return n.length === 2 && n[0].x === 0 && n[0].y === 0 && n[1].x === 1 && n[1].y === 1;
	});
}
function Ne(e) {
	return e < 0 ? 0 : e > 1 ? 1 : e;
}
//#endregion
//#region src/stages.ts
var Pe = "safelight.masks.coverage", Fe = "// Coverage of one component (0..1), before add/subtract combine. px is the\n// current pixel's working (scene-linear) colour and pxL its luma — used by the\n// parametric range masks (luminance / colour).\nfloat compCoverage(int i, vec2 uv, vec3 px, float pxL) {\n  int type = uCompType[i];\n  vec4 gA = uCompGeoA[i];\n  vec4 gB = uCompGeoB[i];\n  float m = 0.0;\n  if (type == 0) {\n    // Linear gradient: ramp 0->1 projected onto the drag direction.\n    vec2 p0 = gA.xy;\n    vec2 p1 = gA.zw;\n    vec2 dir = p1 - p0;\n    float len2 = max(dot(dir, dir), 1e-6);\n    m = clamp(dot(uv - p0, dir) / len2, 0.0, 1.0);\n  } else if (type == 1) {\n    // Radial: 1 inside, feathered to 0 at the edge, in screen-proportional space.\n    vec2 ctr = gA.xy;\n    vec2 rad = max(gA.zw, vec2(1e-4));\n    float feather = gB.x;\n    float ang = gB.y;\n    vec2 q = vec2((uv.x - ctr.x) * uImageAspect, uv.y - ctr.y);\n    float ca = cos(ang);\n    float sa = sin(ang);\n    vec2 qr = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);\n    vec2 radS = vec2(rad.x * uImageAspect, rad.y);\n    float d = length(qr / radS);\n    m = 1.0 - smoothstep(1.0 - feather, 1.0, d);\n  } else if (type == 3) {\n    // Luminance range: 1 inside [lo,hi], soft ramps of width loF/hiF at the ends.\n    float lo = gA.x;\n    float hi = gA.y;\n    float loF = max(gA.z, 1e-4);\n    float hiF = max(gA.w, 1e-4);\n    float lower = smoothstep(lo - loF, lo, pxL);\n    float upper = 1.0 - smoothstep(hi, hi + hiF, pxL);\n    m = lower * upper;\n  } else if (type == 4) {\n    // Colour range: closeness to a target colour, measured in hue + chroma.\n    vec3 tgt = gA.xyz;\n    float hueRange = max(gA.w, 1e-3);\n    float satRange = max(gB.x, 1e-3);\n    float smth = gB.y;\n    // Compare in a tone-normalized chroma space so exposure differences along\n    // the same hue don't break the match. Direction of the colour vector ~ hue,\n    // its length relative to luma ~ saturation.\n    float tL = max(luma(tgt), 1e-4);\n    vec3 pd = px - vec3(pxL);\n    vec3 td = tgt - vec3(tL);\n    float pLen = length(pd);\n    float tLen = length(td);\n    float hueDist = 1.0 - (dot(pd, td) / max(pLen * tLen, 1e-4)); // 0 = same hue\n    float satDist = abs(pLen / max(pxL, 1e-3) - tLen / tL);       // chroma mismatch\n    float hueM = 1.0 - smoothstep(hueRange, hueRange + smth + 1e-3, hueDist);\n    float satM = 1.0 - smoothstep(satRange, satRange + smth + 1e-3, satDist);\n    // Near-neutral target/pixel have no meaningful hue — fall back to chroma only.\n    float chromaW = smoothstep(0.01, 0.05, tLen);\n    m = mix(satM, hueM * satM, chromaW);\n  } else {\n    // Brush: prebaked coverage from the atlas channel. ch < 0 marks a brush with\n    // no atlas slot (beyond the 4 the RGBA atlas holds) — it contributes nothing\n    // rather than borrowing channel 0's coverage.\n    vec4 cov = texture(uMaskTex, uv);\n    int ch = uCompBrushCh[i];\n    m = ch < 0 ? 0.0 : (ch == 0 ? cov.r : (ch == 1 ? cov.g : (ch == 2 ? cov.b : cov.a)));\n  }\n  if (uCompInvert[i] == 1) m = 1.0 - m;\n  return clamp(m, 0.0, 1.0);\n}", Z = (e, t, n) => ({
	key: e,
	glslType: "int",
	length: n,
	size: t,
	default: Array(n).fill(0)
}), Q = (e, t, n) => ({
	key: e,
	glslType: "vec4",
	length: n,
	size: t,
	default: Array(n * 4).fill(0)
}), $ = (e, t) => [...e, ...Array(t - e.length).fill(0)];
function Ie(e) {
	if (e.kind === "linear" && e.linear) return {
		type: 0,
		a: [
			e.linear.x0,
			e.linear.y0,
			e.linear.x1,
			e.linear.y1
		],
		b: [
			0,
			0,
			0,
			0
		]
	};
	if (e.kind === "radial" && e.radial) return {
		type: 1,
		a: [
			e.radial.cx,
			e.radial.cy,
			e.radial.rx,
			e.radial.ry
		],
		b: [
			e.radial.feather,
			e.radial.angle,
			0,
			0
		]
	};
	if (e.kind === "lumRange" && e.lumRange) {
		let t = e.lumRange;
		return {
			type: 3,
			a: [
				t.lo,
				t.hi,
				t.loFeather,
				t.hiFeather
			],
			b: [
				0,
				0,
				0,
				0
			]
		};
	}
	if (e.kind === "colorRange" && e.colorRange) {
		let t = e.colorRange;
		return {
			type: 4,
			a: [
				t.r,
				t.g,
				t.b,
				t.hueRange
			],
			b: [
				t.satRange,
				t.smoothness,
				0,
				0
			]
		};
	}
	return {
		type: e.kind === "linear" ? 0 : e.kind === "radial" ? 1 : e.kind === "lumRange" ? 3 : e.kind === "colorRange" ? 4 : 2,
		a: [
			0,
			0,
			0,
			0
		],
		b: [
			0,
			0,
			0,
			0
		]
	};
}
var Le = 0, Re = (e) => ({
	id: Pe,
	name: "Masking",
	phase: "scene-linear",
	anchor: "masks",
	glsl: "",
	helpers: Fe,
	uniforms: [
		{
			key: "uMaskCount",
			glslType: "int",
			default: 0
		},
		Z("uMaskInvert", "MAX_MASKS", 16),
		{
			key: "uMaskOpacity",
			glslType: "float",
			length: 16,
			size: "MAX_MASKS",
			default: Array(16).fill(0)
		},
		{
			key: "uCompCount",
			glslType: "int",
			default: 0
		},
		Z("uCompMaskIdx", "MAX_COMPONENTS", 24),
		Z("uCompMode", "MAX_COMPONENTS", 24),
		Z("uCompType", "MAX_COMPONENTS", 24),
		Z("uCompInvert", "MAX_COMPONENTS", 24),
		Z("uCompBrushCh", "MAX_COMPONENTS", 24),
		Q("uCompGeoA", "MAX_COMPONENTS", 24),
		Q("uCompGeoB", "MAX_COMPONENTS", 24),
		Q("uMaskAdj0", "MAX_MASKS", 16),
		Q("uMaskAdj1", "MAX_MASKS", 16),
		Q("uMaskAdj2", "MAX_MASKS", 16),
		Q("uMaskAdj3", "MAX_MASKS", 16),
		Z("uMaskHasHsl", "MAX_MASKS", 16),
		Q("uMaskHsl", "MAX_MASKS * 6", 96),
		Z("uMaskHasCurve", "MAX_MASKS", 16),
		...e === 1 ? [] : [Z("uMaskHasDisplay", "MAX_MASKS", 16)]
	],
	textures: [{
		key: "uMaskCurves",
		kind: "photo"
	}],
	derive: ({ masks: t }) => {
		let n = t.slice(0, 16), i = /* @__PURE__ */ new Map();
		for (let e of t) for (let t of e.components) t.kind === "brush" && t.brush && i.size < 4 && i.set(t.id, i.size);
		let a = [];
		n.forEach((e, t) => {
			for (let n of e.components) a.length < 24 && a.push({
				mi: t,
				c: n
			});
		});
		let o = a.map(({ c: e }) => Ie(e)), s = Array(384).fill(0);
		n.forEach((e, t) => {
			e.hsl && !c(e.hsl) && r.forEach((n, r) => {
				s[t * 24 + r] = e.hsl.hue[n] / 100, s[t * 24 + 8 + r] = e.hsl.saturation[n] / 100, s[t * 24 + 16 + r] = e.hsl.luminance[n] / 100;
			});
		});
		let u = /* @__PURE__ */ new Uint8Array(16384);
		for (let e = 0; e < 16; e++) for (let t = 0; t < 256; t++) u.set([
			t,
			t,
			t,
			255
		], (e * 256 + t) * 4);
		let d = n.map((e, t) => !e.toneCurve || Me(e.toneCurve) ? 0 : (je(e.toneCurve, u, t * 256 * 4), 1)), f = (e) => $(n.flatMap((t) => e(t.adj)), 64);
		return {
			uMaskCount: n.length,
			uMaskInvert: $(n.map((e) => +!!e.invert), 16),
			uMaskOpacity: $(n.map((e) => e.visible === !1 ? 0 : e.opacity / 100), 16),
			uCompCount: a.length,
			uCompMaskIdx: $(a.map(({ mi: e }) => e), 24),
			uCompMode: $(a.map(({ c: e }) => e.mode === "subtract" ? 1 : e.mode === "intersect" ? 2 : 0), 24),
			uCompType: $(o.map((e) => e.type), 24),
			uCompInvert: $(a.map(({ c: e }) => +!!e.invert), 24),
			uCompBrushCh: $(a.map(({ c: e }) => i.get(e.id) ?? -1), 24),
			uCompGeoA: $(o.flatMap((e) => e.a), 96),
			uCompGeoB: $(o.flatMap((e) => e.b), 96),
			uMaskAdj0: f((e) => [
				e.exposure,
				e.contrast,
				e.highlights,
				e.shadows
			]),
			uMaskAdj1: f((e) => [
				e.saturation,
				e.temperature,
				e.tint,
				e.clarity
			]),
			uMaskAdj2: f((e) => [
				e.sharpness,
				e.whites,
				e.blacks,
				e.vibrance
			]),
			uMaskAdj3: f((e) => [
				e.texture,
				e.dehaze,
				0,
				0
			]),
			uMaskHasHsl: $(n.map((e) => e.hsl && !c(e.hsl) ? 1 : 0), 16),
			uMaskHsl: s,
			uMaskHasCurve: $(d, 16),
			uMaskCurves: {
				data: u,
				width: 256,
				height: 16,
				format: "rgba8",
				version: ++Le
			},
			...e === 1 ? {} : { uMaskHasDisplay: $(n.map((e) => +!!l(e.adj)), 16) }
		};
	}
});
//#endregion
//#region src/viz.ts
function ze(e, t, n, r) {
	return t && e.some((e) => e.id === t) ? t : n && r === "coverage" && e.some((e) => e.id === n) ? n : null;
}
//#endregion
//#region src/index.tsx
var Be = "core.masks", Ve = "safelight.masks.styles", He = 3, Ue = [];
function We(e) {
	n(e), w(), e.registerStylesheet({
		id: Ve,
		css: _e(e.ui.tokens)
	}), e.registerProcessingStage(Re(3)), e.registerPanel({
		id: Be,
		title: "Masking",
		component: De,
		defaultDock: {
			module: "develop",
			direction: "left",
			order: 0,
			width: 240,
			height: 240
		},
		onReset: () => {
			C({
				selectedMaskId: null,
				selectedComponentId: null,
				hoveredMaskId: null
			}), e.stores.useDevelopStore.getState().resetParams(["masks"], "Reset Masking");
		}
	});
	for (let e of Ue) e();
	let t = e.stores.useDevelopStore, r = !1, i = () => {
		let t = S().activeTool === "mask";
		t !== r && (r = t, e.develop.setCanvasTool(t ? ge : null));
	}, a = null, o = () => {
		let n = S(), r = ze(t.getState().params.masks, n.hoveredMaskId, n.selectedMaskId, n.maskTab);
		r !== a && (a = r, e.develop.showMaskCoverage(r));
	};
	Ue = [
		T(i),
		T(o),
		t.subscribe(o),
		t.subscribe((e, t) => {
			e.photoId !== t.photoId && C({
				activeTool: "none",
				selectedMaskId: null,
				selectedComponentId: null,
				hoveredMaskId: null,
				maskColorPicking: !1
			});
		})
	];
}
function Ge() {
	for (let e of Ue) e();
	Ue = [], w(), t.develop.setCanvasTool(null), t.develop.showMaskCoverage(null);
}
//#endregion
export { He as LINE, Be as PANEL_ID, Ve as STYLESHEET_ID, We as activate, Ge as deactivate };

//# sourceMappingURL=index.js.map