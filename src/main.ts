import Joi from "joi";
import devices from "screenshotone-devices";

const validationOptions = { abortEarly: false };

const accessKeyScheme = {
    access_key: Joi.string().optional(),
};
const signatureScheme = {
    signature: Joi.string().optional(),
};

const validUri = (value: any, helper: any) => {
    try {
        const u = new URL(value);

        if (u.protocol !== "http:" && u.protocol !== "https:") {
            return helper.message(
                '"url" must be a valid URI with a scheme matching the http|https pattern'
            );
        }

        return value;
    } catch (e) {
        return helper.message('"url" must be a valid URI');
    }
};

const screenshotScheme = {
    // image options
    image_quality: Joi.when("format", {
        is: Joi.valid(
            "jpeg",
            "jpg",
            "webp",
            "png",
            "tiff",
            "jp2",
            "avif",
            "heif"
        ),
        then: Joi.number().integer().min(0).max(100).default(100),
        otherwise: Joi.forbidden(),
    }),
    image_width: Joi.number().integer().optional(),
    image_height: Joi.number().integer().optional(),
    omit_background: Joi.when("format", {
        is: Joi.valid("png"),
        then: Joi.boolean().default(false),
        otherwise: Joi.forbidden(),
    }).messages({
        "any.unknown":
            'The "omit_background" option is only allowed to use with image formats that support transparent backgrounds, like PNG.',
    }),

    // full page options
    full_page: Joi.boolean().default(false),
    full_page_scroll: Joi.when("full_page", {
        is: true,
        then: Joi.boolean().default(true),
        otherwise: Joi.forbidden(),
    }),
    full_page_scroll_delay: Joi.when("full_page_scroll", {
        is: true,
        then: Joi.number().integer().positive().min(100).default(400),
        otherwise: Joi.forbidden(),
    }),
    full_page_scroll_by: Joi.when("full_page_scroll", {
        is: true,
        then: Joi.number().integer().positive(),
        otherwise: Joi.forbidden(),
    }),
    full_page_max_height: Joi.when("full_page", {
        is: true,
        then: Joi.number().integer().positive().optional(),
        otherwise: Joi.forbidden(),
    }),

    capture_beyond_viewport: Joi.boolean().default(true),

    selector: Joi.string().optional(),

    error_on_selector_not_found: Joi.boolean().default(false),

    scroll_into_view: Joi.string().optional(),
    scroll_into_view_adjust_top: Joi.number().integer().default(0),

    format: Joi.string()
        .trim()
        .lowercase()
        .valid(
            "png",
            "jpeg",
            "jpg",
            "webp",
            "gif",
            "jp2",
            "tiff",
            "avif",
            "heif",
            "html",
            "pdf"
        )
        .default("jpg"),

    metadata_image_size: Joi.boolean().default(false),
    metadata_fonts: Joi.boolean().default(false),
    metadata_content: Joi.boolean().default(false),

    clip_x: Joi.number().integer().optional(),
    clip_y: Joi.number().integer().optional(),
    clip_width: Joi.number().integer().optional(),
    clip_height: Joi.number().integer().optional(),

    vision_prompt: Joi.string().optional(),
    vision_max_tokens: Joi.string().optional(),
    openai_api_key: Joi.string().optional(),
};

const commonOptionsScheme = Joi.object({
    // URL or HTML is required
    url: Joi.string().trim().custom(validUri).optional(),
    html: Joi.string().optional(),
    markdown: Joi.string().optional(),

    response_type: Joi.string()
        .trim()
        .lowercase()
        .valid("by_format", "empty", "json")
        .default("by_format"),

    request_gpu_rendering: Joi.boolean().default(false),

    // emulation
    dark_mode: Joi.boolean().optional(),
    reduced_motion: Joi.boolean().optional(),
    media_type: Joi.string()
        .trim()
        .lowercase()
        .valid("screen", "print")
        .optional(),

    // customization options
    scripts: Joi.string().optional(),
    scripts_wait_until: Joi.array()
        .items(
            Joi.string().valid(
                "load",
                "domcontentloaded",
                "networkidle0",
                "networkidle2"
            )
        )
        .default([]),
    styles: Joi.string().optional(),
    hide_selectors: Joi.array().items(),
    click: Joi.string().optional(),

    // viewport options
    viewport_device: Joi.string()
        .valid(...devices.names)
        .optional(),
    viewport_width: Joi.number().integer().optional(),
    viewport_height: Joi.number().integer().optional(),
    device_scale_factor: Joi.number().min(1).max(5).optional(),
    viewport_mobile: Joi.boolean().optional(),
    viewport_has_touch: Joi.boolean().optional(),
    viewport_landscape: Joi.boolean().optional(),

    // geolocation options
    geolocation_latitude: Joi.number().min(-90).max(90).optional(),
    geolocation_longitude: Joi.number().min(-180).max(180).optional(),
    geolocation_accuracy: Joi.number().integer().positive().optional(),

    // location options
    ip_country_code: Joi.string()
        .valid(
            "us",
            "gb",
            "de",
            "it",
            "fr",
            "cn",
            "ca",
            "es",
            "jp",
            "kr",
            "in",
            "au",
            "br",
            "mx",
            "nz",
            "pe",
            "is",
            "ie"
        )
        .optional(),

    servers_region: Joi.string().valid("us-east").default("us-east"),

    // blocking options
    block_annoyances: Joi.boolean().default(false),
    block_cookie_banners: Joi.boolean().default(false),
    block_banners_by_heuristics: Joi.boolean().default(false),
    block_chats: Joi.boolean().default(false),
    block_ads: Joi.boolean().default(false),
    block_socials: Joi.boolean().default(false),
    block_trackers: Joi.boolean().default(false),
    block_requests: Joi.array().items(Joi.string()).default([]),
    block_resources: Joi.array()
        .items(
            Joi.string().valid(
                "document",
                "stylesheet",
                "image",
                "media",
                "font",
                "script",
                "texttrack",
                "xhr",
                "fetch",
                "eventsource",
                "websocket",
                "manifest",
                "other"
            )
        )
        .default([]),

    // cache options
    cache: Joi.boolean().default(false).optional(),
    cache_ttl: Joi.when("cache", {
        is: true,
        then: Joi.number()
            .integer()
            .min(14400) // 4 hours
            .max(2592000) // 1 month
            .default(14400)
            .optional(),
        otherwise: Joi.forbidden(),
    }),
    cache_key: Joi.when("cache", {
        is: true,
        then: Joi.string().alphanum().min(1).max(250).optional(),
        otherwise: Joi.forbidden(),
    }),

    // request options
    user_agent: Joi.string().optional(),
    authorization: Joi.string().optional(),
    headers: Joi.array().items(),
    cookies: Joi.array().items(),
    proxy: Joi.string()
        .uri({ scheme: ["http"] })
        .optional(),

    time_zone: Joi.string().valid(
        "America/Belize",
        "America/Cayman",
        "America/Chicago",
        "America/Costa_Rica",
        "America/Denver",
        "America/Edmonton",
        "America/El_Salvador",
        "America/Guatemala",
        "America/Guayaquil",
        "America/Hermosillo",
        "America/Jamaica",
        "America/Los_Angeles",
        "America/Mexico_City",
        "America/Nassau",
        "America/New_York",
        "America/Panama",
        "America/Port-au-Prince",
        "America/Santiago",
        "America/Tegucigalpa",
        "America/Tijuana",
        "America/Toronto",
        "America/Vancouver",
        "America/Winnipeg",
        "Asia/Kuala_Lumpur",
        "Asia/Shanghai",
        "Asia/Tashkent",
        "Europe/Berlin",
        "Europe/Kiev",
        "Europe/Lisbon",
        "Europe/London",
        "Europe/Madrid",
        "Pacific/Auckland",
        "Pacific/Majuro"
    ),

    // wait, timeout
    delay: Joi.number().integer().min(0).max(30).optional(),
    timeout: Joi.number().when("async", {
        is: true,
        then: Joi.number().integer().min(0).max(600).default(600),
        otherwise: Joi.number().integer().min(0).max(90).default(60),
    }),
    navigation_timeout: Joi.number().integer().min(0).max(30).default(30),
    wait_until: Joi.array()
        .items(
            Joi.string().valid(
                "load",
                "domcontentloaded",
                "networkidle0",
                "networkidle2"
            )
        )
        .default(["load"]),

    wait_for_selector: Joi.string().optional(),

    async: Joi.boolean().default(false),
    webhook_url: Joi.string()
        .trim()
        .custom(validUri)
        .when("response_type", {
            is: Joi.string().valid("json", "by_format"),
            then: Joi.optional(),
            otherwise: Joi.forbidden(),
        }),
    webhook_sign: Joi.boolean().default(true),

    // store
    store: Joi.boolean().optional(),
    storage_bucket: Joi.string().optional(),
    storage_path: Joi.string().when("store", {
        is: true,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
    storage_endpoint: Joi.string().uri().optional(),
    storage_access_key_id: Joi.string().optional(),
    storage_secret_access_key: Joi.string().optional(),
    storage_acl: Joi.string().valid("public-read", "").default(""),
    storage_class: Joi.string()
        .valid(
            "standard",
            "reduced_redundancy",
            "standard_ia",
            "onezone_ia",
            "intelligent_tiering",
            "glacier",
            "deep_archive",
            "outposts",
            "glacier_ir"
        )
        .default("standard"),
    storage_return_location: Joi.boolean().default(false),

    ignore_host_errors: Joi.boolean().default(false),
}).oxor("ip_country_code", "proxy");

const optionsScheme = commonOptionsScheme.append(screenshotScheme);

const withEssentialsOptionsScheme = optionsScheme.or("html", "url", "markdown");

const bulkScheme = Joi.object({
    optimize: Joi.boolean().default(false),
    execute: Joi.boolean().default(false),
    options: Joi.object(),
    requests: Joi.array().items(withEssentialsOptionsScheme).min(1).max(20),
});

const withHtmlOrUrlOrMarkdownRequired = commonOptionsScheme.or(
    "html",
    "url",
    "markdown"
);

const animateScheme = withHtmlOrUrlOrMarkdownRequired
    .append({
        format: Joi.string()
            .trim()
            .lowercase()
            .valid("mp4", "avi", "mov", "webm", "gif")
            .default("mp4"),
        duration: Joi.number().min(1).max(30).default(5),

        width: Joi.number().integer().optional(),
        height: Joi.number().integer().optional(),
        aspect_ratio: Joi.string()
            .trim()
            .lowercase()
            .valid("4:3", "16:9")
            .default("4:3"),

        scenario: Joi.string()
            .trim()
            .lowercase()
            .valid("", "default", "scroll")
            .default("default"),

        // scroll scenario parameters
        scroll_duration: Joi.number().min(100).default(1500),
        scroll_delay: Joi.number().min(0).default(500),
        scroll_by: Joi.number().min(1).default(1000),
        scroll_start_immediately: Joi.boolean().default(true),
        scroll_start_delay: Joi.number().min(0).default(0),
        scroll_complete: Joi.boolean().default(true),
        scroll_back_after_duration: Joi.number().integer().optional(),
        scroll_back: Joi.boolean().default(true),

        scroll_stop_after_duration: Joi.when("scroll_back", {
            is: false,
            then: Joi.number().integer().optional(),
            otherwise: Joi.forbidden(),
        }),

        scroll_easing: Joi.string()
            .trim()
            .lowercase()
            .valid(
                "linear",
                "ease_in_quad",
                "ease_out_quad",
                "ease_in_out_quad",
                "ease_in_cubic",
                "ease_out_cubic",
                "ease_in_out_cubic",
                "ease_in_quart",
                "ease_out_quart",
                "ease_in_out_quart",
                "ease_in_quint",
                "ease_out_quint",
                "ease_in_out_quint"
            )
            .default("ease_in_out_quint"),
    })
    .oxor("scroll_stop_after_duration", "scroll_back_after_duration");

export default {
    animate: {
        getScheme: animateScheme.append({
            ...accessKeyScheme,
            ...signatureScheme,
        }),
        postScheme: animateScheme.append({ ...accessKeyScheme }),
        validationOptions,
    },
    bulk: {
        postScheme: bulkScheme.append(accessKeyScheme),
        validationOptions,
    },
    take: {
        getScheme: withEssentialsOptionsScheme.append({
            ...accessKeyScheme,
            ...signatureScheme,
        }),
        postScheme: withEssentialsOptionsScheme.append({ ...accessKeyScheme }),
        validationOptions,
    },
};
