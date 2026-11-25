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
function ee(e, t, n) {
	let { theta: r, gh: i, gv: a, as: o, s, tx: c, ty: l, fh: d, fv: ee } = g(e, t, n), [_, v] = h(n), y = p(d, ee), b = [
		1,
		0,
		0,
		0,
		1,
		0,
		-i,
		-a,
		1
	], x = p(1 / o, o), S = p(1 / s, 1 / s), C = m(-c, -l), w = u(f(r), y);
	return w = u(w, b), w = u(w, x), w = u(w, S), w = u(w, C), u(v, u(w, _));
}
function _(e, t, n) {
	let { theta: r, gh: i, gv: a, as: o, s, tx: c, ty: l, fh: d, fv: ee } = g(e, t, n), [_, v] = h(n), y = [
		1,
		0,
		0,
		0,
		1,
		0,
		i,
		a,
		1
	], b = p(d, ee), x = u(m(c, l), p(s, s));
	return x = u(x, p(o, 1 / o)), x = u(x, y), x = u(x, b), x = u(x, f(-r)), u(v, u(x, _));
}
//#endregion
//#region src/state.ts
var v = {
	size: "brushSize",
	feather: "brushFeather",
	opacity: "brushOpacity",
	flow: "brushFlow"
}, y = {
	activeTool: "none",
	maskToolType: "radial",
	maskCompMode: "add",
	maskAddTarget: "new",
	selectedMaskId: null,
	selectedComponentId: null,
	hoveredMaskId: null,
	maskTab: "coverage",
	brushPreview: !1,
	brushErase: !1,
	maskColorPicking: !1
};
function b() {
	let e = t.develop.brush.defaults;
	return {
		...y,
		brushSize: e.size,
		brushFeather: e.feather,
		brushOpacity: e.opacity,
		brushFlow: e.flow
	};
}
var x, S = /* @__PURE__ */ new Set(), C = () => x;
function w(e) {
	x = {
		...x,
		...e
	};
	for (let e of S) e();
}
var T = () => w(b()), E = (e) => (S.add(e), () => void S.delete(e)), te = () => e.useSyncExternalStore(E, C), D = () => w({
	activeTool: "none",
	selectedMaskId: null,
	selectedComponentId: null,
	hoveredMaskId: null
}), O = 0, k = (e) => `${e}-${Date.now().toString(36)}-${O++}`, A = () => t.stores.useDevelopStore.getState().params.masks, j = (e) => t.stores.useDevelopStore.getState().setParam("masks", e), M = (e, t) => j(A().map((n) => n.id === e ? {
	...n,
	components: t(n.components)
} : n));
function N(e, t) {
	return A().find((t) => t.id === e)?.components.find((e) => e.id === t);
}
function P(e) {
	A().length >= 16 || (j([...A(), e]), w({
		selectedMaskId: e.id,
		selectedComponentId: e.components[e.components.length - 1]?.id ?? null,
		maskTab: "coverage"
	}));
}
function F(e, t) {
	M(e, (e) => [...e, t]), w({
		selectedMaskId: e,
		selectedComponentId: t.id
	});
}
function I(e, t, n) {
	M(e, (e) => e.map((e) => e.id === t ? {
		...e,
		...n
	} : e));
}
function ne(e, t) {
	let n = [];
	for (let r of A()) {
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
	j(n);
	let r = !n.some((t) => t.id === e);
	w({
		selectedMaskId: r ? null : x.selectedMaskId,
		selectedComponentId: x.selectedComponentId === t ? null : x.selectedComponentId,
		hoveredMaskId: r && x.hoveredMaskId === e ? null : x.hoveredMaskId
	});
}
function re(e, t) {
	M(e, (e) => e.map((e) => {
		if (e.id !== t) return e;
		let n = e.mode === "add" ? "subtract" : e.mode === "subtract" ? "intersect" : "add";
		return {
			...e,
			mode: n
		};
	}));
}
function ie(e) {
	let t = e === "lumRange" ? { lumRange: o() } : { colorRange: s() }, n = A().find((e) => e.id === x.selectedMaskId) ?? null;
	if (n) {
		let r = n.components.length > 0 ? "intersect" : "add";
		F(n.id, {
			id: k("comp"),
			kind: e,
			mode: r,
			invert: !1,
			...t
		});
	} else P({
		id: k("mask"),
		name: e === "lumRange" ? "Luminance" : "Colour",
		visible: !0,
		invert: !1,
		opacity: 100,
		adj: a(),
		panels: [...i],
		components: [{
			id: k("comp"),
			kind: e,
			mode: "add",
			invert: !1,
			...t
		}]
	});
}
function ae(e, t, n) {
	M(e, (e) => e.map((e) => e.id === t && e.brush ? {
		...e,
		brush: {
			...e.brush,
			dabs: [...e.brush.dabs, n]
		}
	} : e));
}
var L = [], oe = () => t.develop.useMaskComponentKinds?.() ?? L, se = () => t.extensions?.useSettled() ?? !0, ce = (e) => e.reduce((e, t) => e + t.components.filter((e) => e.kind === "extension").length, 0);
function le(e, t, n, r) {
	if (ce(A()) >= 4) return null;
	let o = {
		id: k("comp"),
		kind: "extension",
		mode: r,
		invert: !1,
		extension: t
	};
	if (e !== "new") return F(e, o), {
		maskId: e,
		compId: o.id
	};
	if (A().length >= 16) return null;
	let s = {
		id: k("mask"),
		name: n,
		visible: !0,
		invert: !1,
		opacity: 100,
		adj: a(),
		panels: [...i],
		components: [o]
	};
	return P(s), {
		maskId: s.id,
		compId: o.id
	};
}
function R(e, t, n) {
	M(e, (e) => e.map((e) => e.id === t && e.extension ? {
		...e,
		extension: {
			...e.extension,
			values: {
				...e.extension.values,
				...n
			}
		}
	} : e));
}
var z = (e, n) => t.stores.useDevelopStore.getState().updateMask(e, { name: n });
function B(e) {
	j(A().filter((t) => t.id !== e)), w({
		selectedMaskId: x.selectedMaskId === e ? null : x.selectedMaskId,
		selectedComponentId: x.selectedMaskId === e ? null : x.selectedComponentId,
		hoveredMaskId: x.hoveredMaskId === e ? null : x.hoveredMaskId
	});
}
//#endregion
//#region src/MaskCanvas.tsx
function ue(e, t, n, r, i) {
	let a = d(n, r, i), o = (a.x - t.x) / t.width, s = (a.y - t.y) / t.height;
	return {
		x: e.x + o * e.w,
		y: e.y + s * e.h
	};
}
var V = 13, de = .06, fe = Math.PI / 12, H = {
	add: "#4aa3ff",
	addDim: "rgba(255,255,255,0.5)",
	sub: "#ff7a4a",
	subDim: "rgba(255,150,90,0.5)"
};
function pe(e, t, n, r) {
	let i = (r, i) => ue(e, t, n, r, i), a = (e, t, n, i) => ({
		x: n + e / r,
		y: i + t
	});
	return {
		toScreen: i,
		radialHandle: (e, t) => {
			if (t === "center") return i(e.cx, e.cy);
			let n = Math.cos(e.angle), o = Math.sin(e.angle), s = 0, c = 0;
			t === "e" ? s = e.rx * r : t === "w" ? s = -e.rx * r : c = t === "n" ? -e.ry : t === "s" ? e.ry : -(e.ry + de);
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
function me() {
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
function U(e, t, n) {
	let r = (t.x - e.x) * n, i = t.y - e.y, a = Math.hypot(r, i);
	if (a < 1e-6) return t;
	let o = Math.round(Math.atan2(i, r) / (Math.PI / 4)) * (Math.PI / 4);
	return {
		x: e.x + Math.cos(o) * a / n,
		y: e.y + Math.sin(o) * a
	};
}
function he({ rect: n }) {
	let r = t.stores.useDevelopStore, o = r((e) => e.params.masks), c = r((e) => e.params.straighten), l = r((e) => e.params.transform), u = r((e) => e.params.crop), { region: f, imageAspect: p, rect: m } = t.develop.useDevelopOverlay(), h = te(), g = oe(), { activeTool: v, maskToolType: y, selectedMaskId: b, selectedComponentId: x } = h, [S] = e.useState(me), [T, E] = e.useState(null), D = e.useRef(null), O = e.useRef(null), A = e.useMemo(() => n, [
		n.x,
		n.y,
		n.w,
		n.h
	]), j = f ?? u, M = e.useMemo(() => _(c, l, p), [
		c,
		l,
		p
	]), re = e.useMemo(() => ee(c, l, p), [
		c,
		l,
		p
	]), { toScreen: ie, radialHandle: L } = pe(A, j, M, p), se = (e, t) => {
		let n = (e - A.x) / A.w, r = (t - A.y) / A.h;
		return d(re, j.x + n * j.width, j.y + r * j.height);
	}, ce = (e) => t.develop.framePoint(e.currentTarget, e.clientX, e.clientY), R = r.getState, z = o.find((e) => e.id === b) ?? null, B = z?.components.find((e) => e.id === x) ?? null;
	function ue(e, t) {
		let n = B;
		if (!n) return null;
		if (n.kind === "radial" && n.radial) {
			let r = L(n.radial, "rotate");
			if (Math.hypot(e - r.x, t - r.y) <= V) return "radial-rotate";
			for (let [r, i] of [
				["e", "radial-e"],
				["w", "radial-w"],
				["n", "radial-n"],
				["s", "radial-s"]
			]) {
				let a = L(n.radial, r);
				if (Math.hypot(e - a.x, t - a.y) <= V) return i;
			}
			let i = L(n.radial, "center");
			if (Math.hypot(e - i.x, t - i.y) <= V) return "radial-move";
		} else if (n.kind === "linear" && n.linear) {
			let r = ie(n.linear.x0, n.linear.y0), i = ie(n.linear.x1, n.linear.y1);
			if (Math.hypot(e - r.x, t - r.y) <= V) return "linear-p0";
			if (Math.hypot(e - i.x, t - i.y) <= V) return "linear-p1";
		}
		return null;
	}
	function de(e) {
		let t = k("mask");
		return P({
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
	function H(e) {
		return e.maskAddTarget === "new" ? "new" : e.selectedMaskId && o.some((t) => t.id === e.selectedMaskId) ? e.selectedMaskId : "new";
	}
	async function he(e, n, r, i) {
		if (!m) return;
		let a = (r - m.x) / m.w, o = (i - m.y) / m.h;
		if (a < 0 || a > 1 || o < 0 || o > 1) return;
		let c = R().photoId, l = await t.develop.probeMaskColour(a, o), u = R().photoId === c ? N(e, n) : void 0;
		l && u && (I(e, n, { colorRange: {
			...u.colorRange ?? s(),
			r: l[0],
			g: l[1],
			b: l[2]
		} }), R().commitEdit("Colour Range Pick"));
	}
	function ge(e, t, n, r) {
		if (t.x < 0 || t.x > 1 || t.y < 0 || t.y > 1) return;
		let i = {
			u: t.x,
			v: t.y,
			alt: n.altKey,
			shift: n.shiftKey
		}, a = e.commitLabel ?? e.label, o = H(r);
		if (o !== "new" && z?.id === o && B?.extension?.type === e.type && z && B?.extension) {
			let n = e.onPoint?.(B.extension.values, i);
			if (!n) return;
			I(z.id, B.id, { extension: {
				type: e.type,
				values: n
			} }), D.current = {
				kind: "extension",
				maskId: z.id,
				compId: B.id,
				downSrc: t,
				commitLabel: a
			};
			return;
		}
		let s = e.onPoint?.(e.create(), i) ?? e.create(), c = le(o, {
			type: e.type,
			values: s
		}, e.label, o === "new" ? "add" : r.maskCompMode);
		c && (w({ maskAddTarget: "current" }), D.current = {
			kind: "extension",
			maskId: c.maskId,
			compId: c.compId,
			downSrc: t,
			commitLabel: a
		});
	}
	let _e = (e) => {
		if (e.button !== 0) return;
		let { x: t, y: n } = ce(e);
		e.currentTarget.setPointerCapture(e.pointerId);
		let r = se(t, n), i = C();
		if (i.maskColorPicking && z && B?.kind === "colorRange") {
			w({ maskColorPicking: !1 }), he(z.id, B.id, t, n);
			return;
		}
		if (v !== "mask") return;
		let a = ue(t, n);
		if (a && z && B) {
			D.current = {
				kind: a,
				maskId: z.id,
				compId: B.id,
				downSrc: r
			};
			return;
		}
		if (y !== "brush" && y !== "radial" && y !== "linear") {
			let t = g.find((e) => e.type === y);
			t && ge(t, r, e, i);
			return;
		}
		let s = i.maskCompMode;
		if (y === "brush") {
			let t = H(i), n, a, c = t === "new" ? null : o.find((e) => e.id === t), l = c?.components.find((e) => e.id === i.selectedComponentId) ?? null, u = l && l.kind === "brush" && l.mode === s ? l : null;
			if (u && c) n = c.id, a = u.id, w({
				selectedMaskId: n,
				selectedComponentId: a
			});
			else {
				a = k("comp");
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
				t === "new" ? n = de(e) : (n = t, F(n, e)), w({ maskAddTarget: "current" });
			}
			let d = {
				radius: i.brushSize,
				erase: e.altKey || i.brushErase,
				feather: i.brushFeather,
				opacity: i.brushOpacity,
				flow: i.brushFlow
			};
			if (e.shiftKey && O.current) {
				let e = O.current, t = Math.hypot((r.x - e.x) * p, r.y - e.y), o = Math.max(1, Math.ceil(t / (i.brushSize * .25)));
				for (let t = 1; t <= o; t++) {
					let i = t / o;
					ae(n, a, {
						x: e.x + (r.x - e.x) * i,
						y: e.y + (r.y - e.y) * i,
						...d,
						strokeStart: t === 1 || void 0
					});
				}
			} else ae(n, a, {
				x: r.x,
				y: r.y,
				...d,
				strokeStart: !0
			});
			O.current = r, D.current = {
				kind: "brush",
				maskId: n,
				compId: a,
				downSrc: r,
				lastDab: r
			};
			return;
		}
		let c = H(i), l = k("comp"), u = y === "radial" ? {
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
		c === "new" ? d = de(u) : (d = c, F(d, u)), w({ maskAddTarget: "current" }), D.current = {
			kind: y === "radial" ? "create-radial" : "create-linear",
			maskId: d,
			compId: l,
			downSrc: r,
			fromCenter: e.altKey
		};
	}, be = (e) => {
		let { x: t, y: n } = ce(e);
		S.set({ at: {
			x: t,
			y: n,
			alt: e.altKey
		} });
		let r = D.current;
		if (!r) {
			v === "mask" && E(ue(t, n));
			return;
		}
		let i = se(t, n), a = e.shiftKey, o = N(r.maskId, r.compId);
		switch (r.kind) {
			case "create-radial": {
				let e, t, n, o;
				if (r.fromCenter ? (e = r.downSrc.x, t = r.downSrc.y, n = Math.max(.001, Math.abs(i.x - r.downSrc.x)), o = Math.max(.001, Math.abs(i.y - r.downSrc.y))) : (e = (r.downSrc.x + i.x) / 2, t = (r.downSrc.y + i.y) / 2, n = Math.max(.001, Math.abs(i.x - r.downSrc.x) / 2), o = Math.max(.001, Math.abs(i.y - r.downSrc.y) / 2)), a) {
					let e = Math.max(n * p, o);
					n = e / p, o = e;
				}
				I(r.maskId, r.compId, { radial: {
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
				let e = a ? U(r.downSrc, i, p) : i;
				I(r.maskId, r.compId, { linear: {
					x0: r.downSrc.x,
					y0: r.downSrc.y,
					x1: e.x,
					y1: e.y
				} });
				break;
			}
			case "radial-move":
				o?.radial && I(r.maskId, r.compId, { radial: {
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
				let t = o.radial, n = (i.x - t.cx) * p, s = i.y - t.cy, c = Math.cos(-t.angle), l = Math.sin(-t.angle), u = c * n - l * s, d = l * n + c * s, f = t.angle, m = r.kind === "radial-e" || r.kind === "radial-w", h = m ? u : d, g = m ? t.rx * p : t.ry, ee = r.kind === "radial-e" || r.kind === "radial-s" ? 1 : -1, _, v = t.cx, y = t.cy;
				if (e.altKey) _ = Math.abs(h);
				else {
					let e = -ee * g;
					_ = Math.abs(h - e) / 2;
					let n = (h + e) / 2, r = m ? Math.cos(f) * n : -Math.sin(f) * n, i = m ? Math.sin(f) * n : Math.cos(f) * n;
					v = t.cx + r / p, y = t.cy + i;
				}
				let b = t.rx, x = t.ry;
				m ? b = Math.max(.002, _ / p) : x = Math.max(.002, _), a && (m && t.rx > 1e-4 ? x = Math.max(.002, t.ry * (b / t.rx)) : !m && t.ry > 1e-4 && (b = Math.max(.002, t.rx * (x / t.ry)))), I(r.maskId, r.compId, { radial: {
					...t,
					rx: b,
					ry: x,
					cx: v,
					cy: y
				} });
				break;
			}
			case "radial-rotate": {
				if (!o?.radial) break;
				let e = (i.x - o.radial.cx) * p, t = i.y - o.radial.cy, n = Math.atan2(t, e) + Math.PI / 2;
				a && (n = Math.round(n / fe) * fe), I(r.maskId, r.compId, { radial: {
					...o.radial,
					angle: n
				} });
				break;
			}
			case "linear-p0": {
				if (!o?.linear) break;
				let e = a ? U({
					x: o.linear.x1,
					y: o.linear.y1
				}, i, p) : i;
				I(r.maskId, r.compId, { linear: {
					...o.linear,
					x0: e.x,
					y0: e.y
				} });
				break;
			}
			case "linear-p1": {
				if (!o?.linear) break;
				let e = a ? U({
					x: o.linear.x0,
					y: o.linear.y0
				}, i, p) : i;
				I(r.maskId, r.compId, { linear: {
					...o.linear,
					x1: e.x,
					y1: e.y
				} });
				break;
			}
			case "brush": {
				let t = C(), n = r.lastDab ?? r.downSrc;
				Math.hypot((i.x - n.x) * p, i.y - n.y) >= t.brushSize * .25 && (ae(r.maskId, r.compId, {
					x: i.x,
					y: i.y,
					radius: t.brushSize,
					erase: e.altKey || t.brushErase,
					feather: t.brushFeather,
					opacity: t.brushOpacity,
					flow: t.brushFlow
				}), r.lastDab = i, O.current = i);
				break;
			}
		}
	}, xe = () => {
		let e = D.current;
		if (D.current = null, !e) return;
		let t = N(e.maskId, e.compId);
		e.kind === "create-radial" && t?.radial && (t.radial.rx < .01 || t.radial.ry < .01) || e.kind === "create-linear" && t?.linear && Math.hypot(t.linear.x1 - t.linear.x0, t.linear.y1 - t.linear.y0) < .01 ? (ne(e.maskId, e.compId), w({
			selectedMaskId: null,
			selectedComponentId: null
		})) : R().commitEdit(e.commitLabel ?? "Mask");
	}, W = ve();
	return /* @__PURE__ */ e.createElement("div", {
		"data-mask-canvas": "",
		style: {
			position: "absolute",
			inset: 0,
			cursor: t.cursors.resolve("crosshair"),
			touchAction: "none"
		},
		onPointerDown: _e,
		onPointerMove: be,
		onPointerUp: xe,
		onPointerLeave: () => S.set({ at: null })
	}, /* @__PURE__ */ e.createElement("svg", { style: {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		pointerEvents: "none"
	} }, v === "mask" && /* @__PURE__ */ e.createElement(W, {
		masks: o,
		selectedMaskId: b,
		selectedComponentId: x,
		hovered: T,
		rect: A,
		crop: j,
		forward: M,
		imageAspect: p,
		kinds: g
	})), /* @__PURE__ */ e.createElement(ye, { pointer: S }));
}
function ge({ masks: t, selectedMaskId: n, selectedComponentId: r, hovered: i, rect: a, crop: o, forward: s, imageAspect: c, kinds: l }) {
	let { toScreen: u, radialHandle: d, rotatedEllipsePath: f } = pe(a, o, s, c);
	return /* @__PURE__ */ e.createElement(e.Fragment, null, t.flatMap((t) => t.components.map((a) => {
		let o = a.id === r && t.id === n, s = a.mode === "subtract", c = o ? s ? H.sub : H.add : s ? H.subDim : H.addDim, p = s ? H.sub : H.add, m = t.id + ":" + a.id;
		if (a.kind === "radial" && a.radial) {
			let t = a.radial, n = d(t, "center"), r = d(t, "rotate"), l = (e) => i === e && o ? 6 : 5;
			return /* @__PURE__ */ e.createElement("g", { key: m }, /* @__PURE__ */ e.createElement("path", {
				d: f(t),
				fill: "none",
				stroke: c,
				strokeWidth: o ? 1.8 : 1.4,
				strokeDasharray: s ? "5 4" : void 0
			}), o && /* @__PURE__ */ e.createElement("line", {
				x1: n.x,
				y1: n.y,
				x2: r.x,
				y2: r.y,
				stroke: p,
				strokeWidth: 1,
				opacity: .6
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: n.x,
				cy: n.y,
				r: l("radial-move"),
				fill: p
			}), o && [
				["radial-e", "e"],
				["radial-w", "w"],
				["radial-n", "n"],
				["radial-s", "s"]
			].map(([n, r]) => {
				let i = d(t, r);
				return /* @__PURE__ */ e.createElement("circle", {
					key: n,
					cx: i.x,
					cy: i.y,
					r: l(n),
					fill: "#fff",
					stroke: p,
					strokeWidth: 1.5
				});
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: r.x,
				cy: r.y,
				r: l("radial-rotate") + 1,
				fill: p,
				stroke: "#fff",
				strokeWidth: 1.5
			}));
		}
		if (a.kind === "linear" && a.linear) {
			let t = u(a.linear.x0, a.linear.y0), n = u(a.linear.x1, a.linear.y1), r = n.x - t.x, s = n.y - t.y, l = Math.hypot(r, s) || 1, d = -s / l * 400, f = r / l * 400;
			return /* @__PURE__ */ e.createElement("g", { key: m }, /* @__PURE__ */ e.createElement("line", {
				x1: t.x,
				y1: t.y,
				x2: n.x,
				y2: n.y,
				stroke: c,
				strokeWidth: 1.2
			}), /* @__PURE__ */ e.createElement("line", {
				x1: t.x - d,
				y1: t.y - f,
				x2: t.x + d,
				y2: t.y + f,
				stroke: c,
				strokeWidth: 1.2,
				strokeDasharray: "4 4"
			}), /* @__PURE__ */ e.createElement("line", {
				x1: n.x - d,
				y1: n.y - f,
				x2: n.x + d,
				y2: n.y + f,
				stroke: c,
				strokeWidth: 1.2
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: t.x,
				cy: t.y,
				r: i === "linear-p0" ? 6 : 5,
				fill: "#fff",
				stroke: p,
				strokeWidth: 1.5
			}), o && /* @__PURE__ */ e.createElement("circle", {
				cx: n.x,
				cy: n.y,
				r: i === "linear-p1" ? 6 : 5,
				fill: p,
				stroke: "#fff",
				strokeWidth: 1.5
			}));
		}
		if (a.kind === "extension" && a.extension && o) {
			let { type: t, values: n } = a.extension, r = l.find((e) => e.type === t)?.markers?.(n) ?? [];
			return /* @__PURE__ */ e.createElement("g", { key: m }, r.map((t, n) => {
				let r = u(t.u, t.v);
				return /* @__PURE__ */ e.createElement("circle", {
					key: n,
					"data-marker": "",
					cx: Number(r.x.toFixed(1)),
					cy: Number(r.y.toFixed(1)),
					r: 5,
					fill: "rgba(0,0,0,0.25)",
					stroke: t.subtract ? H.sub : H.add,
					strokeWidth: 1.8
				});
			}));
		}
		return null;
	})));
}
var _e = null, ve = () => _e ??= e.memo(ge);
function ye({ pointer: n }) {
	let { at: r } = e.useSyncExternalStore(n.subscribe, n.get), { activeTool: i, maskToolType: a, brushErase: o, maskCompMode: s, brushSize: c, brushFeather: l, brushPreview: u } = te();
	if (i !== "mask" || a !== "brush") return null;
	let { BrushCursor: d } = t.develop;
	return /* @__PURE__ */ e.createElement(e.Fragment, null, r && /* @__PURE__ */ e.createElement(d, {
		at: {
			x: r.x,
			y: r.y
		},
		size: c,
		feather: l,
		erase: r.alt || o || s === "subtract"
	}), u && /* @__PURE__ */ e.createElement(d, {
		at: "centre",
		size: c,
		feather: l
	}));
}
function be(e, n) {
	let r = C();
	if (e === "mask.delete") return !r.selectedMaskId || !r.selectedComponentId ? !1 : (n && (ne(r.selectedMaskId, r.selectedComponentId), t.stores.useDevelopStore.getState().commitEdit("Delete Component")), !0);
	let i = t.develop.brush.step(e, {
		size: r.brushSize,
		feather: r.brushFeather,
		opacity: r.brushOpacity,
		flow: r.brushFlow
	});
	if (!i || i.key === "size" && (r.activeTool !== "mask" || r.maskToolType !== "brush")) return !1;
	if (n) {
		let e = {};
		e[v[i.key]] = i.value, w(e);
	}
	return !0;
}
var xe = {
	overlay: he,
	zoomable: !0,
	onEscape: D,
	onAction: (e) => be(e, !0),
	wants: (e) => be(e, !1)
}, W = "safelight-masks", G = {
	panel: `${W}-panel`,
	head: `${W}-head`,
	hint: `${W}-hint`,
	brush: `${W}-brush`,
	erase: `${W}-erase`,
	muted: `${W}-muted`,
	list: `${W}-list`,
	row: `${W}-row`,
	on: `${W}-on`,
	off: `${W}-off`,
	eye: `${W}-eye`,
	hidden: `${W}-hidden`,
	kinds: `${W}-kinds`,
	rename: `${W}-rename`,
	name: `${W}-name`,
	invert: `${W}-invert`,
	reveal: `${W}-reveal`,
	remove: `${W}-remove`,
	editor: `${W}-editor`,
	section: `${W}-section`,
	mode: `${W}-mode`,
	add: `${W}-add`,
	subtract: `${W}-subtract`,
	intersect: `${W}-intersect`,
	icon: `${W}-icon`,
	caption: `${W}-caption`,
	card: `${W}-card`,
	cardHead: `${W}-card-head`,
	note: `${W}-note`,
	noteText: `${W}-note-text`,
	dim: `${W}-dim`,
	panels: `${W}-panels`,
	controls: `${W}-controls`,
	ranges: `${W}-ranges`,
	fields: `${W}-fields`,
	field: `${W}-field`,
	fieldLabel: `${W}-field-label`,
	fieldInput: `${W}-field-input`,
	swatch: `${W}-swatch`
}, K = (e, t) => `color-mix(in srgb, ${e} ${t}%, transparent)`;
function Se(e) {
	return `
:where(.${G.panel} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${G.head}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${G.hint}) { font-size: 10px; color: ${e.textMuted}; }
:where(.${G.brush}) { border-radius: 0.25rem; background-color: ${K(e.surface2, 50)}; padding: 0.375rem; }
:where(.${G.brush} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${G.erase}) { display: flex; align-items: center; gap: 0.375rem; padding: 0 0.125rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${G.muted}) { color: ${e.textMuted}; }
:where(.${G.list} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${G.row}) { display: flex; cursor: pointer; align-items: center; gap: 0.375rem; border-radius: 0.25rem; padding: 0.25rem 0.375rem; font-size: 11px; color: ${e.textSecondary}; }
:where(.${G.row}:hover) { background-color: ${e.surface2}; }
:where(.${G.row}.${G.on}) { background-color: ${K(e.accent, 20)}; color: ${e.textPrimary}; }
:where(.${G.row}.${G.off}) { opacity: 0.5; }
:where(.${G.eye}) { flex-shrink: 0; border-radius: 0.25rem; padding: 0 0.125rem; color: ${e.textMuted}; }
:where(.${G.eye}.${G.hidden}) { color: ${K(e.textMuted, 40)}; }
:where(.${G.eye}:hover) { color: ${e.textPrimary}; }
:where(.${G.kinds}) { flex-shrink: 0; color: ${e.textMuted}; }
:where(.${G.rename}) { min-width: 0; flex: 1 1 0%; border-radius: 0.25rem; background-color: ${e.surface3}; padding: 0 0.25rem; font-size: 11px; color: ${e.textPrimary}; outline: none; }
:where(.${G.name}) { flex: 1 1 0%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where(.${G.invert}) { border-radius: 0.25rem; padding: 0 0.25rem; color: ${e.textMuted}; }
:where(.${G.invert}:hover) { color: ${e.textPrimary}; }
:where(.${G.invert}.${G.on}) { color: ${e.accent}; }
:where(.${G.remove}) { border-radius: 0.25rem; padding: 0 0.25rem; color: ${e.textMuted}; }
:where(.${G.remove}:hover) { color: ${e.labelRed}; }
:where(.${G.reveal}:not(.${G.on})) { opacity: 0; }
:where(.${G.row}:hover .${G.reveal}) { opacity: 1; }
:where(.${G.editor}) { border-top: 1px solid ${e.borderSubtle}; padding-top: 0.5rem; }
:where(.${G.editor} > :not(:last-child)) { margin-block: 0 0.5rem; }
:where(.${G.section} > :not(:last-child)) { margin-block: 0 0.375rem; }
:where(.${G.mode}) { width: 1rem; flex-shrink: 0; border-radius: 0.25rem; text-align: center; font-weight: 700; }
:where(.${G.mode}.${G.add}) { color: ${e.accent}; }
:where(.${G.mode}.${G.subtract}) { color: ${e.labelYellow}; }
:where(.${G.mode}.${G.intersect}) { color: ${e.labelBlue}; }
:where(.${G.icon}) { width: 0.75rem; flex-shrink: 0; text-align: center; color: ${e.textMuted}; }
:where(.${G.caption}) { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: ${e.textMuted}; }
:where(.${G.card}) { border-radius: 0.25rem; background-color: ${K(e.surface2, 40)}; padding: 0.375rem; }
:where(.${G.cardHead}) { margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: space-between; }
:where(.${G.note}) { display: flex; align-items: center; justify-content: space-between; }
:where(.${G.noteText}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: ${e.textMuted}; }
:where(.${G.dim}) { opacity: 0.7; }
:where(.${G.panels}) { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
:where(.${G.controls}) { border-radius: 0.25rem; background-color: ${K(e.surface2, 40)}; padding: 0.375rem; }
:where(.${G.controls} > :not(:last-child)) { margin-block: 0 0.25rem; }
:where(.${G.ranges}) { border-radius: 0.25rem; background-color: ${K(e.surface2, 40)}; padding: 0.375rem; }
:where(.${G.ranges} > :not(:last-child)) { margin-block: 0 0.125rem; }
:where(.${G.fields}) { display: flex; flex-wrap: wrap; column-gap: 0.5rem; row-gap: 0.25rem; }
:where(.${G.field}) { display: flex; align-items: center; gap: 0.25rem; font-size: 10px; color: ${e.textMuted}; }
:where(.${G.fieldLabel}) { user-select: none; }
:where(.${G.fieldInput}) { width: 2.75rem; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0 0.25rem; text-align: right; font-variant-numeric: tabular-nums; color: ${e.textPrimary}; outline: none; }
:where(.${G.fieldInput}:focus) { background-color: ${e.surface3}; }
:where(.${G.swatch}) { height: 0.625rem; width: 0.625rem; border-radius: 0.125rem; }
html.sl-larger-text .${G.hint}, html.sl-larger-text .${G.caption}, html.sl-larger-text .${G.noteText}, html.sl-larger-text .${G.field} { font-size: 12px !important; }
html.sl-larger-text .${G.erase}, html.sl-larger-text .${G.row}, html.sl-larger-text .${G.rename} { font-size: 13px !important; line-height: 1.45 !important; }
html.sl-larger-text .${G.caption} { text-transform: none !important; letter-spacing: normal !important; }
`;
}
//#endregion
//#region src/MasksPanel.tsx
var Ce = "Update processing", we = [
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
], Te = [{
	kind: "lumRange",
	label: "Luminance Range"
}, {
	kind: "colorRange",
	label: "Colour Range"
}], Ee = {
	radial: "◯",
	linear: "▤",
	brush: "✎",
	lumRange: "◐",
	colorRange: "⬤"
}, De = {
	radial: "Radial",
	linear: "Linear",
	brush: "Brush",
	lumRange: "Luminance",
	colorRange: "Colour"
}, Oe = "✧", ke = "(not installed)", q = (e) => e.kind === "extension" ? e.extension?.type ?? e.kind : e.kind, Ae = (e) => e in Ee, J = (e, t) => e.find((e) => e.type === t), je = (e, t) => Ae(e) ? Ee[e] : J(t, e)?.icon ?? Oe, Me = (e, t, n) => Ae(e) ? De[e] : J(t, e)?.label ?? (n ? ke : e.slice(e.lastIndexOf(".") + 1)), Ne = {
	add: "+",
	subtract: "−",
	intersect: "∩"
}, Pe = {
	add: G.add,
	subtract: G.subtract,
	intersect: G.intersect
}, Fe = {
	add: "Add (union) — click to cycle",
	subtract: "Subtract (carve) — click to cycle",
	intersect: "Intersect (confine) — click to cycle"
}, Ie = (e) => e ? ` ${G.on}` : "", Le = [{
	value: "coverage",
	label: "Coverage"
}, {
	value: "adjust",
	label: "Adjust"
}];
function Re({ def: t, onRemove: n }) {
	let r = t.component;
	return /* @__PURE__ */ e.createElement("div", { className: G.card }, /* @__PURE__ */ e.createElement("div", { className: G.cardHead }, /* @__PURE__ */ e.createElement("span", { className: G.caption }, t.title), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: n,
		title: `Remove ${t.title} (resets its values)`,
		className: G.remove
	}, "×")), /* @__PURE__ */ e.createElement(r, null));
}
function ze() {
	let { Panel: n, Slider: r, MaskScope: i, ContextMenu: o } = t.components, { Button: s, SegmentedControl: c } = t.ui, l = t.stores.useDevelopStore, u = l((e) => e.params.masks), d = l((e) => e.commitEdit), f = l((e) => e.updateMask), p = l((e) => e.updateMaskAdj), m = l((e) => e.seedMaskPanelValues), h = l((e) => e.clearMaskPanelValues), g = t.develop.useOlderProcessing(), ee = l((e) => (e.params.processVersion ?? 1) < 2), _ = oe(), y = se(), b = t.develop.useMaskPanels(), x = t.develop.useCanvasToolHeld(), S = te(), { activeTool: C, maskToolType: T, maskCompMode: E, selectedMaskId: O, selectedComponentId: k, maskTab: A } = S, j = C === "mask";
	e.useEffect(() => {
		j && !x && w({ activeTool: "none" });
	}, [j, x]);
	let M = u.length >= 16, N = u.find((e) => e.id === O) ?? null, P = N?.components.find((e) => e.id === k) ?? null, [F, ae] = e.useState(null), [L, le] = e.useState(null), R = (e, t) => w({
		maskToolType: e,
		maskCompMode: t,
		maskAddTarget: N ? "current" : "new",
		activeTool: "mask"
	}), ue = (e) => w({
		selectedMaskId: null,
		maskToolType: e,
		maskCompMode: "add",
		maskAddTarget: "new",
		activeTool: "mask"
	}), V = (e) => {
		w({ maskTab: "coverage" }), e === "lumRange" || e === "colorRange" ? (w({ selectedMaskId: null }), ie(e), d("New Mask")) : ue(e);
	}, de = (e) => {
		e === "lumRange" || e === "colorRange" ? (ie(e), d("Add Component")) : (w({ selectedComponentId: null }), R(e, "add"));
	}, fe = (e) => (t) => {
		let n = t.currentTarget.getBoundingClientRect();
		ae({
			pick: e,
			x: n.left,
			y: n.bottom
		});
	}, H = ee ? `Needs the current processing: use ${Ce} on this photo first` : ce(u) >= 4 ? "A photo holds at most 4 of these" : void 0, pe = j ? J(_, T) : void 0, me = (e) => g && e.extensionParams, U = N ? b.filter((e) => N.panels.includes(e.id)) : [], he = N ? N.panels.filter((e) => !b.some((t) => t.id === e)) : [], ge = () => {
		if (N) {
			p(N.id, a());
			for (let e of U) m(N.id, e.owns);
			d("Mask Reset");
		}
	}, _e = (e) => {
		N && (m(N.id, e.owns), f(N.id, { panels: [...N.panels, e.id] }), d("Add Mask Panel"));
	}, ve = (e) => {
		if (!N) return;
		let t = b.find((t) => t.id === e);
		t && h(N.id, t.owns), f(N.id, { panels: N.panels.filter((t) => t !== e) }), d("Remove Mask Panel");
	}, ye = N ? b.filter((e) => !N.panels.includes(e.id)) : [], be = (e, t) => {
		w({
			selectedMaskId: e.id,
			selectedComponentId: t.id
		});
		let n = t.kind === "radial" || t.kind === "linear" || t.kind === "brush" ? t.kind : t.extension && J(_, t.extension.type) ? t.extension.type : null;
		n && w({
			maskToolType: n,
			maskCompMode: t.mode === "subtract" ? "subtract" : "add",
			maskAddTarget: "current",
			activeTool: "mask"
		});
	}, xe = (e) => {
		let t = [];
		for (let n of e.components) t.includes(q(n)) || t.push(q(n));
		return t;
	}, W = (e) => {
		e.target === e.currentTarget && w({
			selectedMaskId: null,
			selectedComponentId: null,
			hoveredMaskId: null
		});
	}, K = (n, i, a) => {
		let o = v[i];
		return /* @__PURE__ */ e.createElement(r, {
			label: n,
			value: Math.round(S[o] * 100),
			min: a,
			max: i === "size" ? 50 : 100,
			step: 1,
			defaultValue: Math.round(t.develop.brush.defaults[i] * 100),
			onChange: (e) => {
				let t = { brushPreview: !0 };
				t[o] = e / 100, w(t);
			},
			onCommit: () => w({ brushPreview: !1 })
		});
	};
	return /* @__PURE__ */ e.createElement(n, {
		title: "Masking",
		defaultOpen: !0
	}, /* @__PURE__ */ e.createElement("div", {
		className: G.panel,
		onClick: W
	}, /* @__PURE__ */ e.createElement(s, {
		full: !0,
		onClick: fe(V),
		disabled: M,
		title: M ? "Mask limit reached (16)" : void 0
	}, "+ Create Mask ▾"), F && /* @__PURE__ */ e.createElement(o, {
		x: F.x,
		y: F.y,
		items: Be(F.pick, _, H),
		onClose: () => ae(null)
	}), /* @__PURE__ */ e.createElement("div", { className: G.head }, /* @__PURE__ */ e.createElement("span", {
		className: G.hint,
		title: pe ? "Click the photo to place a point" : void 0
	}, pe ? pe.label : j ? T === "brush" ? `Paint to ${E === "subtract" ? "subtract" : "add"}` : `Drag to ${E === "subtract" ? "subtract" : "add"} a ${T}` : `${u.length}/16 masks`), j && /* @__PURE__ */ e.createElement(s, {
		size: "sm",
		onClick: D
	}, "Done")), j && T === "brush" && /* @__PURE__ */ e.createElement("div", { className: G.brush }, K("Size", "size", 1), K("Feather", "feather", 0), K("Opacity", "opacity", 1), K("Flow", "flow", 1), /* @__PURE__ */ e.createElement("label", { className: G.erase }, /* @__PURE__ */ e.createElement("input", {
		type: "checkbox",
		checked: S.brushErase,
		onChange: (e) => w({ brushErase: e.target.checked }),
		style: { accentColor: t.ui.tokens.sliderFill }
	}), "Erase", /* @__PURE__ */ e.createElement("span", { className: G.muted }, "· Alt erase · [ ] size · ⇧ feather · , . opacity · ⇧, ⇧. flow"))), u.length > 0 && /* @__PURE__ */ e.createElement("div", {
		className: G.list,
		onClick: W
	}, u.map((t) => {
		let n = t.visible !== !1;
		return /* @__PURE__ */ e.createElement("div", {
			key: t.id,
			onClick: () => w({
				selectedMaskId: t.id,
				selectedComponentId: t.components[0]?.id ?? null,
				maskTab: "coverage"
			}),
			onMouseEnter: () => w({ hoveredMaskId: t.id }),
			onMouseLeave: () => w({ hoveredMaskId: null }),
			className: G.row + Ie(t.id === O) + (n ? "" : ` ${G.off}`)
		}, /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation(), f(t.id, { visible: !n }), d("Mask Visibility");
			},
			onMouseEnter: () => w({ hoveredMaskId: null }),
			onMouseLeave: () => w({ hoveredMaskId: t.id }),
			title: n ? "Hide" : "Show",
			className: G.eye + (n ? "" : ` ${G.hidden}`)
		}, n ? "◉" : "○"), /* @__PURE__ */ e.createElement("span", { className: G.kinds }, xe(t).map((e) => je(e, _)).join(" ")), L?.id === t.id ? /* @__PURE__ */ e.createElement("input", {
			autoFocus: !0,
			value: L.value,
			onClick: (e) => e.stopPropagation(),
			onChange: (e) => le({
				id: t.id,
				value: e.target.value
			}),
			onBlur: () => {
				let e = L.value.trim();
				e && z(t.id, e), le(null), d("Rename Mask");
			},
			onKeyDown: (e) => {
				e.key === "Enter" && e.currentTarget.blur(), e.key === "Escape" && le(null);
			},
			className: G.rename
		}) : /* @__PURE__ */ e.createElement("span", {
			className: G.name,
			onDoubleClick: (e) => {
				e.stopPropagation(), le({
					id: t.id,
					value: t.name
				});
			}
		}, t.name, /* @__PURE__ */ e.createElement("span", { className: G.muted }, " (", t.components.length, ")")), /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation(), f(t.id, { invert: !t.invert }), d("Mask Invert");
			},
			title: "Invert whole mask",
			className: `${G.invert} ${G.reveal}${Ie(t.invert)}`
		}, "⊘"), /* @__PURE__ */ e.createElement("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation(), B(t.id), d("Delete Mask");
			},
			title: "Delete mask",
			"aria-label": "Delete mask",
			className: `${G.remove} ${G.reveal}`
		}, "×"));
	})), N && /* @__PURE__ */ e.createElement("div", { className: G.editor }, /* @__PURE__ */ e.createElement(c, {
		size: "sm",
		value: A,
		onChange: (e) => w({ maskTab: e === "adjust" ? "adjust" : "coverage" }),
		options: Le
	}), A === "coverage" ? /* @__PURE__ */ e.createElement("div", { className: G.section }, /* @__PURE__ */ e.createElement("div", { className: G.list }, N.components.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		onClick: () => be(N, t),
		className: G.row + Ie(t.id === k)
	}, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: (e) => {
			e.stopPropagation(), re(N.id, t.id), d("Component Mode");
		},
		title: Fe[t.mode],
		className: `${G.mode} ${Pe[t.mode]}`
	}, Ne[t.mode]), /* @__PURE__ */ e.createElement("span", { className: G.icon }, je(q(t), _)), /* @__PURE__ */ e.createElement("span", {
		className: G.name,
		title: t.kind === "extension" && !J(_, q(t)) ? q(t) : void 0
	}, Me(q(t), _, y)), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: (e) => {
			e.stopPropagation(), I(N.id, t.id, { invert: !t.invert }), d("Component Invert");
		},
		title: "Invert this component",
		className: G.invert + Ie(t.invert)
	}, "⊘"), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: (e) => {
			e.stopPropagation(), ne(N.id, t.id), d("Delete Component");
		},
		title: "Delete component",
		"aria-label": "Delete component",
		className: G.remove
	}, "×")))), /* @__PURE__ */ e.createElement(s, {
		size: "sm",
		full: !0,
		onClick: fe(de)
	}, "+ Add Component ▾"), P && /* @__PURE__ */ e.createElement(We, {
		key: P.id,
		maskId: N.id,
		comp: P
	})) : /* @__PURE__ */ e.createElement("div", { className: G.section }, /* @__PURE__ */ e.createElement("div", { className: G.head }, /* @__PURE__ */ e.createElement("span", { className: G.caption }, "Amount"), /* @__PURE__ */ e.createElement(s, {
		variant: "ghost",
		size: "sm",
		onClick: ge,
		title: "Reset this mask's adjustments"
	}, "Reset")), /* @__PURE__ */ e.createElement(r, {
		label: "Opacity",
		value: N.opacity,
		min: 0,
		max: 100,
		step: 1,
		defaultValue: 100,
		onChange: (e) => f(N.id, { opacity: e }),
		onCommit: () => void d("Mask Amount")
	}), /* @__PURE__ */ e.createElement(i, {
		key: N.id,
		maskId: N.id
	}, U.filter((e) => !me(e)).map((t) => /* @__PURE__ */ e.createElement(Re, {
		key: t.id,
		def: t,
		onRemove: () => ve(t.id)
	}))), U.filter(me).map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t.id,
		className: `${G.card} ${G.note}`
	}, /* @__PURE__ */ e.createElement("span", { className: G.noteText }, t.title, " ", /* @__PURE__ */ e.createElement("span", { className: G.dim }, "(needs ", Ce, ")")), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => ve(t.id),
		title: `Remove ${t.title} (resets its values)`,
		className: G.remove
	}, "×"))), he.map((t) => /* @__PURE__ */ e.createElement("div", {
		key: t,
		className: `${G.card} ${G.note}`
	}, /* @__PURE__ */ e.createElement("span", { className: G.noteText }, t, " ", /* @__PURE__ */ e.createElement("span", { className: G.dim }, "(not installed)")), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		onClick: () => ve(t),
		title: `Remove ${t}`,
		className: G.remove
	}, "×"))), ye.length > 0 && /* @__PURE__ */ e.createElement("div", { className: G.panels }, /* @__PURE__ */ e.createElement("span", { className: G.hint }, "Adjust:"), ye.map((t) => /* @__PURE__ */ e.createElement(s, {
		key: t.id,
		size: "sm",
		onClick: () => _e(t),
		disabled: me(t),
		title: me(t) ? `${t.title} in a mask needs the current processing: use ${Ce} on this photo first` : void 0
	}, "+ ", t.title)))))));
}
function Be(e, t, n) {
	return [
		...we.map((t) => ({
			label: t.label,
			icon: Ee[t.type],
			onClick: () => e(t.type)
		})),
		"separator",
		...Te.map((t) => ({
			label: t.label,
			icon: Ee[t.kind],
			onClick: () => e(t.kind)
		})),
		...t.length === 0 ? [] : ["separator", ...t.map((t) => ({
			label: t.label,
			icon: t.icon ?? Oe,
			onClick: () => e(t.type),
			disabled: n !== void 0,
			title: n
		}))]
	];
}
var Ve = null;
function He() {
	if (Ve) return Ve;
	class t extends e.Component {
		state = { failed: !1 };
		static getDerivedStateFromError() {
			return { failed: !0 };
		}
		componentDidCatch(e, t) {
			console.error(`Masking: the ${this.props.label} controls failed`, e);
		}
		render() {
			return this.state.failed ? null : this.props.children;
		}
	}
	return Ve = t, t;
}
function Ue({ maskId: n, comp: r, kind: i }) {
	let a = t.stores.useDevelopStore((e) => e.commitEdit), o = i.Controls;
	if (!o || !r.extension) return null;
	let s = He();
	return /* @__PURE__ */ e.createElement("div", { className: G.controls }, /* @__PURE__ */ e.createElement(s, { label: i.label }, /* @__PURE__ */ e.createElement(o, {
		values: r.extension.values,
		setValues: (e) => R(n, r.id, e),
		commit: (e) => void a(e)
	})));
}
var Y = (e) => Math.round(e * 100);
function X({ label: t, title: n, value: r, onChange: i, onCommit: a }) {
	return /* @__PURE__ */ e.createElement("label", {
		className: G.field,
		title: n
	}, /* @__PURE__ */ e.createElement("span", { className: G.fieldLabel }, t), /* @__PURE__ */ e.createElement("input", {
		type: "number",
		value: r,
		"aria-label": n,
		onChange: (e) => {
			e.target.value !== "" && i(Number(e.target.value));
		},
		onBlur: a,
		className: G.fieldInput
	}));
}
function We({ maskId: n, comp: r }) {
	let { Slider: i } = t.components, { Button: a } = t.ui, o = t.stores.useDevelopStore((e) => e.commitEdit), { maskColorPicking: s } = te(), c = oe(), l = t.accessibility.useKeyboardCanvasEditing(), u = () => void o("Mask Geometry");
	if (r.kind === "extension" && r.extension) {
		let t = J(c, r.extension.type);
		return t ? /* @__PURE__ */ e.createElement(Ue, {
			maskId: n,
			comp: r,
			kind: t
		}) : null;
	}
	if (r.kind === "radial" && r.radial) {
		let t = r.radial, a = (e) => I(n, r.id, { radial: {
			...t,
			...e
		} });
		return /* @__PURE__ */ e.createElement("div", { className: G.controls }, l && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("span", { className: G.caption }, "Geometry"), /* @__PURE__ */ e.createElement("div", { className: G.fields }, /* @__PURE__ */ e.createElement(X, {
			label: "X",
			title: "Centre X (%)",
			value: Y(t.cx),
			onChange: (e) => a({ cx: e / 100 }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "Y",
			title: "Centre Y (%)",
			value: Y(t.cy),
			onChange: (e) => a({ cy: e / 100 }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "W",
			title: "Radius X (%)",
			value: Y(t.rx),
			onChange: (e) => a({ rx: Math.max(0, e / 100) }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "H",
			title: "Radius Y (%)",
			value: Y(t.ry),
			onChange: (e) => a({ ry: Math.max(0, e / 100) }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "∠",
			title: "Angle (degrees)",
			value: Math.round(t.angle * 180 / Math.PI),
			onChange: (e) => a({ angle: e * Math.PI / 180 }),
			onCommit: u
		}))), /* @__PURE__ */ e.createElement(i, {
			label: "Feather",
			value: Math.round(t.feather * 100),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 50,
			onChange: (e) => a({ feather: e / 100 }),
			onCommit: () => void o("Mask Feather")
		}));
	}
	if (r.kind === "linear" && r.linear) {
		if (!l) return null;
		let t = r.linear, i = (e) => I(n, r.id, { linear: {
			...t,
			...e
		} });
		return /* @__PURE__ */ e.createElement("div", { className: G.controls }, /* @__PURE__ */ e.createElement("span", { className: G.caption }, "Geometry"), /* @__PURE__ */ e.createElement("div", { className: G.fields }, /* @__PURE__ */ e.createElement(X, {
			label: "X1",
			title: "Start X (%)",
			value: Y(t.x0),
			onChange: (e) => i({ x0: e / 100 }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "Y1",
			title: "Start Y (%)",
			value: Y(t.y0),
			onChange: (e) => i({ y0: e / 100 }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "X2",
			title: "End X (%)",
			value: Y(t.x1),
			onChange: (e) => i({ x1: e / 100 }),
			onCommit: u
		}), /* @__PURE__ */ e.createElement(X, {
			label: "Y2",
			title: "End Y (%)",
			value: Y(t.y1),
			onChange: (e) => i({ y1: e / 100 }),
			onCommit: u
		})));
	}
	if (r.kind === "lumRange" && r.lumRange) {
		let t = r.lumRange, a = (e) => I(n, r.id, { lumRange: {
			...t,
			...e
		} }), s = () => void o("Lum Range");
		return /* @__PURE__ */ e.createElement("div", { className: G.ranges }, /* @__PURE__ */ e.createElement("span", { className: G.caption }, "Luminance range"), /* @__PURE__ */ e.createElement(i, {
			label: "Low",
			value: Y(t.lo),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 0,
			onChange: (e) => a({ lo: Math.min(e / 100, t.hi) }),
			onCommit: s
		}), /* @__PURE__ */ e.createElement(i, {
			label: "High",
			value: Y(t.hi),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 100,
			onChange: (e) => a({ hi: Math.max(e / 100, t.lo) }),
			onCommit: s
		}), /* @__PURE__ */ e.createElement(i, {
			label: "Low Falloff",
			value: Y(t.loFeather),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 10,
			onChange: (e) => a({ loFeather: e / 100 }),
			onCommit: s
		}), /* @__PURE__ */ e.createElement(i, {
			label: "High Falloff",
			value: Y(t.hiFeather),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 10,
			onChange: (e) => a({ hiFeather: e / 100 }),
			onCommit: s
		}));
	}
	if (r.kind === "colorRange" && r.colorRange) {
		let t = r.colorRange, c = (e) => I(n, r.id, { colorRange: {
			...t,
			...e
		} }), l = () => void o("Colour Range"), u = (e) => Math.round((e <= .0031308 ? e * 12.92 : 1.055 * e ** (1 / 2.4) - .055) * 255), d = `rgb(${u(t.r)}, ${u(t.g)}, ${u(t.b)})`;
		return /* @__PURE__ */ e.createElement("div", { className: G.ranges }, /* @__PURE__ */ e.createElement("div", { className: G.head }, /* @__PURE__ */ e.createElement("span", { className: G.caption }, "Colour range"), /* @__PURE__ */ e.createElement(a, {
			size: "sm",
			active: s,
			onClick: () => w({
				activeTool: "mask",
				maskColorPicking: !s
			}),
			title: "Pick a target colour from the image"
		}, /* @__PURE__ */ e.createElement("span", {
			className: G.swatch,
			style: { backgroundColor: d }
		}), "Pick")), /* @__PURE__ */ e.createElement(i, {
			label: "Hue Range",
			value: Y(t.hueRange),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 15,
			onChange: (e) => c({ hueRange: e / 100 }),
			onCommit: l
		}), /* @__PURE__ */ e.createElement(i, {
			label: "Sat Range",
			value: Y(t.satRange),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 30,
			onChange: (e) => c({ satRange: e / 100 }),
			onCommit: l
		}), /* @__PURE__ */ e.createElement(i, {
			label: "Smoothness",
			value: Y(t.smoothness),
			min: 0,
			max: 100,
			step: 1,
			defaultValue: 25,
			onChange: (e) => c({ smoothness: e / 100 }),
			onCommit: l
		}));
	}
	return null;
}
//#endregion
//#region src/curve.ts
function Ge(e) {
	let t = [...e].sort((e, t) => e.x - t.x), n = t.length;
	if (n === 0) return (e) => e;
	if (n === 1) return () => Je(t[0].y);
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
		if (e <= r[0]) return Je(i[0]);
		if (e >= r[n - 1]) return Je(i[n - 1]);
		let t = 0;
		for (; t < n - 1 && e > r[t + 1];) t++;
		let a = r[t + 1] - r[t], s = (e - r[t]) / a, c = s * s, l = c * s, u = 2 * l - 3 * c + 1, d = l - 2 * c + s, f = -2 * l + 3 * c, p = l - c;
		return Je(u * i[t] + d * a * o[t] + f * i[t + 1] + p * a * o[t + 1]);
	};
}
function Ke(e, t, n = 0) {
	let r = Ge(e.rgb), i = Ge(e.red), a = Ge(e.green), o = Ge(e.blue);
	for (let e = 0; e < 256; e++) {
		let s = r(e / 255), c = n + e * 4;
		t[c] = Math.round(i(s) * 255), t[c + 1] = Math.round(a(s) * 255), t[c + 2] = Math.round(o(s) * 255), t[c + 3] = 255;
	}
	return t;
}
function qe(e) {
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
function Je(e) {
	return e < 0 ? 0 : e > 1 ? 1 : e;
}
//#endregion
//#region src/stages.ts
var Ye = "safelight.masks.coverage", Xe = "// Coverage of one component (0..1), before add/subtract combine. px is the\n// current pixel's working (scene-linear) colour and pxL its luma — used by the\n// parametric range masks (luminance / colour).\nfloat compCoverage(int i, vec2 uv, vec3 px, float pxL) {\n  int type = uCompType[i];\n  vec4 gA = uCompGeoA[i];\n  vec4 gB = uCompGeoB[i];\n  float m = 0.0;\n  if (type == 0) {\n    // Linear gradient: ramp 0->1 projected onto the drag direction.\n    vec2 p0 = gA.xy;\n    vec2 p1 = gA.zw;\n    vec2 dir = p1 - p0;\n    float len2 = max(dot(dir, dir), 1e-6);\n    m = clamp(dot(uv - p0, dir) / len2, 0.0, 1.0);\n  } else if (type == 1) {\n    // Radial: 1 inside, feathered to 0 at the edge, in screen-proportional space.\n    vec2 ctr = gA.xy;\n    vec2 rad = max(gA.zw, vec2(1e-4));\n    float feather = gB.x;\n    float ang = gB.y;\n    vec2 q = vec2((uv.x - ctr.x) * uImageAspect, uv.y - ctr.y);\n    float ca = cos(ang);\n    float sa = sin(ang);\n    vec2 qr = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);\n    vec2 radS = vec2(rad.x * uImageAspect, rad.y);\n    float d = length(qr / radS);\n    m = 1.0 - smoothstep(1.0 - feather, 1.0, d);\n  } else if (type == 3) {\n    // Luminance range: 1 inside [lo,hi], soft ramps of width loF/hiF at the ends.\n    float lo = gA.x;\n    float hi = gA.y;\n    float loF = max(gA.z, 1e-4);\n    float hiF = max(gA.w, 1e-4);\n    float lower = smoothstep(lo - loF, lo, pxL);\n    float upper = 1.0 - smoothstep(hi, hi + hiF, pxL);\n    m = lower * upper;\n  } else if (type == 4) {\n    // Colour range: closeness to a target colour, measured in hue + chroma.\n    vec3 tgt = gA.xyz;\n    float hueRange = max(gA.w, 1e-3);\n    float satRange = max(gB.x, 1e-3);\n    float smth = gB.y;\n    // Compare in a tone-normalized chroma space so exposure differences along\n    // the same hue don't break the match. Direction of the colour vector ~ hue,\n    // its length relative to luma ~ saturation.\n    float tL = max(luma(tgt), 1e-4);\n    vec3 pd = px - vec3(pxL);\n    vec3 td = tgt - vec3(tL);\n    float pLen = length(pd);\n    float tLen = length(td);\n    float hueDist = 1.0 - (dot(pd, td) / max(pLen * tLen, 1e-4)); // 0 = same hue\n    float satDist = abs(pLen / max(pxL, 1e-3) - tLen / tL);       // chroma mismatch\n    float hueM = 1.0 - smoothstep(hueRange, hueRange + smth + 1e-3, hueDist);\n    float satM = 1.0 - smoothstep(satRange, satRange + smth + 1e-3, satDist);\n    // Near-neutral target/pixel have no meaningful hue — fall back to chroma only.\n    float chromaW = smoothstep(0.01, 0.05, tLen);\n    m = mix(satM, hueM * satM, chromaW);\n  }", Ze = " else if (type == 5) {\n    int ch = uCompBrushCh[i];\n    vec4 r = textureLod(uMaskRasters, uv, 0.0);\n    m = ch < 0 || textureSize(uMaskRasters, 0).x < 2 ? 0.0 : (ch == 0 ? r.r : (ch == 1 ? r.g : (ch == 2 ? r.b : r.a)));\n  }", Qe = " else {\n    // Brush: prebaked coverage from the atlas channel. ch < 0 marks a brush with\n    // no atlas slot (beyond the 4 the RGBA atlas holds) — it contributes nothing\n    // rather than borrowing channel 0's coverage.\n    vec4 cov = texture(uMaskTex, uv);\n    int ch = uCompBrushCh[i];\n    m = ch < 0 ? 0.0 : (ch == 0 ? cov.r : (ch == 1 ? cov.g : (ch == 2 ? cov.b : cov.a)));\n  }\n  if (uCompInvert[i] == 1) m = 1.0 - m;\n  return clamp(m, 0.0, 1.0);\n}", $e = (e) => Xe + (e >= 3 ? Ze : "") + Qe, et = 4;
function tt(e) {
	let t = {}, n = 0;
	for (let r of e) for (let e of r.components) e.kind === "extension" && e.extension && (t[e.id] = n < et ? n : -1, n++);
	return t;
}
var Z = (e, t, n) => ({
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
function nt(e) {
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
function rt(e, t) {
	return e >= 3 ? {
		type: 5,
		ch: t ?? -1
	} : {
		type: 2,
		ch: -1
	};
}
var it = 0, at = (e) => ({
	id: Ye,
	name: "Masking",
	phase: "scene-linear",
	anchor: "masks",
	glsl: "",
	helpers: $e(e),
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
	}, ...e >= 3 ? [{
		key: "uMaskRasters",
		kind: "dynamic"
	}] : []],
	dormantWhen: { uMaskCount: 0 },
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
		let o = tt(t), s = a.map(({ c: t }) => t.kind === "extension" ? rt(e, o[t.id]) : null), u = a.map(({ c: e }, t) => {
			let n = nt(e), r = s[t];
			return r ? {
				...n,
				type: r.type
			} : n;
		}), d = Array(384).fill(0);
		n.forEach((e, t) => {
			e.hsl && !c(e.hsl) && r.forEach((n, r) => {
				d[t * 24 + r] = e.hsl.hue[n] / 100, d[t * 24 + 8 + r] = e.hsl.saturation[n] / 100, d[t * 24 + 16 + r] = e.hsl.luminance[n] / 100;
			});
		});
		let f = /* @__PURE__ */ new Uint8Array(16384);
		for (let e = 0; e < 16; e++) for (let t = 0; t < 256; t++) f.set([
			t,
			t,
			t,
			255
		], (e * 256 + t) * 4);
		let p = n.map((e, t) => !e.toneCurve || qe(e.toneCurve) ? 0 : (Ke(e.toneCurve, f, t * 256 * 4), 1)), m = (e) => $(n.flatMap((t) => e(t.adj)), 64);
		return {
			uMaskCount: n.length,
			uMaskInvert: $(n.map((e) => +!!e.invert), 16),
			uMaskOpacity: $(n.map((e) => e.visible === !1 ? 0 : e.opacity / 100), 16),
			uCompCount: a.length,
			uCompMaskIdx: $(a.map(({ mi: e }) => e), 24),
			uCompMode: $(a.map(({ c: e }) => e.mode === "subtract" ? 1 : e.mode === "intersect" ? 2 : 0), 24),
			uCompType: $(u.map((e) => e.type), 24),
			uCompInvert: $(a.map(({ c: e }, t) => e.invert && !s[t] ? 1 : 0), 24),
			uCompBrushCh: $(a.map(({ c: e }, t) => s[t]?.ch ?? i.get(e.id) ?? -1), 24),
			uCompGeoA: $(u.flatMap((e) => e.a), 96),
			uCompGeoB: $(u.flatMap((e) => e.b), 96),
			uMaskAdj0: m((e) => [
				e.exposure,
				e.contrast,
				e.highlights,
				e.shadows
			]),
			uMaskAdj1: m((e) => [
				e.saturation,
				e.temperature,
				e.tint,
				e.clarity
			]),
			uMaskAdj2: m((e) => [
				e.sharpness,
				e.whites,
				e.blacks,
				e.vibrance
			]),
			uMaskAdj3: m((e) => [
				e.texture,
				e.dehaze,
				0,
				0
			]),
			uMaskHasHsl: $(n.map((e) => e.hsl && !c(e.hsl) ? 1 : 0), 16),
			uMaskHsl: d,
			uMaskHasCurve: $(p, 16),
			uMaskCurves: {
				data: f,
				width: 256,
				height: 16,
				format: "rgba8",
				version: ++it
			},
			...e === 1 ? {} : { uMaskHasDisplay: $(n.map((e) => +!!l(e.adj)), 16) }
		};
	}
});
//#endregion
//#region src/viz.ts
function ot(e, t, n, r) {
	return t && e.some((e) => e.id === t) ? t : n && r === "coverage" && e.some((e) => e.id === n) ? n : null;
}
//#endregion
//#region src/index.tsx
var st = "core.masks", ct = "safelight.masks.styles", lt = 3, ut = [];
function dt(e) {
	n(e), T(), e.registerStylesheet({
		id: ct,
		css: Se(e.ui.tokens)
	}), e.registerProcessingStage(at(3)), e.registerPanel({
		id: st,
		title: "Masking",
		component: ze,
		defaultDock: {
			module: "develop",
			direction: "left",
			order: 0,
			width: 240,
			height: 240
		},
		onReset: () => {
			w({
				selectedMaskId: null,
				selectedComponentId: null,
				hoveredMaskId: null
			}), e.stores.useDevelopStore.getState().resetParams(["masks"], "Reset Masking");
		}
	});
	for (let e of ut) e();
	let t = e.stores.useDevelopStore, r = !1, i = () => {
		let t = C().activeTool === "mask";
		t !== r && (r = t, e.develop.setCanvasTool(t ? xe : null), t && e.develop.prewarmStages?.());
	}, a = null, o = () => {
		let n = C(), r = ot(t.getState().params.masks, n.hoveredMaskId, n.selectedMaskId, n.maskTab);
		r !== a && (a = r, e.develop.showMaskCoverage(r));
	};
	ut = [
		E(i),
		E(o),
		t.subscribe(o),
		t.subscribe((e, t) => {
			e.photoId !== t.photoId && w({
				activeTool: "none",
				selectedMaskId: null,
				selectedComponentId: null,
				hoveredMaskId: null,
				maskColorPicking: !1
			});
		})
	];
}
function ft() {
	for (let e of ut) e();
	ut = [], T(), t.develop.setCanvasTool(null), t.develop.showMaskCoverage(null);
}
//#endregion
export { lt as LINE, st as PANEL_ID, ct as STYLESHEET_ID, dt as activate, ft as deactivate };

//# sourceMappingURL=index.js.map