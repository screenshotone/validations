import { describe, expect, test } from "@jest/globals";
import validationSchemes from "./main";

describe("URL validations", () => {
    test("https://https://example.com must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { url: "https://https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeDefined();
    });

    test("http://https://example.com must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { url: "http://https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeDefined();
    });

    test("https:// must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { url: "https://" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeDefined();
    });

    test("https://example.com must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("https://example.com:80 must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { url: "https://example.com:80" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("https://1.1.1.1:80 must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { url: "https://1.1.1.1:80" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("https://1.1.1.1 must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { url: "https://1.1.1.1" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("proxy with http://example.com must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://example.com", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("proxy with http://example.com:8080 must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://example.com:8080", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("proxy with http://1.1.1.1 must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://1.1.1.1", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("proxy with http://1.1.1.1:8080 must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://1.1.1.1:8080", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeUndefined();
    });

    test("proxy with https://example.com must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { proxy: "https://example.com", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeDefined();
    });

    test("proxy with invalid URL must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { proxy: "not-a-url", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(error).toBeDefined();
    });

    test("proxy with auth credentials must be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            {
                proxy: "http://user:pass@example.com:8080",
                url: "https://example.com",
            },
            validationSchemes.take.validationOptions
        );

        expect(() => new URL(value.proxy)).not.toThrow();
        expect(error).toBeUndefined();
    });

    test("proxy with unicode characters should be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://münchen.de", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(() => new URL(value.proxy)).not.toThrow();
        expect(error).toBeUndefined();
    });

    test("proxy with spaces should not be valid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://proxy server.com", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(() => new URL(value.proxy)).toThrow();
        expect(error).toBeDefined();
    });

    test("proxy with unescaped brackets must invalid", async () => {
        const { error, value } = validationSchemes.take.getScheme.validate(
            { proxy: "http://proxy[1].com", url: "https://example.com" },
            validationSchemes.take.validationOptions
        );

        expect(() => new URL(value.proxy)).toThrow();
        expect(error).toBeDefined();
    });
});
