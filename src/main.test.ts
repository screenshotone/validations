import { describe, expect, test } from "@jest/globals";
import validationSchemes from "./main";

describe("URL validations", () => {
    test("https://https://example.com must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { url: "https://https://example.com" },
            validationSchemes.take.validationOptions
        );

        console.log(error);

        expect(error).toBeDefined();
    });

    test("http://https://example.com must be invalid", async () => {
        const { error } = validationSchemes.take.getScheme.validate(
            { url: "http://https://example.com" },
            validationSchemes.take.validationOptions
        );

        console.log(error);

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
});
