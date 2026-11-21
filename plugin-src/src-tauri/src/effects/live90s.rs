// 1990s Television Live Show — GPU effect for RapidRAW.
//
// Clean-room emulation of professional 1990s studio and live-music television:
// Betacam-era chroma bandwidth, electronic aperture correction, lifted blacks,
// optical diffusion, cross-screen star rays, optional SD resampling/interlace,
// and restrained image-space video noise. No VHS tracking or CRT overlays.

use crate::render::adjustment_utils::is_effect_enabled;
use crate::render::gpu::compute::{Bind, ComputeEncoder, Grid, Group, Out, RGB_MODE, Slot};

const LIVE90S_SD: u32 = 1;
const LIVE90S_INTERLACE: u32 = 2;

#[repr(C)]
#[derive(Debug, Default, Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
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

pub struct Live90s {
    source_size: (u32, u32),
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
    star_points: u32,
    sd_height: Option<u32>,
    interlace_on: bool,
}

pub fn prepare(
    adjustments: &serde_json::Value,
    (w, h): (u32, u32),
    source_size: (u32, u32),
) -> Option<Live90s> {
    if !is_effect_enabled(adjustments, "live90s", "live90sEnabled") || w < 2 || h < 2 {
        return None;
    }

    let unit = |key: &str, default: f64| {
        (adjustments[key].as_f64().unwrap_or(default) as f32 / 100.0).clamp(0.0, 1.0)
    };
    let amount = unit("live90sAmount", 100.0);
    if amount <= 0.0 {
        return None;
    }

    let sd_height = match adjustments["live90sSdLook"].as_str().unwrap_or("pal576") {
        "pal576" => Some(576),
        "ntsc480" => Some(480),
        _ => None,
    };
    let star_points = match adjustments["live90sStarPoints"].as_str().unwrap_or("4") {
        "4" => 4,
        "6" => 6,
        _ => 8,
    };

    Some(Live90s {
        source_size,
        amount,
        softness: unit("live90sSoftness", 38.0),
        detail: unit("live90sDetail", 45.0),
        chroma_bleed: unit("live90sChromaBleed", 48.0),
        color_punch: unit("live90sColorPunch", 55.0),
        black_lift: unit("live90sBlackLift", 18.0),
        rolloff: unit("live90sHighlightRolloff", 52.0),
        diffusion: unit("live90sDiffusion", 58.0),
        diffusion_threshold: unit("live90sDiffusionThreshold", 58.0),
        star_amount: unit("live90sStarAmount", 65.0),
        star_length: unit("live90sStarLength", 68.0),
        star_angle: (adjustments["live90sStarAngle"].as_f64().unwrap_or(0.0) as f32 / 90.0)
            .clamp(0.0, 1.0),
        warmth: unit("live90sWarmth", 58.0),
        noise_amt: unit("live90sVideoNoise", 5.0),
        interlace: unit("live90sInterlaceStrength", 20.0),
        seed: (adjustments["live90sSeed"].as_u64().unwrap_or(1) & 0xffff_ffff) as u32,
        star_points,
        sd_height,
        interlace_on: adjustments["live90sInterlace"].as_bool().unwrap_or(false),
    })
}

fn params(job: &Live90s, size: (u32, u32), flags: u32, sd_size: (u32, u32)) -> Params {
    Params {
        grid: Grid::new(size).with_src(job.source_size),
        amount: job.amount,
        softness: job.softness,
        detail: job.detail,
        chroma_bleed: job.chroma_bleed,
        color_punch: job.color_punch,
        black_lift: job.black_lift,
        rolloff: job.rolloff,
        diffusion: job.diffusion,
        diffusion_threshold: job.diffusion_threshold,
        star_amount: job.star_amount,
        star_length: job.star_length,
        star_angle: job.star_angle,
        warmth: job.warmth,
        noise_amt: job.noise_amt,
        interlace: job.interlace,
        seed: job.seed,
        flags,
        sd_w: sd_size.0,
        sd_h: sd_size.1,
        star_points: job.star_points,
    }
}

pub fn encode(enc: &mut ComputeEncoder, job: &Live90s, src: &Slot, dst: &Slot) {
    let (w, h) = src.size;
    if w < 2 || h < 2 {
        return;
    }
    let long = w.max(h) as f32;

    let (sd_tex, sd_size) = if let Some(target_h) = job.sd_height {
        let sh = target_h.min(h).max(2);
        let sw = (((w as f32) * sh as f32 / h as f32).round() as u32).max(2);
        (Some(enc.area_down(src, (sw, sh), RGB_MODE)), (sw, sh))
    } else {
        (None, (0, 0))
    };

    let mut flags = 0u32;
    if job.sd_height.is_some() {
        flags |= LIVE90S_SD;
    }
    if job.interlace_on {
        flags |= LIVE90S_INTERLACE;
    }
    let full_params = params(job, (w, h), flags, sd_size);

    let soft_copy = enc.area_down(src, (w, h), RGB_MODE);
    let soft = enc.blur(soft_copy, ((long * 0.0035).round() as u32).max(1), 2, RGB_MODE);

    let chroma_copy = enc.area_down(src, (w, h), RGB_MODE);
    let chroma = enc.blur(
        chroma_copy,
        ((long * 0.0065 * (0.45 + job.chroma_bleed)).round() as u32).max(1),
        2,
        RGB_MODE,
    );

    // Light effects run on a bounded canvas. The directional star filter stays
    // fast while its bilinear upsample remains optically smooth.
    let light_h = h.min(720).max(2);
    let light_w = (((w as f32) * light_h as f32 / h as f32).round() as u32).max(2);
    let light_size = (light_w, light_h);
    let light_params = params(job, light_size, flags, sd_size);
    let lights_needed = job.diffusion > 0.0 || job.star_amount > 0.0;

    let mut bright = None;
    let mut bloom = None;
    let mut stars = None;
    if lights_needed {
        let light_src = enc.area_down(src, light_size, RGB_MODE);
        let bright_tex = enc.texture("Live90s Bright", light_size, wgpu::TextureFormat::Rgba32Float);
        enc.run(
            Group::Live90s,
            "ls90_bright",
            &light_params,
            light_size,
            &[&light_src.view],
            Out::F32(&bright_tex.view),
            Bind::default(),
        );

        if job.diffusion > 0.0 {
            let bloom_copy = enc.area_down(&bright_tex, light_size, RGB_MODE);
            bloom = Some(enc.blur(
                bloom_copy,
                ((light_w.max(light_h) as f32 * 0.024).round() as u32).max(3),
                2,
                RGB_MODE,
            ));
        }

        if job.star_amount > 0.0 {
            let star_tex = enc.texture("Live90s Stars", light_size, wgpu::TextureFormat::Rgba32Float);
            enc.run(
                Group::Live90s,
                "ls90_star",
                &light_params,
                light_size,
                &[&bright_tex.view],
                Out::F32(&star_tex.view),
                Bind::default(),
            );
            stars = Some(star_tex);
        }
        bright = Some(bright_tex);
    }

    let bloom_view = bloom
        .as_ref()
        .map(|texture| &texture.view)
        .or_else(|| bright.as_ref().map(|texture| &texture.view))
        .unwrap_or(&src.view);
    let star_view = stars
        .as_ref()
        .map(|texture| &texture.view)
        .or_else(|| bright.as_ref().map(|texture| &texture.view))
        .unwrap_or(&src.view);
    let sd_view = sd_tex.as_ref().map(|texture| &texture.view).unwrap_or(&src.view);

    enc.run(
        Group::Live90s,
        "ls90_combine",
        &full_params,
        (w, h),
        &[&src.view, &soft.view, &chroma.view, bloom_view, star_view, sd_view],
        Out::F16(&dst.view),
        Bind::default(),
    );
}
