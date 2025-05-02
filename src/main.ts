import Joi from "joi";
import devices from "screenshotone-devices";

const validationOptions = { abortEarly: false };

const accessKeyScheme = {
    access_key: Joi.string().optional(),
};
const signatureScheme = {
    signature: Joi.string().optional(),
};

const createUriValidator = (fieldName: string) => {
    return (value: string, helper: any) => {
        try {
            if (!value) {
                return helper.message(`"${fieldName}" must be specified`);
            }

            if (value.trim().length === 0 || value.trim() !== value) {
                return helper.message(
                    `"${fieldName}" must be specified without leading and trailing white spaces`
                );
            }

            const u = new URL(value);

            if (u.protocol !== "http:" && u.protocol !== "https:") {
                return helper.message(
                    `"${fieldName}" must be a valid URI with a scheme matching the http|https pattern`
                );
            }

            const withoutProtocol = value.substring((u.protocol + "//").length);
            if (
                withoutProtocol.startsWith("http://") ||
                withoutProtocol.startsWith("https://")
            ) {
                return helper.message(
                    `"${fieldName}" must be a valid URI with a scheme matching the http|https pattern`
                );
            }

            return value;
        } catch (e) {
            return helper.message(`"${fieldName}" must be a valid URI`);
        }
    };
};

const validUri = createUriValidator("url");

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
    full_page_algorithm: Joi.when("full_page", {
        is: true,
        then: Joi.string().valid("by_sections", "default").default("default"),
        otherwise: Joi.forbidden(),
    }),

    capture_beyond_viewport: Joi.when("selector", {
        is: Joi.string().required(),
        then: Joi.boolean().default(true),
        otherwise: Joi.boolean().default(Joi.ref("full_page")),
    }),

    selector: Joi.when("format", {
        is: Joi.valid("pdf"),
        then: Joi.forbidden(),
        otherwise: Joi.string().optional(),
    }).messages({
        "any.unknown": 'Rendering PDFs by "selector" is not allowed.',
    }),
    selector_algorithm: Joi.when("selector", {
        is: Joi.string().required(),
        then: Joi.string().valid("clip", "default").default("default"),
        otherwise: Joi.forbidden(),
    }),
    selector_scroll_into_view: Joi.when("selector", {
        is: Joi.string().required(),
        then: Joi.boolean().default(true),
        otherwise: Joi.forbidden(),
    }),

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
            "pdf",
            "markdown"
        )
        .default("jpg"),

    metadata_image_size: Joi.boolean().default(false),

    clip_x: Joi.number().integer().optional(),
    clip_y: Joi.number().integer().optional(),
    clip_width: Joi.number().integer().optional(),
    clip_height: Joi.number().integer().optional(),

    vision_prompt: Joi.string().optional(),
    vision_max_tokens: Joi.number().integer().optional(),
    openai_api_key: Joi.string().optional(),

    pdf_print_background: Joi.boolean().optional(),
    pdf_fit_one_page: Joi.boolean().optional(),
    pdf_landscape: Joi.boolean().optional(),
    pdf_paper_format: Joi.string()
        .valid(
            "a0",
            "a1",
            "a2",
            "a3",
            "a4",
            "a5",
            "a6",
            "legal",
            "letter",
            "tabloid"
        )
        .optional(),
};

const commonOptionsScheme = Joi.object({
    // URL or HTML is required
    url: Joi.string().custom(validUri).optional(),
    html: Joi.string().optional(),
    markdown: Joi.string().optional(),

    response_type: Joi.string()
        .trim()
        .lowercase()
        .valid("by_format", "empty", "json")
        .default("by_format"),

    request_gpu_rendering: Joi.boolean().default(false),
    fail_if_gpu_rendering_fails: Joi.boolean().default(false),
    include_shadow_dom: Joi.boolean().default(false),

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
    error_on_click_selector_not_found: Joi.boolean().default(true),

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
        otherwise: Joi.forbidden().messages({
            "any.unknown":
                "The `cache_ttl` option cannot be used when the `cache` option is false or not set.",
        }),
    }),
    cache_key: Joi.when("cache", {
        is: true,
        then: Joi.string().alphanum().min(1).max(250).optional(),
        otherwise: Joi.forbidden().messages({
            "any.unknown":
                "The `cache_key` option cannot be used when the `cache` option is false or not set.",
        }),
    }),

    // request options
    user_agent: Joi.string().optional(),
    authorization: Joi.string().optional(),
    headers: Joi.array().items(),
    cookies: Joi.array().items(),

    proxy: Joi.string()
        // `encodeUri` allows to specify Unicode characters in the proxy URI
        // it is useful when targeting is used in proxies and cities or countries are specified
        // with special characters
        .uri({ scheme: ["http"], encodeUri: true })
        // makes sense to double-check it, since it will be anyway validated and fail if not correct
        .custom(createUriValidator("proxy"))
        .optional(),

    attachment_name: Joi.string().optional(),

    bypass_csp: Joi.boolean().default(false).optional(),

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
    delay: Joi.number()
        .integer()
        .min(0)
        .when("timeout", {
            is: Joi.number().greater(300),
            then: Joi.number().max(300),
            otherwise: Joi.number().max(30),
        })
        .optional(),
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
        .default([]),

    wait_for_selector: Joi.string().optional(),
    wait_for_selector_algorithm: Joi.string()
        .valid("at_least_one", "at_least_by_count")
        .default("at_least_one")
        .optional(),
    fail_if_content_contains: Joi.array()
        .items(Joi.string().optional())
        .default([]),
    fail_if_content_missing: Joi.array()
        .items(Joi.string().optional())
        .default([]),
    fail_if_request_failed: Joi.array()
        .items(Joi.string().optional())
        .default([]),

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
    webhook_errors: Joi.boolean().default(false),
    external_identifier: Joi.string().alphanum().min(1).max(64).optional(),

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

    metadata_fonts: Joi.boolean().default(false),
    metadata_content: Joi.boolean().default(false),
    metadata_page_title: Joi.boolean().default(false),
    metadata_open_graph: Joi.boolean().default(false),
    metadata_http_response_status_code: Joi.boolean()
        .default(false)
        .when("url", {
            is: Joi.exist(),
            then: Joi.boolean(),
            otherwise: Joi.forbidden(),
        }),
    metadata_http_response_headers: Joi.boolean().default(false).when("url", {
        is: Joi.exist(),
        then: Joi.boolean(),
        otherwise: Joi.forbidden(),
    }),
    metadata_icon: Joi.boolean().default(false),
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

        omit_background: Joi.when("format", {
            is: Joi.valid("mov"),
            then: Joi.boolean().default(false),
            otherwise: Joi.forbidden(),
        }),

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
        scroll_back_algorithm: Joi.string()
            .trim()
            .lowercase()
            .valid("once", "repeat")
            .default("once"),

        scroll_stop_after_duration: Joi.when("scroll_back", {
            is: false,
            then: Joi.number().integer().optional(),
            otherwise: Joi.forbidden(),
        }),

        scroll_till_selector: Joi.string().optional(),
        scroll_till_selector_adjust_top: Joi.number().integer().optional(),

        scroll_try_navigate: Joi.boolean().default(false).optional(),
        scroll_navigate_after: Joi.number().integer().optional(),
        scroll_navigate_to_url: Joi.string().custom(validUri).optional(),
        scroll_navigate_link_hints: Joi.array()
            .items(Joi.string().trim())
            .default(["pricing", "about", "customers"])
            .optional(),

        scroll_to_end_after: Joi.when("scenario", {
            is: Joi.valid("scroll"),
            then: Joi.number().integer().optional(),
            otherwise: Joi.forbidden(),
        }),

        clip_x: Joi.when("format", {
            is: Joi.valid("gif"),
            then: Joi.number().integer().optional(),
            otherwise: Joi.forbidden(),
        }),
        clip_y: Joi.when("format", {
            is: Joi.valid("gif"),
            then: Joi.number().integer().optional(),
            otherwise: Joi.forbidden(),
        }),
        clip_height: Joi.when("format", {
            is: Joi.valid("gif"),
            then: Joi.number().integer().optional(),
            otherwise: Joi.forbidden(),
        }),
        clip_width: Joi.when("format", {
            is: Joi.valid("gif"),
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
