// 1990s Television Live Show — WGSL for Group::Live90s.
// RapidRAW appends compute_common.wgsl, which supplies Grid, t0..t5,
// out_f32/out_f16, plain_luma, smooth_step, tap_uv, tap_sample and outside.

struct Params {
    grid: Grid,
    amount: f32,
    softness: f32,
    detail: f32,
    chroma_bleed: f32,
    color_punch: f32,
    black_lift: f32,
    rolloff: f32,
    diffusion: f32,
    diffusion_threshold: f32,
    star_amount: f32,
    star_length: f32,
    star_angle: f32,
    warmth: f32,
    noise_amt: f32,
    interlace: f32,
    seed: u32,
    flags: u32,
    sd_w: u32,
    sd_h: u32,
    star_points: u32,
}

@group(0) @binding(7) var<uniform> params: Params;

const LIVE90S_SD: u32 = 1u;
const LIVE90S_INTERLACE: u32 = 2u;
const PI: f32 = 3.141592653589793;

fn ls90_to_srgb(c: vec3<f32>) -> vec3<f32> {
    return pow(max(c, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4));
}

fn ls90_to_linear(c: vec3<f32>) -> vec3<f32> {
    return pow(max(c, vec3<f32>(0.0)), vec3<f32>(2.4));
}

fn ls90_hash(p: vec2<u32>, seed: u32) -> f32 {
    var h = (p.x * 0x8da6b343u) ^ (p.y * 0xd8163841u) ^ (seed * 0x2545f491u);
    h = (h ^ (h >> 13u)) * 0x85ebca6bu;
    h = h ^ (h >> 16u);
    return f32(h) / 4294967296.0;
}

fn ls90_image_xy(id: vec2<u32>) -> vec2<u32> {
    let src = vec2<f32>(params.grid.src);
    let dst = max(vec2<f32>(params.grid.dst), vec2<f32>(1.0));
    if (src.x < 1.0 || src.y < 1.0) {
        return id;
    }
    return vec2<u32>(vec2<f32>(id) * src / dst);
}

fn ls90_white_clip(c: vec3<f32>, strength: f32) -> vec3<f32> {
    let knee = mix(1.0, 0.52, strength);
    let span = max(1.0 - knee, 1e-3);
    var out = c;
    for (var i = 0; i < 3; i = i + 1) {
        if (c[i] > knee) {
            let t = clamp((c[i] - knee) / span, 0.0, 1.0);
            out[i] = knee + span * (1.0 - (1.0 - t) * (1.0 - t));
        }
    }
    return out;
}

// Extract only stage lights and specular peaks. The same bright pass feeds the
// broad diffusion and the cross-screen star filter.
@compute @workgroup_size(8, 8, 1)
fn ls90_bright(@builtin(global_invocation_id) id: vec3<u32>) {
    if (outside(id)) {
        return;
    }
    let c = textureLoad(t0, vec2<i32>(id.xy), 0).rgb;
    let l = plain_luma(c);
    let weight = smooth_step(params.diffusion_threshold, params.diffusion_threshold + 0.10, l);
    let near_white = mix(c, vec3<f32>(max(max(c.r, c.g), c.b)), 0.28);
    textureStore(out_f32, id.xy, vec4<f32>(near_white * weight, 1.0));
}

// Directional cross-screen filter. Four points use two axes, six points three,
// and eight points four. Sampling is performed in texel space so rays keep the
// requested angle regardless of image aspect ratio.
@compute @workgroup_size(8, 8, 1)
fn ls90_star(@builtin(global_invocation_id) id: vec3<u32>) {
    if (outside(id)) {
        return;
    }
    let size = textureDimensions(t0);
    let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(size);
    let axes = max(params.star_points / 2u, 2u);
    let base_angle = params.star_angle * (PI * 0.5);
    let spacing = 1.0 + params.star_length * 4.5;
    var rays = vec3<f32>(0.0);
    var weight_sum = 0.0;

    for (var axis = 0u; axis < 4u; axis = axis + 1u) {
        if (axis < axes) {
            let angle = base_angle + f32(axis) * PI / f32(axes);
            let direction = vec2<f32>(cos(angle), sin(angle));
            for (var step = 1u; step <= 14u; step = step + 1u) {
                let s = f32(step);
                let falloff = (1.0 - s / 15.0) * (1.0 - s / 15.0);
                let offset = direction * (s * spacing) / vec2<f32>(size);
                let uv_a = clamp(uv + offset, vec2<f32>(0.0), vec2<f32>(1.0));
                let uv_b = clamp(uv - offset, vec2<f32>(0.0), vec2<f32>(1.0));
                rays += (tap_sample(t0, tap_uv(uv_a, size)).rgb +
                         tap_sample(t0, tap_uv(uv_b, size)).rgb) * falloff;
                weight_sum += 2.0 * falloff;
            }
        }
    }

    // Keep ray brightness proportional to the bright source rather than the
    // number of selected axes.
    rays = rays / max(weight_sum / f32(axes), 1e-3);
    textureStore(out_f32, id.xy, vec4<f32>(rays, 1.0));
}

// t0 source, t1 small blur, t2 chroma blur, t3 diffusion, t4 stars, t5 SD source.
@compute @workgroup_size(8, 8, 1)
fn ls90_combine(@builtin(global_invocation_id) id: vec3<u32>) {
    if (outside(id)) {
        return;
    }
    let p = vec2<i32>(id.xy);
    let full_size = max(params.grid.dst, vec2<u32>(1u));
    let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(full_size);
    var base = textureLoad(t0, p, 0).rgb;

    if ((params.flags & LIVE90S_SD) != 0u) {
        base = tap_sample(t5, tap_uv(uv, vec2<u32>(params.sd_w, params.sd_h))).rgb;
    }
    let original = base;
    let soft = textureLoad(t1, p, 0).rgb;

    // Soft electronic camera texture, then component-video-like chroma bandwidth
    // reduction with a small horizontal colour delay/bleed.
    var col = mix(base, soft, params.softness * 0.72);
    let bleed_px = params.chroma_bleed * 2.5;
    let chroma_uv = clamp(uv - vec2<f32>(bleed_px / f32(full_size.x), 0.0),
                          vec2<f32>(0.0), vec2<f32>(1.0));
    let chroma_src = tap_sample(t2, tap_uv(chroma_uv, full_size)).rgb;
    let yl = plain_luma(col);
    let yc = plain_luma(chroma_src);
    let own_chroma = col - vec3<f32>(yl);
    let soft_chroma = chroma_src - vec3<f32>(yc);
    col = vec3<f32>(yl) + mix(own_chroma, soft_chroma, params.chroma_bleed);

    // Broadcast aperture correction: crisp luma edges over a slightly soft base.
    let high = plain_luma(base) - plain_luma(soft);
    col += vec3<f32>(high * params.detail * 1.75);

    // Saturated stage lighting, controllable warm/cool bias and mild raised blacks.
    let luma = plain_luma(col);
    col = mix(vec3<f32>(luma), col, 1.0 + params.color_punch * 0.9);
    let tone = (params.warmth - 0.5) * 2.0;
    let warm_tint = vec3<f32>(1.0 + max(tone, 0.0) * 0.10,
                              1.0,
                              1.0 + max(-tone, 0.0) * 0.08 - max(tone, 0.0) * 0.10);
    col *= warm_tint;
    col = col * (1.0 - params.black_lift * 0.08) + vec3<f32>(params.black_lift * 0.035);
    col = ls90_white_clip(col, params.rolloff);

    let bloom_size = textureDimensions(t3);
    let star_size = textureDimensions(t4);
    if (params.diffusion > 0.0) {
        let bloom = max(tap_sample(t3, tap_uv(uv, bloom_size)).rgb, vec3<f32>(0.0));
        let bloom_tint = bloom * mix(vec3<f32>(1.0), vec3<f32>(1.08, 1.01, 0.86),
                                     max(tone, 0.0));
        let screened = vec3<f32>(1.0) -
            (vec3<f32>(1.0) - clamp(col, vec3<f32>(0.0), vec3<f32>(1.0))) *
            (vec3<f32>(1.0) - clamp(bloom_tint * params.diffusion, vec3<f32>(0.0), vec3<f32>(1.0)));
        col = screened + bloom_tint * params.diffusion * 0.16;
    }

    if (params.star_amount > 0.0) {
        let star = max(tap_sample(t4, tap_uv(uv, star_size)).rgb, vec3<f32>(0.0));
        let star_tint = mix(vec3<f32>(0.92, 0.96, 1.08), vec3<f32>(1.14, 1.02, 0.82),
                            params.warmth);
        col += star * star_tint * params.star_amount * 0.52;
    }

    let img = ls90_image_xy(id.xy);
    if (params.noise_amt > 0.0) {
        let noise = (ls90_hash(img, params.seed) - 0.5) * 2.0;
        col = ls90_to_linear(ls90_to_srgb(col) + vec3<f32>(noise * params.noise_amt * 0.045));
    }
    if ((params.flags & LIVE90S_INTERLACE) != 0u) {
        let field = f32(img.y & 1u) * 2.0 - 1.0;
        col *= 1.0 + field * params.interlace * 0.045;
    }

    col = mix(original, max(col, vec3<f32>(0.0)), params.amount);
    textureStore(out_f16, id.xy, vec4<f32>(col, 1.0));
}
